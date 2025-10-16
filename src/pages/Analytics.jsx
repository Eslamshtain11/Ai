import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabaseClient.js';
import { fetchPayments } from '../services/payments.js';
import { fetchExpenses } from '../services/expenses.js';
import { fetchStudents } from '../services/students.js';
import { fetchGroups } from '../services/groups.js';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { formatCurrency } from '../utils/formatters.js';

const COLORS = ['#D4AF37', '#8892B0', '#4ADE80', '#38BDF8', '#F97316', '#F472B6'];

const tooltipFormatter = (value) => formatCurrency(value);
const axisFormatter = (value) => new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(value);

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const load = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) {
          setLoading(false);
          return;
        }
        const [paymentsData, expensesData, studentsData, groupsData] = await Promise.all([
          fetchPayments(userId),
          fetchExpenses(userId),
          fetchStudents(userId),
          fetchGroups(userId)
        ]);
        setPayments(paymentsData);
        setExpenses(expensesData);
        setStudents(studentsData);
        setGroups(groupsData);
      } catch (error) {
        console.error('تعذر تحميل بيانات التحليلات:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const monthlyTotals = useMemo(() => {
    const incomeMap = new Map();
    payments.forEach((payment) => {
      try {
        const monthKey = format(new Date(payment.date), 'yyyy-MM');
        incomeMap.set(monthKey, (incomeMap.get(monthKey) ?? 0) + Number(payment.amount ?? 0));
      } catch (error) {
        // تجاهل التواريخ غير الصالحة
      }
    });

    const expenseMap = new Map();
    expenses.forEach((expense) => {
      try {
        const monthKey = format(new Date(expense.date), 'yyyy-MM');
        expenseMap.set(monthKey, (expenseMap.get(monthKey) ?? 0) + Number(expense.amount ?? 0));
      } catch (error) {}
    });

    const months = Array.from(new Set([...incomeMap.keys(), ...expenseMap.keys()])).sort();

    return months.map((monthKey) => {
      const date = new Date(`${monthKey}-01T00:00:00`);
      return {
        monthKey,
        monthLabel: format(date, 'MMM yyyy', { locale: ar }),
        income: incomeMap.get(monthKey) ?? 0,
        expenses: expenseMap.get(monthKey) ?? 0
      };
    });
  }, [payments, expenses]);

  const groupDistribution = useMemo(() => {
    if (payments.length === 0) return [];
    const studentMap = new Map();
    students.forEach((student) => studentMap.set(student.id, student));
    const groupTotals = new Map();
    payments.forEach((payment) => {
      const student = studentMap.get(payment.student_id);
      const groupId = student?.group_id ?? 'no-group';
      const groupName = groups.find((group) => group.id === groupId)?.name ?? 'طلاب فرديون';
      groupTotals.set(groupName, (groupTotals.get(groupName) ?? 0) + Number(payment.amount ?? 0));
    });
    return Array.from(groupTotals.entries()).map(([name, value]) => ({ name, value }));
  }, [payments, students, groups]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-brand-secondary/20 bg-brand-navy/60 p-6 shadow-soft">
        <h2 className="text-lg font-bold text-brand-gold">الدخل مقابل المصروفات</h2>
        <p className="text-sm text-brand-secondary">
          تحليل شهري لمقارنة الدخل بالمصروفات، وتحديد أفضل الشهور أداءً.
        </p>
        {loading ? (
          <div className="py-12 text-center text-sm text-brand-secondary">جارٍ تجهيز الرسوم البيانية...</div>
        ) : monthlyTotals.length === 0 ? (
          <div className="py-12 text-center text-sm text-brand-secondary">لا توجد بيانات كافية لعرض الرسم البياني.</div>
        ) : (
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTotals}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2a44" />
                <XAxis dataKey="monthLabel" stroke="#CCD6F6" tick={{ fill: '#8892B0' }} />
                <YAxis stroke="#CCD6F6" tickFormatter={axisFormatter} tick={{ fill: '#8892B0' }} />
                <Tooltip formatter={tooltipFormatter} contentStyle={{ direction: 'rtl' }} />
                <Legend wrapperStyle={{ color: '#CCD6F6', direction: 'rtl' }} />
                <Bar dataKey="income" name="الدخل" fill="#4ADE80" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expenses" name="المصروفات" fill="#F87171" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-brand-secondary/20 bg-brand-navy/60 p-6 shadow-soft">
        <h2 className="text-lg font-bold text-brand-gold">توزيع الدخل حسب المجموعات</h2>
        <p className="text-sm text-brand-secondary">
          تعرف على المجموعات الأكثر مساهمة في دخلك الشهري لاتخاذ قرارات مدروسة.
        </p>
        {loading ? (
          <div className="py-12 text-center text-sm text-brand-secondary">جارٍ تحميل البيانات...</div>
        ) : groupDistribution.length === 0 ? (
          <div className="py-12 text-center text-sm text-brand-secondary">لا توجد دفعات مرتبطة بمجموعات بعد.</div>
        ) : (
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={groupDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                  {groupDistribution.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={tooltipFormatter} contentStyle={{ direction: 'rtl' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}
