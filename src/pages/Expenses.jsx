import { useMemo, useState } from 'react';
import { Calendar, FileDown, FileSpreadsheet, PlusCircle, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import SectionHeader from '../components/SectionHeader';
import ActionButton from '../components/ActionButton';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import { useAppData } from '../context/AppDataContext';
import toast from 'react-hot-toast';

const initialExpense = {
  description: '',
  amount: '',
  date: ''
};

export default function Expenses() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useAppData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [form, setForm] = useState(initialExpense);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMonth = selectedMonth
        ? format(parseISO(expense.date), 'yyyy-MM') === selectedMonth
        : true;
      return matchesSearch && matchesMonth;
    });
  }, [expenses, searchTerm, selectedMonth]);

  const total = useMemo(
    () => filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [filteredExpenses]
  );

  const openModal = (expense) => {
    if (expense) {
      setEditingExpense(expense);
      setForm({
        description: expense.description,
        amount: expense.amount,
        date: expense.date
      });
    } else {
      setEditingExpense(null);
      setForm(initialExpense);
    }
    setModalOpen(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.description || !form.amount || !form.date) return;
    if (editingExpense) {
      updateExpense(editingExpense.id, form);
    } else {
      addExpense(form);
    }
    setModalOpen(false);
  };

  const handleExport = (formatType) => {
    toast.success(`تم تجهيز ملف ${formatType} للتنزيل (وضع تجريبي)`);
  };

  const columns = [
    { header: 'الوصف', accessor: 'description' },
    { header: 'المبلغ', accessor: 'amount' },
    { header: 'التاريخ', accessor: 'date' },
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

      <div className="grid gap-4 md:grid-cols-3">
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
          <select
            className="w-full bg-transparent text-sm"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
          >
            <option value="">كل الأشهر</option>
            {Array.from(new Set(expenses.map((expense) => format(parseISO(expense.date), 'yyyy-MM')))).map((month) => (
              <option key={month} value={month}>
                {format(parseISO(`${month}-01`), 'MMMM yyyy', { locale: ar })}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap justify-end gap-3">
          <ActionButton variant="success" icon={FileSpreadsheet} onClick={() => handleExport('XLSX')}>
            تصدير XLSX
          </ActionButton>
          <ActionButton variant="danger" icon={FileDown} onClick={() => handleExport('PDF')}>
            تصدير PDF
          </ActionButton>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredExpenses}
        footer={
          <tr>
            <td className="px-6 py-4 font-bold" colSpan={2}>
              إجمالي المصروفات
            </td>
            <td className="px-6 py-4 text-brand-gold">{total.toLocaleString()} ر.س</td>
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
            />
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
              {editingExpense ? 'تحديث' : 'حفظ'}
            </ActionButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
