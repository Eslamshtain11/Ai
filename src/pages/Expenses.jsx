import { useMemo, useState } from 'react';
import { Calendar, FileDown, FileSpreadsheet, PlusCircle, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import SectionHeader from '../components/SectionHeader';
import ActionButton from '../components/ActionButton';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import SmartDatePicker from '../components/SmartDatePicker';
import { useAppData } from '../context/AppDataContext';
import { formatCurrencyEGP } from '../utils/formatters';

const initialExpense = {
  description: '',
  amount: '',
  date: '',
  note: ''
};

export default function Expenses() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useAppData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [form, setForm] = useState(initialExpense);

  const monthKey = selectedMonth ? format(selectedMonth, 'yyyy-MM') : '';

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMonth = monthKey ? format(parseISO(expense.date), 'yyyy-MM') === monthKey : true;
      return matchesSearch && matchesMonth;
    });
  }, [expenses, searchTerm, monthKey]);

  const total = useMemo(
    () => filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0),
    [filteredExpenses]
  );

  const openModal = (expense) => {
    if (expense) {
      setEditingExpense(expense);
      setForm({
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
        note: expense.note ?? ''
      });
    } else {
      setEditingExpense(null);
      setForm(initialExpense);
    }
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.description || !form.amount || !form.date) return;
    if (editingExpense) {
      await updateExpense(editingExpense.id, form);
    } else {
      await addExpense(form);
    }
    setModalOpen(false);
  };

  const columns = [
    { header: 'الوصف', accessor: 'description' },
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
          <ActionButton variant="danger" onClick={() => deleteExpense(row.id)}>
            حذف
          </ActionButton>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-10">
      <SectionHeader
        title="المصروفات"
        subtitle="تابع النفقات الشهرية الخاصة بعملك"
        actions={
          <ActionButton icon={PlusCircle} onClick={() => openModal(null)}>
            إضافة مصروف
          </ActionButton>
        }
      />

      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="relative">
          <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-secondary" />
          <input
            type="text"
            placeholder="ابحث في وصف المصروف"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-2xl border border-brand-secondary/30 bg-brand-blue/60 px-5 py-3 pr-10 text-sm"
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
          <ActionButton variant="success" icon={FileSpreadsheet} onClick={() => console.info('XLSX export placeholder')}>
            تصدير XLSX
          </ActionButton>
          <ActionButton variant="danger" icon={FileDown} onClick={() => console.info('PDF export placeholder')}>
            تصدير PDF
          </ActionButton>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredExpenses}
        footer={
          <tr>
            <td className="px-6 py-4 font-bold" colSpan={3}>
              إجمالي المصروفات
            </td>
            <td className="px-6 py-4 text-brand-gold">{formatCurrencyEGP(total)}</td>
            <td />
          </tr>
        }
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="مصروف جديد">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField label="الوصف">
            <input
              type="text"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              className="rounded-xl px-4 py-3"
              required
            />
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
              {editingExpense ? 'تحديث' : 'حفظ'}
            </ActionButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
