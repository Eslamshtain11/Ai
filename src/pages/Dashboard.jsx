import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { PiggyBank, Wallet2, TrendingUp, Users2, PlusCircle, Receipt } from 'lucide-react';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ income: 0, expenses: 0, net: 0, studentsCount: 0 });
  const [latestPayments, setLatestPayments] = useState([]);
  const navigate = useNavigate();

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

        const [allPaymentsRes, latestPaymentsRes, expensesRes, studentsRes] = await Promise.all([
          supabase
            .from('payments')
            .select('amount')
            .eq('user_id', userId),
          supabase
            .from('payments')
            .select('id, amount, date, note')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(5),
          supabase
            .from('expenses')
            .select('amount')
            .eq('user_id', userId),
          supabase
            .from('students')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
        ]);

        const payments = latestPaymentsRes.data ?? [];
        const totalIncome = (allPaymentsRes.data ?? []).reduce(
          (sum, payment) => sum + Number(payment.amount ?? 0),
          0
        );
        const totalExpenses = (expensesRes.data ?? []).reduce(
          (sum, expense) => sum + Number(expense.amount ?? 0),
          0
        );
        setStats({
          income: totalIncome,
          expenses: totalExpenses,
          net: totalIncome - totalExpenses,
          studentsCount: studentsRes.count ?? 0
        });
        setLatestPayments(payments);
      } catch (error) {
        console.error('تعذر تحميل بيانات لوحة التحكم:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const statCards = useMemo(
    () => [
      {
        title: 'إجمالي الدخل',
        value: formatCurrency(stats.income),
        icon: PiggyBank,
        tone: 'bg-emerald-500/10 text-emerald-300'
      },
      {
        title: 'إجمالي المصروفات',
        value: formatCurrency(stats.expenses),
        icon: Wallet2,
        tone: 'bg-rose-500/10 text-rose-300'
      },
      {
        title: 'صافي الربح',
        value: formatCurrency(stats.net),
        icon: TrendingUp,
        tone: 'bg-sky-500/10 text-sky-300'
      },
      {
        title: 'عدد الطلاب',
        value: stats.studentsCount,
        icon: Users2,
        tone: 'bg-amber-500/10 text-amber-300'
      }
    ],
    [stats]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-brand-secondary/30 bg-brand-navy/60 p-6 shadow-soft">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-brand-gold">أهلاً بك في لوحة التحكم</h2>
            <p className="text-sm text-brand-secondary">
              راقب الأداء المالي وابدأ يومك بخطة واضحة.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/payments#new')}
              className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-5 py-2 text-sm font-bold text-emerald-200 transition hover:bg-emerald-500/30"
            >
              <PlusCircle className="h-4 w-4" />
              إضافة دفعة
            </button>
            <button
              type="button"
              onClick={() => navigate('/analytics')}
              className="flex items-center gap-2 rounded-full bg-brand-gold/20 px-5 py-2 text-sm font-bold text-brand-gold transition hover:bg-brand-gold/30"
            >
              <Receipt className="h-4 w-4" />
              عرض كشف الحساب
            </button>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map(({ title, value, icon: Icon, tone }) => (
            <div key={title} className="rounded-2xl border border-brand-secondary/20 bg-brand-blue/70 p-4">
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full ${tone}`}>
                <Icon className="h-6 w-6" />
              </div>
              <p className="text-sm text-brand-secondary">{title}</p>
              <p className="mt-1 text-lg font-black text-brand-light">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-brand-secondary/20 bg-brand-navy/60 p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-brand-gold">آخر الدفعات</h3>
          <button
            type="button"
            onClick={() => navigate('/payments')}
            className="text-sm text-brand-secondary transition hover:text-brand-gold"
          >
            عرض الكل
          </button>
        </div>
        {loading ? (
          <div className="py-12 text-center text-sm text-brand-secondary">جارٍ تحميل البيانات...</div>
        ) : latestPayments.length === 0 ? (
          <div className="py-12 text-center text-sm text-brand-secondary">
            لم يتم تسجيل دفعات بعد. ابدأ بإضافة دفعة جديدة للطلاب.
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {latestPayments.map((payment) => (
              <li
                key={payment.id}
                className="flex items-center justify-between rounded-2xl border border-brand-secondary/20 bg-brand-blue/70 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-bold text-brand-light">{formatCurrency(payment.amount)}</p>
                  <p className="text-xs text-brand-secondary">{payment.note || 'بدون ملاحظات'}</p>
                </div>
                <span className="text-xs text-brand-secondary">{formatDate(payment.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
