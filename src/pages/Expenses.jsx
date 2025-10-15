import { useMemo, useState } from 'react';
import { Calendar, FileDown, FileSpreadsheet, PlusCircle, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
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
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

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
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!form.description.trim()) {
      nextErrors.description = 'أدخل وصفًا للمصروف.';
    }
    if (form.amount === '' || Number(form.amount) < 0) {
      nextErrors.amount = 'أدخل مبلغًا صحيحًا.';
    }
    if (!form.date) {
      nextErrors.date = 'حدد تاريخ المصروف.';
    }
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error('يرجى تصحيح الحقول المطلوبة قبل الحفظ.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount ?? 0)
      };
      if (editingExpense) {
        await updateExpense(editingExpense.id, payload);
      } else {
        await addExpense(payload);
      }
      setModalOpen(false);
      setForm(initialExpense);
      setFormErrors({});
    } finally {
      setSubmitting(false);
    }
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
          <ActionButton
            variant="success"
            icon={FileSpreadsheet}
            onClick={() => toast('ميزة التصدير للمصروفات ستتم إضافتها قريبًا.')}
          >
            تصدير XLSX
          </ActionButton>
          <ActionButton
            variant="danger"
            icon={FileDown}
            onClick={() => toast('ميزة التصدير للمصروفات ستتم إضافتها قريبًا.')}
          >
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
          <FormField label="الوصف" error={formErrors.description}>
            <input
              type="text"
              value={form.description}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, description: event.target.value }));
                if (formErrors.description) {
                  setFormErrors((prev) => ({ ...prev, description: undefined }));
                }
              }}
              className="rounded-xl px-4 py-3"
              required
            />
          </FormField>
          <FormField label="المبلغ (ج.م)" error={formErrors.amount}>
            <input
              type="number"
              value={form.amount}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, amount: event.target.value }));
                if (formErrors.amount) {
                  setFormErrors((prev) => ({ ...prev, amount: undefined }));
                }
              }}
              className="rounded-xl px-4 py-3"
              required
              min={0}
              step={1}
              inputMode="decimal"
              dir="ltr"
            />
          </FormField>
          <FormField label="التاريخ" error={formErrors.date}>
            <SmartDatePicker
              selected={form.date ? parseISO(form.date) : null}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, date: value ? format(value, 'yyyy-MM-dd') : '' }))
              }
              placeholderText="اختر التاريخ"
              onCalendarClose={() => {
                if (formErrors.date && form.date) {
                  setFormErrors((prev) => ({ ...prev, date: undefined }));
                }
              }}
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
            <ActionButton
              variant="subtle"
              onClick={() => {
                setModalOpen(false);
                setFormErrors({});
              }}
              disabled={submitting}
            >
              إلغاء
            </ActionButton>
            <ActionButton type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'جارٍ الحفظ...' : editingExpense ? 'تحديث المصروف' : 'حفظ المصروف'}
            </ActionButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
