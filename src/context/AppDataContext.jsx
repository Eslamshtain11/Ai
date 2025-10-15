import { createContext, useContext, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const AppDataContext = createContext();

const defaultSession = {
  user: { id: 'demo-user', name: 'أ. محمد علي', phone: '0500000000' }
};

const defaultGroups = [
  { id: 'g-1', name: 'الفيزياء 12' },
  { id: 'g-2', name: 'الرياضيات 11' },
  { id: 'g-3', name: 'الكيمياء 10' }
];

const defaultStudents = [
  { id: 's-1', name: 'أحمد إبراهيم', groupId: 'g-1' },
  { id: 's-2', name: 'سارة يوسف', groupId: 'g-2' },
  { id: 's-3', name: 'ليان خالد', groupId: 'g-1' },
  { id: 's-4', name: 'محمد محمود', groupId: 'g-3' }
];

const now = new Date();
const formatDay = (day) => format(new Date(now.getFullYear(), now.getMonth(), day), 'yyyy-MM-dd');

const defaultPayments = [
  { id: 'p-1', studentId: 's-1', amount: 450, date: formatDay(5) },
  { id: 'p-2', studentId: 's-2', amount: 400, date: formatDay(10) },
  { id: 'p-3', studentId: 's-3', amount: 450, date: formatDay(15) },
  { id: 'p-4', studentId: 's-4', amount: 350, date: formatDay(20) }
];

const defaultExpenses = [
  { id: 'e-1', description: 'إيجار القاعة', amount: 300, date: formatDay(1) },
  { id: 'e-2', description: 'مواد تعليمية', amount: 120, date: formatDay(12) },
  { id: 'e-3', description: 'اشتراك الإنترنت', amount: 80, date: formatDay(18) }
];

const defaultSettings = {
  reminderDays: 3
};

const defaultGuestCode = {
  code: 'GUEST-1234',
  active: true
};

export function AppDataProvider({ children }) {
  const [session, setSession] = useState(defaultSession);
  const [groups, setGroups] = useState(defaultGroups);
  const [students, setStudents] = useState(defaultStudents);
  const [payments, setPayments] = useState(defaultPayments);
  const [expenses, setExpenses] = useState(defaultExpenses);
  const [guestCode, setGuestCode] = useState(defaultGuestCode);
  const [settings, setSettings] = useState(defaultSettings);

  const reminders = useMemo(() => settings.reminderDays, [settings.reminderDays]);

  const totalIncome = useMemo(
    () => payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    [payments]
  );

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [expenses]
  );

  const netIncome = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);

  const payingStudents = useMemo(
    () => new Set(payments.map((payment) => payment.studentId)).size,
    [payments]
  );

  const groupedPayments = useMemo(() => {
    return payments.reduce((acc, payment) => {
      const month = format(parseISO(payment.date), 'MMMM yyyy', { locale: ar });
      const student = students.find((item) => item.id === payment.studentId);
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push({
        ...payment,
        student,
        group: groups.find((group) => group.id === student?.groupId)
      });
      return acc;
    }, {});
  }, [payments, students, groups]);

  const groupedExpenses = useMemo(() => {
    return expenses.reduce((acc, expense) => {
      const month = format(parseISO(expense.date), 'MMMM yyyy', { locale: ar });
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(expense);
      return acc;
    }, {});
  }, [expenses]);

  const signIn = (payload) => {
    if (!payload.phone || !payload.password) {
      toast.error('يرجى إدخال رقم الجوال وكلمة المرور');
      return;
    }
    toast.success('تم تسجيل الدخول بنجاح (وضع تجريبي)');
    setSession({ user: { id: 'demo', name: payload.name || 'أ. مستخدم', phone: payload.phone } });
  };

  const signUp = (payload) => {
    if (!payload.name || !payload.phone || !payload.password) {
      toast.error('يرجى إكمال جميع الحقول');
      return;
    }
    toast.success('تم إنشاء الحساب (وضع تجريبي)');
    setSession({ user: { id: 'demo', name: payload.name, phone: payload.phone } });
  };

  const signOut = () => {
    setSession(null);
    toast.success('تم تسجيل الخروج');
  };

  const generateId = () => (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

  const addPayment = (data) => {
    const id = generateId();
    setPayments((prev) => [...prev, { ...data, id }]);
    toast.success('تمت إضافة الدفعة');
  };

  const updatePayment = (id, data) => {
    setPayments((prev) => prev.map((item) => (item.id === id ? { ...item, ...data } : item)));
    toast.success('تم تحديث الدفعة');
  };

  const deletePayment = (id) => {
    setPayments((prev) => prev.filter((item) => item.id !== id));
    toast.success('تم حذف الدفعة');
  };

  const addExpense = (data) => {
    const id = generateId();
    setExpenses((prev) => [...prev, { ...data, id }]);
    toast.success('تمت إضافة المصروف');
  };

  const updateExpense = (id, data) => {
    setExpenses((prev) => prev.map((item) => (item.id === id ? { ...item, ...data } : item)));
    toast.success('تم تحديث المصروف');
  };

  const deleteExpense = (id) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
    toast.success('تم حذف المصروف');
  };

  const addGroup = (name) => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('اسم المجموعة مطلوب');
      return;
    }
    const id = generateId();
    setGroups((prev) => [...prev, { id, name: trimmed }]);
    toast.success('تمت إضافة المجموعة');
  };

  const deleteGroup = (id) => {
    if (groups.length <= 1) {
      toast.error('لا يمكن حذف آخر مجموعة');
      return;
    }
    setGroups((prev) => prev.filter((group) => group.id !== id));
    toast.success('تم حذف المجموعة');
  };

  const generateGuestCode = () => {
    const code = `G-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    setGuestCode({ code, active: true });
    toast.success('تم إنشاء كود ضيف جديد');
  };

  const value = {
    supabase,
    session,
    setSession,
    signIn,
    signUp,
    signOut,
    groups,
    students,
    payments,
    expenses,
    guestCode,
    settings,
    reminders,
    totalIncome,
    totalExpenses,
    netIncome,
    payingStudents,
    groupedPayments,
    groupedExpenses,
    addPayment,
    updatePayment,
    deletePayment,
    addExpense,
    updateExpense,
    deleteExpense,
    addGroup,
    deleteGroup,
    generateGuestCode,
    setSettings
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
