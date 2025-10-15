import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import SectionHeader from '../components/SectionHeader';
import DataTable from '../components/DataTable';
import { useAppData } from '../context/AppDataContext';
import { formatCurrencyEGP } from '../utils/formatters';

export default function StudentSearch() {
  const { students, payments, groups } = useAppData();
  const [query, setQuery] = useState('');

  const filteredStudents = useMemo(
    () => students.filter((student) => student.name.toLowerCase().includes(query.toLowerCase())),
    [students, query]
  );

  const tableColumns = [
    { header: 'المجموعة', accessor: 'group' },
    {
      header: 'المبلغ',
      accessor: 'amount',
      cell: (row) => formatCurrencyEGP(row.amount)
    },
    {
      header: 'التاريخ',
      accessor: 'date',
      cell: (row) => (row.date ? format(parseISO(row.date), 'dd/MM/yyyy') : '-')
    }
  ];

  const buildRows = (studentId) =>
    payments
      .filter((payment) => payment.student_id === studentId)
      .map((payment) => ({
        id: payment.id,
        group:
          groups.find((group) => group.id === students.find((s) => s.id === studentId)?.group_id)?.name ?? 'غير محدد',
        amount: payment.amount,
        date: payment.date
      }));

  const totalForStudent = (studentId) =>
    payments
      .filter((payment) => payment.student_id === studentId)
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  return (
    <div className="space-y-10">
      <SectionHeader
        title="بحث الطالب"
        subtitle="اعثر على جميع دفعات الطالب بسرعة"
        actions={
          <div className="relative w-full md:w-96">
            <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-secondary" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث باسم الطالب"
              className="w-full rounded-2xl border border-brand-secondary/30 bg-brand-blue/60 px-5 py-3 pr-10 text-sm"
            />
          </div>
        }
      />

      <div className="space-y-6">
        {filteredStudents.length === 0 ? (
          <div className="rounded-3xl border border-brand-secondary/20 bg-brand-navy/70 p-10 text-center text-brand-secondary">
            لا توجد نتائج مطابقة لبحثك.
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div key={student.id} className="space-y-4 rounded-3xl border border-brand-secondary/10 bg-brand-navy/60 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-brand-light">{student.name}</h3>
                  <p className="text-brand-secondary">
                    المجموعة: {groups.find((group) => group.id === student.group_id)?.name || 'غير محدد'}
                  </p>
                </div>
                <div className="rounded-2xl border border-brand-gold/40 bg-brand-blue/40 px-6 py-3 text-brand-gold">
                  إجمالي المدفوعات: {formatCurrencyEGP(totalForStudent(student.id))}
                </div>
              </div>

              <DataTable
                columns={tableColumns}
                data={buildRows(student.id)}
                footer={
                  <tr>
                    <td className="px-6 py-4 font-bold" colSpan={2}>
                      الإجمالي
                    </td>
                    <td className="px-6 py-4 text-brand-gold">
                      {formatCurrencyEGP(totalForStudent(student.id))}
                    </td>
                  </tr>
                }
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
