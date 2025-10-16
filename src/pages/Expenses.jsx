import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabaseClient.js';
import {
  fetchExpenses,
  createExpense,
  updateExpense,
  deleteExpense
} from '../services/expenses.js';
import RtlDatePicker from '../components/RtlDatePicker.jsx';
import { formatCurrency, formatDate, getCurrentYearMonth } from '../utils/formatters.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { utils, writeFile } from 'xlsx';
import { Pencil, Trash2, FileDown, FileSpreadsheet } from 'lucide-react';
import { parseISO, format } from 'date-fns';

const initialForm = {
  id: null,
  description: '',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  note: ''
};

export default function Expenses() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [filterMonth, setFilterMonth] = useState(getCurrentYearMonth());

  const loadData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;
      const expensesData = await fetchExpenses(userId);
      setExpenses(expensesData);
    } catch (error) {
      console.error('تعذر تحميل المصروفات:', error);
      toast.error('حدث خطأ أثناء تحميل المصروفات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => setForm(initialForm);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!supabase) {
      toast.error('تأكد من إعداد Supabase.');
      return;
    }
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;
      if (!form.description.trim()) {
        toast.error('الوصف مطلوب.');
        return;
      }
      if (!form.amount || Number(form.amount) <= 0) {
        toast.error('قيمة المصروف يجب أن تكون موجبة.');
        return;
      }

      const payload = {
        description: form.description.trim(),
        amount: Number(form.amount),
        date: form.date,
        note: form.note.trim() || null
      };

      if (form.id) {
        const updated = await updateExpense(form.id, payload);
        setExpenses((prev) => prev.map((expense) => (expense.id === updated.id ? updated : expense)));
        toast.success('تم تحديث المصروف.');
      } else {
        const created = await createExpense(userId, payload);
        setExpenses((prev) => [created, ...prev]);
        toast.success('تم تسجيل المصروف.');
      }
      resetForm();
    } catch (error) {
      console.error('تعذر حفظ المصروف:', error);
      toast.error('حدث خطأ أثناء حفظ المصروف.');
    }
  };

  const handleEdit = (expense) => {
    setForm({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      date: expense.date,
      note: expense.note ?? ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm('هل تريد حذف هذا المصروف؟')) return;
    try {
      await deleteExpense(expenseId);
      setExpenses((prev) => prev.filter((expense) => expense.id !== expenseId));
      toast.success('تم حذف المصروف.');
    } catch (error) {
      toast.error('تعذر حذف المصروف.');
    }
  };

  const filteredExpenses = useMemo(() => {
    if (!filterMonth) return expenses;
    return expenses.filter((expense) => {
      try {
        const monthValue = format(parseISO(expense.date), 'yyyy-MM');
        return monthValue === filterMonth;
      } catch (error) {
        return false;
      }
    });
  }, [expenses, filterMonth]);

  const totalAmount = useMemo(
    () => filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0),
    [filteredExpenses]
  );

  const buildExportRows = () =>
    filteredExpenses.map((expense) => ({
      الوصف: expense.description,
      المبلغ: formatCurrency(expense.amount),
      التاريخ: formatDate(expense.date),
      ملاحظة: expense.note ?? ''
    }));

  const handleExportXlsx = () => {
    const rows = buildExportRows();
    const sheet = utils.json_to_sheet(rows);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, sheet, 'المصروفات');
    const name = `expenses_${filterMonth || getCurrentYearMonth()}.xlsx`;
    writeFile(workbook, name);
  };

  const handleExportPdf = () => {
    const rows = buildExportRows();
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    doc.setFontSize(14);
    doc.text('كشف المصروفات', doc.internal.pageSize.getWidth() - 40, 40, { align: 'right' });
    autoTable(doc, {
      head: [['الوصف', 'المبلغ', 'التاريخ', 'ملاحظة']],
      body: rows.map((row) => [row['الوصف'], row['المبلغ'], row['التاريخ'], row['ملاحظة']]),
      styles: { font: 'helvetica', fontStyle: 'normal', halign: 'right' },
      headStyles: { fillColor: [23, 42, 70], textColor: [212, 175, 55], halign: 'right' },
      margin: { right: 40, left: 40, top: 60 },
      didDrawPage: () => {
        doc.setFontSize(12);
        doc.text(
          `الإجمالي: ${formatCurrency(totalAmount)}`,
          doc.internal.pageSize.getWidth() - 40,
          doc.internal.pageSize.getHeight() - 30,
          { align: 'right' }
        );
      }
    });
    const name = `expenses_${filterMonth || getCurrentYearMonth()}.pdf`;
    doc.save(name);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-brand-secondary/20 bg-brand-navy/60 p-6 shadow-soft">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-brand-gold">تسجيل مصروف</h2>
            <p className="text-sm text-brand-secondary">تتبع مصروفاتك الشهرية بسهولة ودقة.</p>
          </div>
          <input
            type="month"
            value={filterMonth}
            onChange={(event) => setFilterMonth(event.target.value)}
            className="rounded-full border border-brand-secondary/30 bg-brand-blue/70 px-4 py-2 text-sm text-brand-light focus:border-brand-gold focus:outline-none"
          />
        </div>
        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm font-bold text-brand-light md:col-span-2">
            الوصف
            <input
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              required
              className="rounded-xl border border-brand-secondary/30 bg-brand-blue/70 px-4 py-3 text-right text-brand-light focus:border-brand-gold focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-bold text-brand-light">
            قيمة المصروف (EGP)
            <input
              type="number"
              min="0"
              step="0.5"
              value={form.amount}
              onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
              className="rounded-xl border border-brand-secondary/30 bg-brand-blue/70 px-4 py-3 text-right text-brand-light focus:border-brand-gold focus:outline-none"
            />
          </label>
          <RtlDatePicker
            label="تاريخ المصروف"
            value={form.date}
            onChange={(value) => setForm((prev) => ({ ...prev, date: value }))}
            required
          />
          <label className="flex flex-col gap-2 text-sm font-bold text-brand-light">
            ملاحظات
            <input
              value={form.note}
              onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
              className="rounded-xl border border-brand-secondary/30 bg-brand-blue/70 px-4 py-3 text-right text-brand-light focus:border-brand-gold focus:outline-none"
            />
          </label>
          <div className="flex items-center gap-3 md:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-rose-500/20 px-6 py-3 text-sm font-black text-rose-200 transition hover:bg-rose-500/30"
            >
              {form.id ? 'تحديث المصروف' : 'حفظ المصروف'}
            </button>
            {form.id && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-brand-secondary/40 px-6 py-3 text-sm font-bold text-brand-secondary transition hover:border-brand-gold hover:text-brand-gold"
              >
                إلغاء التعديل
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-brand-secondary/20 bg-brand-navy/60 p-6 shadow-soft">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-bold text-brand-gold">جدول المصروفات</h3>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExportXlsx}
              className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-5 py-2 text-sm font-bold text-emerald-200 transition hover:bg-emerald-500/30"
            >
              <FileSpreadsheet className="h-4 w-4" />
              XLSX
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              className="flex items-center gap-2 rounded-full bg-rose-500/20 px-5 py-2 text-sm font-bold text-rose-200 transition hover:bg-rose-500/30"
            >
              <FileDown className="h-4 w-4" />
              PDF
            </button>
          </div>
        </div>
        {loading ? (
          <div className="py-12 text-center text-sm text-brand-secondary">جارٍ تحميل المصروفات...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="py-12 text-center text-sm text-brand-secondary">لا توجد مصروفات في هذا الشهر.</div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-brand-secondary/20">
            <table className="w-full min-w-[650px] border-collapse text-sm">
              <thead className="bg-brand-blue/80 text-brand-gold">
                <tr>
                  <th className="px-4 py-3 text-right font-bold">الوصف</th>
                  <th className="px-4 py-3 text-right font-bold">المبلغ</th>
                  <th className="px-4 py-3 text-right font-bold">التاريخ</th>
                  <th className="px-4 py-3 text-right font-bold">ملاحظة</th>
                  <th className="px-4 py-3 text-right font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="border-t border-brand-secondary/10">
                    <td className="px-4 py-3 font-bold text-brand-light">{expense.description}</td>
                    <td className="px-4 py-3 text-brand-secondary">{formatCurrency(expense.amount)}</td>
                    <td className="px-4 py-3 text-brand-secondary">{formatDate(expense.date)}</td>
                    <td className="px-4 py-3 text-brand-secondary">{expense.note || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(expense)}
                          className="rounded-full border border-brand-secondary/40 p-2 text-brand-light transition hover:border-brand-gold hover:text-brand-gold"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(expense.id)}
                          className="rounded-full border border-rose-500/40 p-2 text-rose-200 transition hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="bg-brand-gold/10 font-bold text-brand-gold">
                  <td className="px-4 py-3">الإجمالي</td>
                  <td className="px-4 py-3">{formatCurrency(totalAmount)}</td>
                  <td className="px-4 py-3" colSpan={3}></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
