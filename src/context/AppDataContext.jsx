import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { getSupabaseClient } from '../services/supabaseClient';
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
import {
  demoGroups,
  demoStudents,
  demoPayments,
  demoExpenses,
  demoSettings,
  demoGroupSettings,
  demoStudentSettings
} from '../services/demoData';

const AppDataContext = createContext();

export function AppDataProvider({ children }) {
  const supabase = getSupabaseClient();

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

  const resetData = useCallback(() => {
    setLoading(false);
    setGroups([]);
    setStudents([]);
    setPayments([]);
    setExpenses([]);
    setSettings(null);
    setGroupOverrides([]);
    setStudentOverrides([]);
  }, []);

  const resolveUserId = useCallback(async () => {
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error('تعذر الحصول على المستخدم الحالي من Supabase:', error);
          return null;
        }
        return data?.user?.id ?? null;
      } catch (error) {
        console.error('خطأ غير متوقع أثناء الحصول على المستخدم الحالي:', error);
        return null;
      }
    }
    return userId ?? null;
  }, [supabase, userId]);

  useEffect(() => {
    if (!supabase) {
      setSession(null);
      return;
    }

    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error('تعذر استرجاع جلسة Supabase الحالية:', error);
          return;
        }
        if (isMounted) {
          setSession(data.session ?? null);
        }
      })
      .catch((error) => {
        console.error('خطأ غير متوقع أثناء جلب الجلسة:', error);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [supabase]);

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
    if (!userId) {
      resetData();
      return;
    }
    loadAllData(userId);
  }, [loadAllData, resetData, userId]);

  const signOut = useCallback(async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('تعذر تسجيل الخروج من Supabase:', error);
        toast.error('تعذر تسجيل الخروج حاليًا، حاول مرة أخرى.');
        return;
      }
    }
    setSession(null);
    resetData();
    toast.success('تم تسجيل الخروج');
  }, [resetData, supabase]);

  const addGroup = useCallback(
    async (name) => {
      const trimmed = name?.trim();
      if (!trimmed) {
        toast.error('اسم المجموعة مطلوب');
        return;
      }
      const supaUserId = await resolveUserId();
      if (!supaUserId) {
        toast.error('يرجى تسجيل الدخول لإدارة المجموعات.');
        return;
      }
      try {
        const newGroup = await createGroup(supabase, { name: trimmed, user_id: supaUserId });
        setGroups((prev) => [...prev, newGroup]);
        toast.success('تمت إضافة المجموعة');
      } catch (error) {
        console.error('تعذر إضافة المجموعة:', error);
        toast.error('تعذر إضافة المجموعة الآن');
      }
    },
    [resolveUserId, supabase]
  );

  const deleteGroup = useCallback(
    async (groupId) => {
      if (groups.length <= 1) {
        toast.error('لا يمكن حذف آخر مجموعة');
        return;
      }
      const supaUserId = await resolveUserId();
      if (!supaUserId) {
        toast.error('يرجى تسجيل الدخول لإدارة المجموعات.');
        return;
      }
      try {
        await removeGroup(supabase, groupId, supaUserId);
        setGroups((prev) => prev.filter((group) => group.id !== groupId));
        toast.success('تم حذف المجموعة');
      } catch (error) {
        console.error('تعذر حذف المجموعة:', error);
        toast.error('تعذر حذف المجموعة الآن');
      }
    },
    [groups.length, resolveUserId, supabase]
  );

  const addStudent = useCallback(
    async (payload) => {
      const supaUserId = await resolveUserId();
      if (!supaUserId) {
        toast.error('يرجى تسجيل الدخول لإدارة الطلاب.');
        return;
      }
      try {
        const newStudent = await persistStudent(supabase, { ...payload, user_id: supaUserId });
        setStudents((prev) => [newStudent, ...prev]);
        toast.success('تم تسجيل الطالب بنجاح');
      } catch (error) {
        console.error('تعذر تسجيل الطالب:', error);
        toast.error('تعذر تسجيل الطالب حاليًا');
      }
    },
    [resolveUserId, supabase]
  );

  const updateStudent = useCallback(
    async (id, payload) => {
      const supaUserId = await resolveUserId();
      if (!supaUserId) {
        toast.error('يرجى تسجيل الدخول لإدارة الطلاب.');
        return;
      }
      try {
        const updatedStudent = await persistStudentUpdate(supabase, id, payload, supaUserId);
        setStudents((prev) => prev.map((student) => (student.id === id ? { ...student, ...updatedStudent } : student)));
        toast.success('تم تحديث بيانات الطالب');
      } catch (error) {
        console.error('تعذر تحديث بيانات الطالب:', error);
        toast.error('تعذر تحديث بيانات الطالب حاليًا');
      }
    },
    [resolveUserId, supabase]
  );

  const deleteStudent = useCallback(
    async (id) => {
      const supaUserId = await resolveUserId();
      if (!supaUserId) {
        toast.error('يرجى تسجيل الدخول لإدارة الطلاب.');
        return;
      }
      try {
        await removeStudent(supabase, id, supaUserId);
        setStudents((prev) => prev.filter((student) => student.id !== id));
        toast.success('تم حذف الطالب');
      } catch (error) {
        console.error('تعذر حذف الطالب:', error);
        toast.error('تعذر حذف الطالب الآن');
      }
    },
    [resolveUserId, supabase]
  );

  const addPayment = useCallback(
    async (payload) => {
      const supaUserId = await resolveUserId();
      if (!supaUserId) {
        toast.error('يرجى تسجيل الدخول لإدارة الدفعات.');
        return;
      }
      try {
        const normalizedPayload = {
          ...payload,
          amount: Number(payload.amount ?? 0),
          user_id: supaUserId
        };
        const newPayment = await persistPayment(supabase, normalizedPayload);
        setPayments((prev) => [newPayment, ...prev]);
        toast.success('تمت إضافة الدفعة');
      } catch (error) {
        console.error('تعذر إضافة الدفعة:', error);
        toast.error('تعذر إضافة الدفعة حاليًا');
      }
    },
    [resolveUserId, supabase]
  );

  const updatePayment = useCallback(
    async (id, payload) => {
      const supaUserId = await resolveUserId();
      if (!supaUserId) {
        toast.error('يرجى تسجيل الدخول لإدارة الدفعات.');
        return;
      }
      try {
        const normalizedPayload = { ...payload, amount: Number(payload.amount ?? 0) };
        const updatedPayment = await persistPaymentUpdate(supabase, id, normalizedPayload, supaUserId);
        setPayments((prev) => prev.map((payment) => (payment.id === id ? { ...payment, ...updatedPayment } : payment)));
        toast.success('تم تحديث الدفعة');
      } catch (error) {
        console.error('تعذر تحديث الدفعة:', error);
        toast.error('تعذر تحديث الدفعة الآن');
      }
    },
    [resolveUserId, supabase]
  );

  const deletePayment = useCallback(
    async (id) => {
      const supaUserId = await resolveUserId();
      if (!supaUserId) {
        toast.error('يرجى تسجيل الدخول لإدارة الدفعات.');
        return;
      }
      try {
        await removePayment(supabase, id, supaUserId);
        setPayments((prev) => prev.filter((payment) => payment.id !== id));
        toast.success('تم حذف الدفعة');
      } catch (error) {
        console.error('تعذر حذف الدفعة:', error);
        toast.error('تعذر حذف الدفعة الآن');
      }
    },
    [resolveUserId, supabase]
  );

  const addExpense = useCallback(
    async (payload) => {
      const supaUserId = await resolveUserId();
      if (!supaUserId) {
        toast.error('يرجى تسجيل الدخول لإدارة المصروفات.');
        return;
      }
      try {
        const normalizedPayload = {
          ...payload,
          amount: Number(payload.amount ?? 0),
          user_id: supaUserId
        };
        const newExpense = await persistExpense(supabase, normalizedPayload);
        setExpenses((prev) => [newExpense, ...prev]);
        toast.success('تمت إضافة المصروف');
      } catch (error) {
        console.error('تعذر إضافة المصروف:', error);
        toast.error('تعذر إضافة المصروف الآن');
      }
    },
    [resolveUserId, supabase]
  );

  const updateExpense = useCallback(
    async (id, payload) => {
      const supaUserId = await resolveUserId();
      if (!supaUserId) {
        toast.error('يرجى تسجيل الدخول لإدارة المصروفات.');
        return;
      }
      try {
        const normalizedPayload = { ...payload, amount: Number(payload.amount ?? 0) };
        const updatedExpense = await persistExpenseUpdate(supabase, id, normalizedPayload, supaUserId);
        setExpenses((prev) => prev.map((expense) => (expense.id === id ? { ...expense, ...updatedExpense } : expense)));
        toast.success('تم تحديث المصروف');
      } catch (error) {
        console.error('تعذر تحديث المصروف:', error);
        toast.error('تعذر تحديث المصروف الآن');
      }
    },
    [resolveUserId, supabase]
  );

  const deleteExpense = useCallback(
    async (id) => {
      const supaUserId = await resolveUserId();
      if (!supaUserId) {
        toast.error('يرجى تسجيل الدخول لإدارة المصروفات.');
        return;
      }
      try {
        await removeExpense(supabase, id, supaUserId);
        setExpenses((prev) => prev.filter((expense) => expense.id !== id));
        toast.success('تم حذف المصروف');
      } catch (error) {
        console.error('تعذر حذف المصروف:', error);
        toast.error('تعذر حذف المصروف الآن');
      }
    },
    [resolveUserId, supabase]
  );

  const saveReminderSettings = useCallback(
    async (payload) => {
      const supaUserId = await resolveUserId();
      if (!supaUserId) {
        toast.error('يرجى تسجيل الدخول لإدارة الإعدادات.');
        return;
      }
      try {
        const updated = await saveSettings(supabase, {
          ...payload,
          user_id: supaUserId
        });
        setSettings(updated);
        toast.success('تم حفظ إعدادات التذكير');
      } catch (error) {
        console.error('تعذر حفظ الإعدادات العامة:', error);
        toast.error('تعذر حفظ إعدادات التذكير حاليًا');
      }
    },
    [resolveUserId, supabase]
  );

  const saveGroupReminder = useCallback(
    async (groupId, payload) => {
      const supaUserId = await resolveUserId();
      if (!supaUserId) {
        toast.error('يرجى تسجيل الدخول لإدارة الإعدادات.');
        return;
      }
      try {
        const updated = await saveGroupOverride(supabase, { user_id: supaUserId, group_id: groupId, ...payload });
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
    [resolveUserId, supabase]
  );

  const saveStudentReminder = useCallback(
    async (studentId, payload) => {
      const supaUserId = await resolveUserId();
      if (!supaUserId) {
        toast.error('يرجى تسجيل الدخول لإدارة الإعدادات.');
        return;
      }
      try {
        const updated = await saveStudentOverride(supabase, { user_id: supaUserId, student_id: studentId, ...payload });
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
    [resolveUserId, supabase]
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
