import { useMemo, useRef, useState } from 'react';
import { Calendar, FileDown, FileSpreadsheet, LineChart, PlusCircle, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import SectionHeader from '../components/SectionHeader';
import ActionButton from '../components/ActionButton';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import { useAppData } from '../context/AppDataContext';

const initialPayment = {
  studentId: '',
  amount: '',
  date: ''
};

export default function Payments() {
  const { payments, students, groups, addPayment, updatePayment, deletePayment } = useAppData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [form, setForm] = useState(initialPayment);
  const searchInputRef = useRef(null);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const student = students.find((item) => item.id === payment.studentId);
      const matchesSearch = (student?.name ?? '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMonth = selectedMonth
        ? format(parseISO(payment.date), 'yyyy-MM') === selectedMonth
        : true;
      return matchesSearch && matchesMonth;
    });
  }, [payments, searchTerm, selectedMonth, students]);

  const total = useMemo(
    () => filteredPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    [filteredPayments]
  );

  const handleExportXlsx = () => {
    const rows = filteredPayments.map((payment) => {
      const student = students.find((item) => item.id === payment.studentId);
      const group = groups.find((item) => item.id === student?.groupId);
      return {
        الطالب: student?.name,
        المجموعة: group?.name,
        المبلغ: payment.amount,
        التاريخ: payment.date
      };
    });
    const worksheet = utils.json_to_sheet(rows);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Payments');
    writeFile(workbook, 'payments.xlsx');
  };

  const handleExportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const tableData = filteredPayments.map((payment) => {
      const student = students.find((item) => item.id === payment.studentId);
      const group = groups.find((item) => item.id === student?.groupId);
      return [student?.name, group?.name, payment.amount, payment.date];
    });
    autoTable(doc, {
      head: [['الطالب', 'المجموعة', 'المبلغ', 'التاريخ']],
      body: tableData
    });
    doc.save('payments.pdf');
  };

  const openModal = (payment) => {
    if (payment) {
      setEditingPayment(payment);
      setForm({
        studentId: payment.studentId,
        amount: payment.amount,
        date: payment.date
      });
    } else {
      setEditingPayment(null);
      setForm(initialPayment);
    }
    setModalOpen(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.studentId || !form.amount || !form.date) return;
    if (editingPayment) {
      updatePayment(editingPayment.id, form);
    } else {
      addPayment({ ...form });
    }
    setModalOpen(false);
  };

  const tableColumns = [
    {
      header: 'الطالب',
      accessor: 'student',
      cell: (row) => students.find((student) => student.id === row.studentId)?.name
    },
    {
      header: 'المجموعة',
      accessor: 'group',
      cell: (row) => {
        const student = students.find((student) => student.id === row.studentId);
        return groups.find((group) => group.id === student?.groupId)?.name;
      }
    },
    {
      header: 'المبلغ',
      accessor: 'amount'
    },
    {
      header: 'التاريخ',
      accessor: 'date'
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
          <>
            <ActionButton icon={PlusCircle} onClick={() => openModal(null)}>
              إضافة دفعة جديدة
            </ActionButton>
            <ActionButton variant="outline" icon={Search} onClick={() => searchInputRef.current?.focus()}>
              بحث
            </ActionButton>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
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
        footer={
          <tr>
            <td className="px-6 py-4 font-bold" colSpan={3}>
              الإجمالي
            </td>
            <td className="px-6 py-4 text-brand-gold">{total.toLocaleString()} ر.س</td>
            <td />
          </tr>
        }
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="دفعة الطالب">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField label="الطالب">
            <select
              value={form.studentId}
              onChange={(event) => setForm((prev) => ({ ...prev, studentId: event.target.value }))}
              className="rounded-xl px-4 py-3"
            >
              <option value="">اختر الطالب</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="المبلغ (ر.س)">
            <input
              type="number"
              value={form.amount}
              onChange={(event) => setForm((prev) => ({ ...prev, amount: Number(event.target.value) }))}
              className="rounded-xl px-4 py-3"
            />
          </FormField>
          <FormField label="التاريخ">
            <input
              type="date"
              value={form.date}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              className="rounded-xl px-4 py-3"
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
