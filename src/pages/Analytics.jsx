import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import SectionHeader from '../components/SectionHeader';
import StatCard from '../components/StatCard';
import { useAppData } from '../context/AppDataContext';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function Analytics() {
  const { payments, groups, students } = useAppData();

  const monthlyData = useMemo(() => {
    const map = new Map();
    payments.forEach((payment) => {
      const month = format(parseISO(payment.date), 'yyyy-MM');
      map.set(month, (map.get(month) ?? 0) + Number(payment.amount || 0));
    });
    return Array.from(map.entries()).map(([month, total]) => ({
      month,
      label: format(parseISO(`${month}-01`), 'MMMM yyyy', { locale: ar }),
      total
    }));
  }, [payments]);

  const bestMonth = monthlyData.reduce((best, current) => (current.total > (best?.total ?? 0) ? current : best), null);
  const lowestMonth = monthlyData.reduce((worst, current) =>
    current.total < (worst?.total ?? Number.POSITIVE_INFINITY) ? current : worst,
  null);

  const groupTotals = useMemo(() => {
    const totals = groups.map((group) => ({ id: group.id, name: group.name, total: 0 }));
    payments.forEach((payment) => {
      const student = students.find((item) => item.id === payment.studentId);
      const groupIndex = totals.findIndex((item) => item.id === student?.groupId);
      if (groupIndex !== -1) {
        totals[groupIndex].total += Number(payment.amount || 0);
      }
    });
    return totals;
  }, [groups, payments, students]);

  const pieData = groupTotals.map((group) => ({ name: group.name, value: group.total }));

  return (
    <div className="space-y-10">
      <SectionHeader title="الإحصاءات" subtitle="التحليلات المتقدمة للدخل حسب الأشهر والمجموعات" />

      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="أعلى شهر دخلًا"
          value={bestMonth ? `${bestMonth.total.toLocaleString()} ر.س` : 'لا يوجد بيانات'}
          subtitle={bestMonth?.label}
          accent="green-700"
        />
        <StatCard
          title="أقل شهر دخلًا"
          value={lowestMonth ? `${lowestMonth.total.toLocaleString()} ر.س` : 'لا يوجد بيانات'}
          subtitle={lowestMonth?.label}
          accent="red-400"
        />
        <StatCard title="عدد المجموعات" value={groups.length} accent="brand-light" />
      </div>

      {monthlyData.length === 0 ? (
        <div className="rounded-3xl border border-brand-secondary/20 bg-brand-navy/70 p-10 text-center text-brand-secondary">
          لا توجد بيانات كافية لعرض الرسوم البيانية حتى الآن.
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-brand-secondary/10 bg-brand-navy/70 p-6 shadow-soft">
            <h3 className="text-xl font-bold text-brand-light">إجمالي الدخل لكل شهر</h3>
            <div className="mt-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(136,146,176,0.2)" />
                  <XAxis dataKey="label" tick={{ fill: '#CCD6F6', fontSize: 12 }} interval={0} angle={-10} height={70} />
                  <YAxis tick={{ fill: '#CCD6F6', fontSize: 12 }} orientation="right" />
                  <Tooltip contentStyle={{ background: '#172A46', borderRadius: 16, border: '1px solid rgba(136,146,176,0.3)' }} />
                  <Bar dataKey="total" fill="#D4AF37" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-brand-secondary/10 bg-brand-navy/70 p-6 shadow-soft">
            <h3 className="text-xl font-bold text-brand-light">نسبة مساهمة كل مجموعة</h3>
            <div className="mt-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip contentStyle={{ background: '#172A46', borderRadius: 16, border: '1px solid rgba(136,146,176,0.3)' }} />
                  <Legend verticalAlign="bottom" wrapperStyle={{ color: '#CCD6F6' }} />
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={120}
                    paddingAngle={6}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={['#D4AF37', '#8892B0', '#4C51BF', '#38A169'][index % 4]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
