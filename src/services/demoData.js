import { formatISO } from 'date-fns';

const today = new Date();

const buildDate = (dayOffset = 0) => {
  const date = new Date(today.getFullYear(), today.getMonth(), Math.max(1, dayOffset));
  return formatISO(date, { representation: 'date' });
};

export const demoUser = {
  id: 'demo-user',
  name: 'أ. محمد علي',
  phone: '01000000000'
};

export const demoGroups = [
  { id: 'demo-group-1', name: 'الفيزياء 12', created_at: today.toISOString() },
  { id: 'demo-group-2', name: 'الرياضيات 11', created_at: today.toISOString() },
  { id: 'demo-group-3', name: 'الكيمياء 10', created_at: today.toISOString() }
];

export const demoStudents = [
  {
    id: 'demo-student-1',
    name: 'أحمد إبراهيم',
    phone: '01012345678',
    group_id: 'demo-group-1',
    join_date: buildDate(5),
    monthly_fee: 450,
    note: '',
    created_at: today.toISOString()
  },
  {
    id: 'demo-student-2',
    name: 'سارة يوسف',
    phone: '01098765432',
    group_id: 'demo-group-2',
    join_date: buildDate(10),
    monthly_fee: 400,
    note: 'حصة إضافية كل أسبوع',
    created_at: today.toISOString()
  },
  {
    id: 'demo-student-3',
    name: 'ليان خالد',
    phone: '01077777777',
    group_id: 'demo-group-1',
    join_date: buildDate(15),
    monthly_fee: 450,
    note: '',
    created_at: today.toISOString()
  }
];

export const demoPayments = [
  {
    id: 'demo-payment-1',
    student_id: 'demo-student-1',
    amount: 450,
    date: buildDate(4),
    note: '',
    created_at: today.toISOString()
  },
  {
    id: 'demo-payment-2',
    student_id: 'demo-student-2',
    amount: 400,
    date: buildDate(8),
    note: 'دفعة مقدمة',
    created_at: today.toISOString()
  }
];

export const demoExpenses = [
  {
    id: 'demo-expense-1',
    description: 'إيجار القاعة',
    amount: 300,
    date: buildDate(2),
    note: '',
    created_at: today.toISOString()
  },
  {
    id: 'demo-expense-2',
    description: 'مواد تعليمية',
    amount: 120,
    date: buildDate(12),
    note: '',
    created_at: today.toISOString()
  }
];

export const demoSettings = {
  reminder_days_before: 3,
  reminder_days_after: 2,
  use_group_override: false,
  use_student_override: false,
  updated_at: today.toISOString()
};

export const demoGroupSettings = [];
export const demoStudentSettings = [];
