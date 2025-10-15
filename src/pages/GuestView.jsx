import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, LogOut } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAppData } from '../context/AppDataContext';
import DataTable from '../components/DataTable';
import ActionButton from '../components/ActionButton';

export default function GuestView() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { guestCode, payments } = useAppData();
  const [selectedMonth, setSelectedMonth] = useState('');

  const allowed = guestCode?.code === code || code === 'demo';

  const filteredPayments = useMemo(() => {
    const base = payments.map((payment, index) => ({
      ...payment,
      anonymousName: `طالب ${index + 1}`
    }));
    return base.filter((payment) =>
      selectedMonth ? format(parseISO(payment.date), 'yyyy-MM') === selectedMonth : true
    );
  }, [payments, selectedMonth]);

  const total = filteredPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const columns = [
    { header: 'الطالب', accessor: 'anonymousName' },
    { header: 'المبلغ', accessor: 'amount' },
    { header: 'التاريخ', accessor: 'date' }
  ];

  if (!allowed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-blue p-10 text-brand-light">
        <h1 className="text-3xl font-bold text-red-400">الكود غير صالح</h1>
        <p className="mt-3 text-brand-secondary">يرجى التواصل مع المعلم للحصول على كود صحيح.</p>
        <ActionButton className="mt-6" onClick={() => navigate('/auth')} variant="outline">
          العودة للتسجيل
        </ActionButton>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-blue px-4 py-10 text-brand-light">
      <header className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-4 rounded-3xl border border-brand-secondary/20 bg-brand-navy/70 p-8 text-center lg:flex-row lg:text-right">
        <div>
          <h1 className="text-4xl font-black text-brand-gold">المحاسب الشخصي</h1>
          <p className="mt-2 text-brand-secondary">عرض ضيوف - قراءة فقط</p>
        </div>
        <ActionButton variant="outline" icon={LogOut} onClick={() => navigate('/auth')}>
          خروج
        </ActionButton>
      </header>

      <main className="mx-auto mt-10 w-full max-w-5xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-3 rounded-2xl border border-brand-secondary/30 bg-brand-navy/60 px-5 py-3">
            <Calendar className="h-5 w-5 text-brand-gold" />
            <select
              className="w-full bg-transparent text-sm"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            >
              <option value="">كل الأشهر</option>
              {Array.from(new Set(payments.map((payment) => format(parseISO(payment.date), 'yyyy-MM')))).map((month) => (
                <option key={month} value={month}>
                  {format(parseISO(`${month}-01`), 'MMMM yyyy', { locale: ar })}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-2xl border border-brand-gold/40 bg-brand-navy/60 px-6 py-3 text-brand-gold">
            إجمالي الدخل: {total.toLocaleString()} ر.س
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredPayments}
          footer={
            <tr>
              <td className="px-6 py-4 font-bold">الإجمالي</td>
              <td className="px-6 py-4 text-brand-gold">{total.toLocaleString()} ر.س</td>
              <td />
            </tr>
          }
        />
      </main>
    </div>
  );
}
