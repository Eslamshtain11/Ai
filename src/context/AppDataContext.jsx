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
import { demoUser } from '../services/demoData';

const AppDataContext = createContext();

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

  const loadAllData = useCallback(
    async (userId) => {
      if (!userId) return;
      setLoading(true);
      try {
        const [groupsData, studentsData, paymentsData, expensesData, settingsData, groupSettings, studentSettings] =
          await Promise.all([
            listGroups(supabase),
            listStudents(supabase),
            listPayments(supabase),
            listExpenses(supabase),
            fetchSettings(supabase, userId),
            fetchGroupOverrides(supabase),
            fetchStudentOverrides(supabase)
          ]);

        setGroups(groupsData);
        setStudents(studentsData);
        setPayments(paymentsData);
        setExpenses(expensesData);
        setSettings(settingsData);
        setGroupOverrides(groupSettings);
        setStudentOverrides(studentSettings);
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
    if (!session?.user?.id) return;
    loadAllData(session.user.id);
  }, [loadAllData, session?.user?.id, supabaseReady]);

  const signIn = useCallback(
    async ({ phone, password }) => {
      if (!phone || !password) {
        toast.error('يرجى إدخال رقم الجوال وكلمة المرور');
        return;
      }
      try {
        const hashed = await hashPassword(password);
        const userRecord = await findUserByPhone(supabase, phone);
        if (supabase && (!userRecord || userRecord.password_hash !== hashed)) {
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
    toast.success('تم تسجيل الخروج');
  }, []);

  const addGroup = useCallback(
    async (name) => {
      const trimmed = name?.trim();
      if (!trimmed) {
        toast.error('اسم المجموعة مطلوب');
        return;
      }
      const newGroup = await createGroup(supabase, { name: trimmed });
      setGroups((prev) => [...prev, newGroup]);
      toast.success('تمت إضافة المجموعة');
    },
    [supabase]
  );

  const deleteGroup = useCallback(
    async (groupId) => {
      if (groups.length <= 1) {
        toast.error('لا يمكن حذف آخر مجموعة');
        return;
      }
      await removeGroup(supabase, groupId);
      setGroups((prev) => prev.filter((group) => group.id !== groupId));
      toast.success('تم حذف المجموعة');
    },
    [groups.length, supabase]
  );

  const addStudent = useCallback(
    async (payload) => {
      const newStudent = await persistStudent(supabase, payload);
      setStudents((prev) => [newStudent, ...prev]);
      toast.success('تم تسجيل الطالب بنجاح');
    },
    [supabase]
  );

  const updateStudent = useCallback(
    async (id, payload) => {
      const updatedStudent = await persistStudentUpdate(supabase, id, payload);
      setStudents((prev) => prev.map((student) => (student.id === id ? { ...student, ...updatedStudent } : student)));
      toast.success('تم تحديث بيانات الطالب');
    },
    [supabase]
  );

  const deleteStudent = useCallback(
    async (id) => {
      await removeStudent(supabase, id);
      setStudents((prev) => prev.filter((student) => student.id !== id));
      toast.success('تم حذف الطالب');
    },
    [supabase]
  );

  const addPayment = useCallback(
    async (payload) => {
      const newPayment = await persistPayment(supabase, payload);
      setPayments((prev) => [newPayment, ...prev]);
      toast.success('تمت إضافة الدفعة');
    },
    [supabase]
  );

  const updatePayment = useCallback(
    async (id, payload) => {
      const updatedPayment = await persistPaymentUpdate(supabase, id, payload);
      setPayments((prev) => prev.map((payment) => (payment.id === id ? { ...payment, ...updatedPayment } : payment)));
      toast.success('تم تحديث الدفعة');
    },
    [supabase]
  );

  const deletePayment = useCallback(
    async (id) => {
      await removePayment(supabase, id);
      setPayments((prev) => prev.filter((payment) => payment.id !== id));
      toast.success('تم حذف الدفعة');
    },
    [supabase]
  );

  const addExpense = useCallback(
    async (payload) => {
      const newExpense = await persistExpense(supabase, payload);
      setExpenses((prev) => [newExpense, ...prev]);
      toast.success('تمت إضافة المصروف');
    },
    [supabase]
  );

  const updateExpense = useCallback(
    async (id, payload) => {
      const updatedExpense = await persistExpenseUpdate(supabase, id, payload);
      setExpenses((prev) => prev.map((expense) => (expense.id === id ? { ...expense, ...updatedExpense } : expense)));
      toast.success('تم تحديث المصروف');
    },
    [supabase]
  );

  const deleteExpense = useCallback(
    async (id) => {
      await removeExpense(supabase, id);
      setExpenses((prev) => prev.filter((expense) => expense.id !== id));
      toast.success('تم حذف المصروف');
    },
    [supabase]
  );

  const saveReminderSettings = useCallback(
    async (payload) => {
      if (!session?.user?.id) return;
      const updated = await saveSettings(supabase, {
        ...payload,
        user_id: session.user.id
      });
      setSettings(updated);
      toast.success('تم حفظ إعدادات التذكير');
    },
    [session?.user?.id, supabase]
  );

  const saveGroupReminder = useCallback(
    async (groupId, payload) => {
      const updated = await saveGroupOverride(supabase, { group_id: groupId, ...payload });
      setGroupOverrides((prev) => {
        const exists = prev.find((item) => item.group_id === groupId);
        if (exists) {
          return prev.map((item) => (item.group_id === groupId ? updated : item));
        }
        return [...prev, updated];
      });
      toast.success('تم حفظ إعدادات المجموعة');
    },
    [supabase]
  );

  const saveStudentReminder = useCallback(
    async (studentId, payload) => {
      const updated = await saveStudentOverride(supabase, { student_id: studentId, ...payload });
      setStudentOverrides((prev) => {
        const exists = prev.find((item) => item.student_id === studentId);
        if (exists) {
          return prev.map((item) => (item.student_id === studentId ? updated : item));
        }
        return [...prev, updated];
      });
      toast.success('تم حفظ إعدادات الطالب');
    },
    [supabase]
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
