import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { getSupabaseClient, isSupabaseConfigured } from '../services/supabaseClient';
import { listGroups, createGroup, deleteGroup as removeGroup } from '../services/groups';
import {
  listStudents,
  createStudent as persistStudent,
  deleteStudent as removeStudent,
  updateStudent as persistStudentUpdate
} from '../services/students';
import {
  listPayments,
  createPayment as persistPayment,
  updatePayment as persistPaymentUpdate,
  deletePayment as removePayment
} from '../services/payments';
import {
  listExpenses,
  createExpense as persistExpense,
  updateExpense as persistExpenseUpdate,
  deleteExpense as removeExpense
} from '../services/expenses';
import {
  fetchSettings,
  saveSettings,
  fetchGroupOverrides,
  saveGroupOverride,
  fetchStudentOverrides,
  saveStudentOverride,
  computeEffectiveReminderDays
} from '../services/settings';
import { createUser, findUserByPhone } from '../services/users';
import {
  demoUser,
  demoGroups,
  demoStudents,
  demoPayments,
  demoExpenses,
  demoSettings,
  demoGroupSettings,
  demoStudentSettings
} from '../services/demoData';

const AppDataContext = createContext();

const SESSION_STORAGE_KEY = 'personal-accountant-session';

const hashPassword = async (value) => {
  if (!value) return '';
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(value);
    const subtle = globalThis.crypto?.subtle;
    if (subtle) {
      const hashBuffer = await subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (error) {
    console.warn('تعذر إنشاء تجزئة للرقم السري، سيتم حفظه كما هو.', error);
  }
  return value;
};

export function AppDataProvider({ children }) {
  const supabase = getSupabaseClient();
  const supabaseReady = isSupabaseConfigured();

  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settings, setSettings] = useState(null);
  const [groupOverrides, setGroupOverrides] = useState([]);
  const [studentOverrides, setStudentOverrides] = useState([]);

  const userId = session?.user?.id;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.user) {
          setSession(parsed);
        }
      }
    } catch (error) {
      console.warn('تعذر قراءة الجلسة المخزنة:', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (session?.user) {
        window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      } else {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (error) {
      console.warn('تعذر تحديث الجلسة في التخزين المحلي:', error);
    }
  }, [session]);

  const loadAllData = useCallback(
    async (userId) => {
      if (!userId) return;
      setLoading(true);
      try {
        const tasks = [
          {
            loader: () => listGroups(supabase, userId),
            setter: setGroups,
            fallback: demoGroups
          },
          {
            loader: () => listStudents(supabase, userId),
            setter: setStudents,
            fallback: demoStudents
          },
          {
            loader: () => listPayments(supabase, userId),
            setter: setPayments,
            fallback: demoPayments
          },
          {
            loader: () => listExpenses(supabase, userId),
            setter: setExpenses,
            fallback: demoExpenses
          },
          {
            loader: () => fetchSettings(supabase, userId),
            setter: setSettings,
            fallback: { user_id: userId ?? 'demo-user', ...demoSettings }
          },
          {
            loader: () => fetchGroupOverrides(supabase, userId),
            setter: setGroupOverrides,
            fallback: demoGroupSettings
          },
          {
            loader: () => fetchStudentOverrides(supabase, userId),
            setter: setStudentOverrides,
            fallback: demoStudentSettings
          }
        ];

        const results = await Promise.allSettled(tasks.map((task) => task.loader()));
        let hadError = false;

        results.forEach((result, index) => {
          const { setter, fallback } = tasks[index];
          if (result.status === 'fulfilled') {
            setter(result.value ?? fallback);
          } else {
            hadError = true;
            console.error('تعذر تحميل بيانات التطبيق:', result.reason);
            setter(fallback);
          }
        });

        if (hadError) {
          toast.error('تعذر تحميل بعض البيانات من Supabase، تم استخدام بيانات محلية مؤقتًا.');
        }
      } catch (error) {
        console.error('حدث خطأ أثناء تحميل البيانات:', error);
        toast.error('تعذر تحميل البيانات، سيتم استخدام بيانات تجريبية.');
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    if (!userId) return;
    loadAllData(userId);
  }, [loadAllData, userId, supabaseReady]);

  const signIn = useCallback(
    async ({ phone, password }) => {
      if (!phone || !password) {
        toast.error('يرجى إدخال رقم الجوال وكلمة المرور');
        return;
      }
      try {
        const hashed = await hashPassword(password);
        const userRecord = await findUserByPhone(supabase, phone, { fallbackToDemo: !supabase });
        if (!userRecord) {
          toast.error('رقم الجوال غير مسجل');
          return;
        }
        if (supabase && userRecord.password_hash !== hashed) {
          toast.error('بيانات الدخول غير صحيحة');
          return;
        }
        const fallbackUser = { ...demoUser, phone, name: userRecord?.name ?? 'أ. مستخدم' };
        const user = userRecord ?? fallbackUser;
        setSession({ user });
        toast.success('مرحبًا بعودتك!');
      } catch (error) {
        console.error('خطأ أثناء تسجيل الدخول:', error);
        toast.error('حدث خطأ غير متوقع أثناء تسجيل الدخول');
      }
    },
    [supabase]
  );

  const signUp = useCallback(
    async ({ name, phone, password }) => {
      if (!name || !phone || !password) {
        toast.error('يرجى إكمال جميع الحقول المطلوبة');
        return;
      }
      try {
        if (supabase) {
          const existing = await findUserByPhone(supabase, phone, { fallbackToDemo: false });
          if (existing) {
            toast.error('رقم الجوال مسجل مسبقًا، حاول تسجيل الدخول.');
            return;
          }
        }
        const hashed = await hashPassword(password);
        const payload = {
          name,
          phone,
          password_hash: hashed,
          created_at: new Date().toISOString()
        };
        const user = supabase ? await createUser(supabase, payload) : { ...demoUser, name, phone };
        setSession({ user });
        toast.success('تم إنشاء الحساب بنجاح');
      } catch (error) {
        console.error('خطأ أثناء إنشاء الحساب:', error);
        toast.error('تعذر إنشاء الحساب حاليًا');
      }
    },
    [supabase]
  );

  const signOut = useCallback(() => {
    setSession(null);
    setGroups(demoGroups);
    setStudents(demoStudents);
    setPayments(demoPayments);
    setExpenses(demoExpenses);
    setSettings(null);
    setGroupOverrides([]);
    setStudentOverrides([]);
    toast.success('تم تسجيل الخروج');
  }, []);

  const addGroup = useCallback(
    async (name) => {
      const trimmed = name?.trim();
      if (!trimmed) {
        toast.error('اسم المجموعة مطلوب');
        return;
      }
      if (!userId) {
        toast.error('يرجى تسجيل الدخول لإدارة المجموعات.');
        return;
      }
      try {
        const newGroup = await createGroup(supabase, { name: trimmed, user_id: userId });
        setGroups((prev) => [...prev, newGroup]);
        toast.success('تمت إضافة المجموعة');
      } catch (error) {
        console.error('تعذر إضافة المجموعة:', error);
        toast.error('تعذر إضافة المجموعة الآن');
      }
    },
    [supabase, userId]
  );

  const deleteGroup = useCallback(
    async (groupId) => {
      if (groups.length <= 1) {
        toast.error('لا يمكن حذف آخر مجموعة');
        return;
      }
      if (!userId) {
        toast.error('يرجى تسجيل الدخول لإدارة المجموعات.');
        return;
      }
      try {
        await removeGroup(supabase, groupId, userId);
        setGroups((prev) => prev.filter((group) => group.id !== groupId));
        toast.success('تم حذف المجموعة');
      } catch (error) {
        console.error('تعذر حذف المجموعة:', error);
        toast.error('تعذر حذف المجموعة الآن');
      }
    },
    [groups.length, supabase, userId]
  );

  const addStudent = useCallback(
    async (payload) => {
      if (!userId) {
        toast.error('يرجى تسجيل الدخول لإدارة الطلاب.');
        return;
      }
      try {
        const newStudent = await persistStudent(supabase, { ...payload, user_id: userId });
        setStudents((prev) => [newStudent, ...prev]);
        toast.success('تم تسجيل الطالب بنجاح');
      } catch (error) {
        console.error('تعذر تسجيل الطالب:', error);
        toast.error('تعذر تسجيل الطالب حاليًا');
      }
    },
    [supabase, userId]
  );

  const updateStudent = useCallback(
    async (id, payload) => {
      if (!userId) {
        toast.error('يرجى تسجيل الدخول لإدارة الطلاب.');
        return;
      }
      try {
        const updatedStudent = await persistStudentUpdate(supabase, id, payload, userId);
        setStudents((prev) => prev.map((student) => (student.id === id ? { ...student, ...updatedStudent } : student)));
        toast.success('تم تحديث بيانات الطالب');
      } catch (error) {
        console.error('تعذر تحديث بيانات الطالب:', error);
        toast.error('تعذر تحديث بيانات الطالب حاليًا');
      }
    },
    [supabase, userId]
  );

  const deleteStudent = useCallback(
    async (id) => {
      if (!userId) {
        toast.error('يرجى تسجيل الدخول لإدارة الطلاب.');
        return;
      }
      try {
        await removeStudent(supabase, id, userId);
        setStudents((prev) => prev.filter((student) => student.id !== id));
        toast.success('تم حذف الطالب');
      } catch (error) {
        console.error('تعذر حذف الطالب:', error);
        toast.error('تعذر حذف الطالب الآن');
      }
    },
    [supabase, userId]
  );

  const addPayment = useCallback(
    async (payload) => {
      if (!userId) {
        toast.error('يرجى تسجيل الدخول لإدارة الدفعات.');
        return;
      }
      try {
        const normalizedPayload = {
          ...payload,
          amount: Number(payload.amount ?? 0),
          user_id: userId
        };
        const newPayment = await persistPayment(supabase, normalizedPayload);
        setPayments((prev) => [newPayment, ...prev]);
        toast.success('تمت إضافة الدفعة');
      } catch (error) {
        console.error('تعذر إضافة الدفعة:', error);
        toast.error('تعذر إضافة الدفعة حاليًا');
      }
    },
    [supabase, userId]
  );

  const updatePayment = useCallback(
    async (id, payload) => {
      if (!userId) {
        toast.error('يرجى تسجيل الدخول لإدارة الدفعات.');
        return;
      }
      try {
        const normalizedPayload = { ...payload, amount: Number(payload.amount ?? 0) };
        const updatedPayment = await persistPaymentUpdate(supabase, id, normalizedPayload, userId);
        setPayments((prev) => prev.map((payment) => (payment.id === id ? { ...payment, ...updatedPayment } : payment)));
        toast.success('تم تحديث الدفعة');
      } catch (error) {
        console.error('تعذر تحديث الدفعة:', error);
        toast.error('تعذر تحديث الدفعة الآن');
      }
    },
    [supabase, userId]
  );

  const deletePayment = useCallback(
    async (id) => {
      if (!userId) {
        toast.error('يرجى تسجيل الدخول لإدارة الدفعات.');
        return;
      }
      try {
        await removePayment(supabase, id, userId);
        setPayments((prev) => prev.filter((payment) => payment.id !== id));
        toast.success('تم حذف الدفعة');
      } catch (error) {
        console.error('تعذر حذف الدفعة:', error);
        toast.error('تعذر حذف الدفعة الآن');
      }
    },
    [supabase, userId]
  );

  const addExpense = useCallback(
    async (payload) => {
      if (!userId) {
        toast.error('يرجى تسجيل الدخول لإدارة المصروفات.');
        return;
      }
      try {
        const normalizedPayload = {
          ...payload,
          amount: Number(payload.amount ?? 0),
          user_id: userId
        };
        const newExpense = await persistExpense(supabase, normalizedPayload);
        setExpenses((prev) => [newExpense, ...prev]);
        toast.success('تمت إضافة المصروف');
      } catch (error) {
        console.error('تعذر إضافة المصروف:', error);
        toast.error('تعذر إضافة المصروف الآن');
      }
    },
    [supabase, userId]
  );

  const updateExpense = useCallback(
    async (id, payload) => {
      if (!userId) {
        toast.error('يرجى تسجيل الدخول لإدارة المصروفات.');
        return;
      }
      try {
        const normalizedPayload = { ...payload, amount: Number(payload.amount ?? 0) };
        const updatedExpense = await persistExpenseUpdate(supabase, id, normalizedPayload, userId);
        setExpenses((prev) => prev.map((expense) => (expense.id === id ? { ...expense, ...updatedExpense } : expense)));
        toast.success('تم تحديث المصروف');
      } catch (error) {
        console.error('تعذر تحديث المصروف:', error);
        toast.error('تعذر تحديث المصروف الآن');
      }
    },
    [supabase, userId]
  );

  const deleteExpense = useCallback(
    async (id) => {
      if (!userId) {
        toast.error('يرجى تسجيل الدخول لإدارة المصروفات.');
        return;
      }
      try {
        await removeExpense(supabase, id, userId);
        setExpenses((prev) => prev.filter((expense) => expense.id !== id));
        toast.success('تم حذف المصروف');
      } catch (error) {
        console.error('تعذر حذف المصروف:', error);
        toast.error('تعذر حذف المصروف الآن');
      }
    },
    [supabase, userId]
  );

  const saveReminderSettings = useCallback(
    async (payload) => {
      if (!userId) {
        toast.error('يرجى تسجيل الدخول لإدارة الإعدادات.');
        return;
      }
      try {
        const updated = await saveSettings(supabase, {
          ...payload,
          user_id: userId
        });
        setSettings(updated);
        toast.success('تم حفظ إعدادات التذكير');
      } catch (error) {
        console.error('تعذر حفظ الإعدادات العامة:', error);
        toast.error('تعذر حفظ إعدادات التذكير حاليًا');
      }
    },
    [supabase, userId]
  );

  const saveGroupReminder = useCallback(
    async (groupId, payload) => {
      if (!userId) {
        toast.error('يرجى تسجيل الدخول لإدارة الإعدادات.');
        return;
      }
      try {
        const updated = await saveGroupOverride(supabase, { user_id: userId, group_id: groupId, ...payload });
        setGroupOverrides((prev) => {
          const exists = prev.find((item) => item.group_id === groupId);
          if (exists) {
            return prev.map((item) => (item.group_id === groupId ? updated : item));
          }
          return [...prev, updated];
        });
        toast.success('تم حفظ إعدادات المجموعة');
      } catch (error) {
        console.error('تعذر حفظ إعدادات المجموعة:', error);
        toast.error('تعذر حفظ إعدادات المجموعة الآن');
      }
    },
    [supabase, userId]
  );

  const saveStudentReminder = useCallback(
    async (studentId, payload) => {
      if (!userId) {
        toast.error('يرجى تسجيل الدخول لإدارة الإعدادات.');
        return;
      }
      try {
        const updated = await saveStudentOverride(supabase, { user_id: userId, student_id: studentId, ...payload });
        setStudentOverrides((prev) => {
          const exists = prev.find((item) => item.student_id === studentId);
          if (exists) {
            return prev.map((item) => (item.student_id === studentId ? updated : item));
          }
          return [...prev, updated];
        });
        toast.success('تم حفظ إعدادات الطالب');
      } catch (error) {
        console.error('تعذر حفظ إعدادات الطالب:', error);
        toast.error('تعذر حفظ إعدادات الطالب الآن');
      }
    },
    [supabase, userId]
  );

  const getEffectiveReminderDays = useCallback(
    (studentId, groupId) =>
      computeEffectiveReminderDays(studentId, groupId, settings, groupOverrides, studentOverrides),
    [groupOverrides, settings, studentOverrides]
  );

  const totalIncome = useMemo(
    () => payments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0),
    [payments]
  );

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0),
    [expenses]
  );

  const netIncome = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);

  const payingStudents = useMemo(() => new Set(payments.map((payment) => payment.student_id)).size, [payments]);

  const groupedPayments = useMemo(() => {
    return payments.reduce((acc, payment) => {
      const monthKey = format(parseISO(payment.date), 'MMMM yyyy', { locale: ar });
      if (!acc[monthKey]) acc[monthKey] = [];
      acc[monthKey].push(payment);
      return acc;
    }, {});
  }, [payments]);

  const groupedExpenses = useMemo(() => {
    return expenses.reduce((acc, expense) => {
      const monthKey = format(parseISO(expense.date), 'MMMM yyyy', { locale: ar });
      if (!acc[monthKey]) acc[monthKey] = [];
      acc[monthKey].push(expense);
      return acc;
    }, {});
  }, [expenses]);

  const value = {
    loading,
    supabase,
    session,
    settings,
    groupOverrides,
    studentOverrides,
    setSession,
    signIn,
    signUp,
    signOut,
    groups,
    students,
    payments,
    expenses,
    totalIncome,
    totalExpenses,
    netIncome,
    payingStudents,
    groupedPayments,
    groupedExpenses,
    addGroup,
    deleteGroup,
    addStudent,
    updateStudent,
    deleteStudent,
    addPayment,
    updatePayment,
    deletePayment,
    addExpense,
    updateExpense,
    deleteExpense,
    saveReminderSettings,
    saveGroupReminder,
    saveStudentReminder,
    getEffectiveReminderDays
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return context;
};
