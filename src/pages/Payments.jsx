import { useMemo, useRef, useState } from 'react';
import { Calendar, FileDown, FileSpreadsheet, LineChart, PlusCircle, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import SectionHeader from '../components/SectionHeader';
import ActionButton from '../components/ActionButton';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import SmartDatePicker from '../components/SmartDatePicker';
import { useAppData } from '../context/AppDataContext';
import { exportPaymentsPDF, exportPaymentsXLSX, mapPaymentRowsForExport } from '../export/exportPayments';
import { formatCurrencyEGP } from '../utils/formatters';

const initialPayment = {
  student_id: '',
  amount: '',
  date: '',
  note: ''
};

export default function Payments() {
  const { payments, students, groups, addPayment, updatePayment, deletePayment } = useAppData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [form, setForm] = useState(initialPayment);
  const searchInputRef = useRef(null);
  const tableContainerRef = useRef(null);

  const studentsLookup = useMemo(
    () => Object.fromEntries(students.map((student) => [student.id, student])),
    [students]
  );

  const groupsLookup = useMemo(
    () => Object.fromEntries(groups.map((group) => [group.id, group])),
    [groups]
  );

  const monthKey = selectedMonth ? format(selectedMonth, 'yyyy-MM') : '';

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const student = studentsLookup[payment.student_id];
      const matchesSearch = (student?.name ?? '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMonth = monthKey ? format(parseISO(payment.date), 'yyyy-MM') === monthKey : true;
      return matchesSearch && matchesMonth;
    });
  }, [payments, studentsLookup, searchTerm, monthKey]);

  const total = useMemo(
    () => filteredPayments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0),
    [filteredPayments]
  );

  const handleExportXlsx = () => {
    const rows = mapPaymentRowsForExport(filteredPayments, studentsLookup, groupsLookup);
    exportPaymentsXLSX(rows, monthKey);
  };

  const handleExportPdf = async () => {
    if (filteredPayments.length === 0) return;
    await exportPaymentsPDF(tableContainerRef.current, monthKey);
  };

  const openModal = (payment) => {
    if (payment) {
      setEditingPayment(payment);
      setForm({
        student_id: payment.student_id,
        amount: payment.amount,
        date: payment.date,
        note: payment.note ?? ''
      });
    } else {
      setEditingPayment(null);
      setForm(initialPayment);
    }
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.student_id || !form.amount || !form.date) return;
    if (editingPayment) {
      await updatePayment(editingPayment.id, form);
    } else {
      await addPayment(form);
    }
    setModalOpen(false);
  };

  const tableColumns = [
    {
      header: 'الطالب',
      accessor: 'student',
      cell: (row) => studentsLookup[row.student_id]?.name ?? 'غير معروف'
    },
    {
      header: 'المجموعة',
      accessor: 'group',
      cell: (row) => {
        const student = studentsLookup[row.student_id];
        return student ? groupsLookup[student.group_id]?.name ?? 'غير مصنف' : 'غير مصنف';
      }
    },
    {
      header: 'المبلغ',
      accessor: 'amount',
      cell: (row) => formatCurrencyEGP(row.amount)
    },
    {
      header: 'التاريخ',
      accessor: 'date',
      cell: (row) => (row.date ? format(parseISO(row.date), 'dd/MM/yyyy') : '-')
    },
    {
      header: 'ملاحظات',
      accessor: 'note',
      cell: (row) => row.note || '-'
    },
    {
      header: 'الإجراءات',
      accessor: 'actions',
      cell: (row) => (
        <div className="flex gap-2">
          <ActionButton variant="subtle" onClick={() => openModal(row)}>
            تعديل
          </ActionButton>
          <ActionButton variant="danger" onClick={() => deletePayment(row.id)}>
            حذف
          </ActionButton>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-10">
      <SectionHeader
        title="كشف الحساب"
        subtitle="إدارة كل مدفوعات الطلاب ومتابعتها"
        actions={
          <ActionButton icon={PlusCircle} onClick={() => openModal(null)}>
            إضافة دفعة جديدة
          </ActionButton>
        }
      />

      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="relative">
          <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-secondary" />
          <input
            type="text"
            placeholder="ابحث باسم الطالب"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-2xl border border-brand-secondary/30 bg-brand-blue/60 px-5 py-3 pr-10 text-sm"
            ref={searchInputRef}
          />
        </div>
        <label className="flex items-center gap-3 rounded-2xl border border-brand-secondary/30 bg-brand-blue/60 px-5 py-3">
          <Calendar className="h-5 w-5 text-brand-gold" />
          <SmartDatePicker
            selected={selectedMonth}
            onChange={(value) => setSelectedMonth(value)}
            placeholderText="اختر الشهر"
            dateFormat="MMMM yyyy"
            showMonthYearPicker
            isClearable
            className="bg-transparent"
          />
        </label>
        <div className="flex flex-wrap justify-end gap-3">
          <ActionButton variant="success" icon={FileSpreadsheet} onClick={handleExportXlsx}>
            تصدير XLSX
          </ActionButton>
          <ActionButton variant="danger" icon={FileDown} onClick={handleExportPdf}>
            تصدير PDF
          </ActionButton>
          <ActionButton variant="subtle" icon={LineChart}>
            تحليل ذكي
          </ActionButton>
        </div>
      </div>

      <DataTable
        columns={tableColumns}
        data={filteredPayments}
        containerRef={tableContainerRef}
        footer={
          <tr>
            <td className="px-6 py-4 font-bold" colSpan={4}>
              إجمالي الدفعات
            </td>
            <td className="px-6 py-4 text-brand-gold">{formatCurrencyEGP(total)}</td>
            <td />
          </tr>
        }
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="دفعة الطالب">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField label="الطالب">
            <select
              value={form.student_id}
              onChange={(event) => setForm((prev) => ({ ...prev, student_id: event.target.value }))}
              className="rounded-xl px-4 py-3"
              required
            >
              <option value="">اختر الطالب</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="المبلغ (ج.م)">
            <input
              type="number"
              value={form.amount}
              onChange={(event) => setForm((prev) => ({ ...prev, amount: Number(event.target.value) }))}
              className="rounded-xl px-4 py-3"
              required
            />
          </FormField>
          <FormField label="التاريخ">
            <SmartDatePicker
              selected={form.date ? parseISO(form.date) : null}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, date: value ? format(value, 'yyyy-MM-dd') : '' }))
              }
              placeholderText="اختر التاريخ"
            />
          </FormField>
          <FormField label="ملاحظات">
            <textarea
              value={form.note}
              onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
              className="rounded-xl px-4 py-3"
              rows={3}
              placeholder="ملاحظات اختيارية"
            />
          </FormField>
          <div className="flex justify-end gap-3 pt-4">
            <ActionButton variant="subtle" onClick={() => setModalOpen(false)}>
              إلغاء
            </ActionButton>
            <ActionButton type="submit" variant="primary">
              {editingPayment ? 'تحديث' : 'حفظ'}
            </ActionButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
