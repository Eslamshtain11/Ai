import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabaseClient.js';
import { fetchStudents } from '../services/students.js';
import { fetchGroups } from '../services/groups.js';
import {
  fetchPayments,
  createPayment,
  updatePayment,
  deletePayment
} from '../services/payments.js';
import RtlDatePicker from '../components/RtlDatePicker.jsx';
import { formatCurrency, formatDate, getCurrentYearMonth } from '../utils/formatters.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { utils, writeFile } from 'xlsx';
import { Pencil, Trash2, FileDown, FileSpreadsheet } from 'lucide-react';
import { parseISO, format } from 'date-fns';

const initialForm = {
  id: null,
  studentId: '',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  note: ''
};

export default function Payments() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [filterMonth, setFilterMonth] = useState(getCurrentYearMonth());

  const loadData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;
      const [studentsData, groupsData, paymentsData] = await Promise.all([
        fetchStudents(userId),
        fetchGroups(userId),
        fetchPayments(userId)
      ]);
      setStudents(studentsData);
      setGroups(groupsData);
      setPayments(paymentsData);
    } catch (error) {
      console.error('تعذر تحميل الدفعات:', error);
      toast.error('حدث خطأ أثناء تحميل الدفعات.');
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
      if (!form.studentId) {
        toast.error('اختر الطالب أولاً.');
        return;
      }
      if (!form.amount || Number(form.amount) <= 0) {
        toast.error('قيمة الدفعة يجب أن تكون موجبة.');
        return;
      }

      const payload = {
        student_id: form.studentId,
        amount: Number(form.amount),
        date: form.date,
        note: form.note.trim() || null
      };

      if (form.id) {
        const updated = await updatePayment(form.id, payload);
        setPayments((prev) => prev.map((payment) => (payment.id === updated.id ? updated : payment)));
        toast.success('تم تحديث الدفعة.');
      } else {
        const created = await createPayment(userId, payload);
        setPayments((prev) => [created, ...prev]);
        toast.success('تم تسجيل الدفعة.');
      }
      resetForm();
    } catch (error) {
      console.error('تعذر حفظ الدفعة:', error);
      toast.error('حدث خطأ أثناء حفظ الدفعة.');
    }
  };

  const handleEdit = (payment) => {
    setForm({
      id: payment.id,
      studentId: payment.student_id,
      amount: payment.amount,
      date: payment.date,
      note: payment.note ?? ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (paymentId) => {
    if (!window.confirm('هل تريد حذف هذه الدفعة؟')) return;
    try {
      await deletePayment(paymentId);
      setPayments((prev) => prev.filter((payment) => payment.id !== paymentId));
      toast.success('تم حذف الدفعة.');
    } catch (error) {
      toast.error('تعذر حذف الدفعة.');
    }
  };

  const studentMap = useMemo(() => {
    const map = new Map();
    students.forEach((student) => map.set(student.id, student));
    return map;
  }, [students]);

  const filteredPayments = useMemo(() => {
    if (!filterMonth) return payments;
    return payments.filter((payment) => {
      try {
        const monthValue = format(parseISO(payment.date), 'yyyy-MM');
        return monthValue === filterMonth;
      } catch (error) {
        return false;
      }
    });
  }, [payments, filterMonth]);

  const totalAmount = useMemo(
    () => filteredPayments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0),
    [filteredPayments]
  );

  const buildExportRows = () =>
    filteredPayments.map((payment) => {
      const student = studentMap.get(payment.student_id);
      const groupName = groups.find((group) => group.id === student?.group_id)?.name ?? 'بدون مجموعة';
      return {
        الطالب: student?.name ?? 'غير معروف',
        المجموعة: groupName,
        المبلغ: formatCurrency(payment.amount),
        التاريخ: formatDate(payment.date),
        ملاحظة: payment.note ?? ''
      };
    });

  const handleExportXlsx = () => {
    const rows = buildExportRows();
    const sheet = utils.json_to_sheet(rows);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, sheet, 'الدفعات');
    const name = `payments_${filterMonth || getCurrentYearMonth()}.xlsx`;
    writeFile(workbook, name);
  };

  const handleExportPdf = () => {
    const rows = buildExportRows();
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    doc.setFontSize(14);
    doc.text('كشف الدفعات', doc.internal.pageSize.getWidth() - 40, 40, { align: 'right' });
    autoTable(doc, {
      head: [['الطالب', 'المجموعة', 'المبلغ', 'التاريخ', 'ملاحظة']],
      body: rows.map((row) => [row['الطالب'], row['المجموعة'], row['المبلغ'], row['التاريخ'], row['ملاحظة']]),
      styles: { font: 'helvetica', fontStyle: 'normal', halign: 'right' },
      headStyles: { fillColor: [20, 30, 48], textColor: [212, 175, 55], halign: 'right' },
      margin: { right: 40, left: 40, top: 60 },
      didDrawPage: (data) => {
        doc.setFontSize(12);
        doc.text(
          `الإجمالي: ${formatCurrency(totalAmount)}`,
          doc.internal.pageSize.getWidth() - 40,
          doc.internal.pageSize.getHeight() - 30,
          { align: 'right' }
        );
      }
    });
    const name = `payments_${filterMonth || getCurrentYearMonth()}.pdf`;
    doc.save(name);
  };

  return (
    <div className="space-y-6" id="new">
      <section className="rounded-3xl border border-brand-secondary/20 bg-brand-navy/60 p-6 shadow-soft">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-brand-gold">تسجيل دفعة</h2>
            <p className="text-sm text-brand-secondary">اختر الطالب وقيمة الدفعة لتحديث رصيدك الشهري.</p>
          </div>
          <input
            type="month"
            value={filterMonth}
            onChange={(event) => setFilterMonth(event.target.value)}
            className="rounded-full border border-brand-secondary/30 bg-brand-blue/70 px-4 py-2 text-sm text-brand-light focus:border-brand-gold focus:outline-none"
          />
        </div>
        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm font-bold text-brand-light">
            الطالب
            <select
              value={form.studentId}
              onChange={(event) => setForm((prev) => ({ ...prev, studentId: event.target.value }))}
              className="rounded-xl border border-brand-secondary/30 bg-brand-blue/70 px-4 py-3 text-right text-brand-light focus:border-brand-gold focus:outline-none"
            >
              <option value="">اختر الطالب</option>
              {students.map((student) => (
                <option key={student.id} value={student.id} className="bg-brand-blue">
                  {student.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-bold text-brand-light">
            قيمة الدفعة (EGP)
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
            label="تاريخ الدفعة"
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
              className="rounded-full bg-emerald-500/20 px-6 py-3 text-sm font-black text-emerald-200 transition hover:bg-emerald-500/30"
            >
              {form.id ? 'تحديث الدفعة' : 'حفظ الدفعة'}
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
          <h3 className="text-lg font-bold text-brand-gold">جدول الدفعات</h3>
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
          <div className="py-12 text-center text-sm text-brand-secondary">جارٍ تحميل الدفعات...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="py-12 text-center text-sm text-brand-secondary">لا توجد دفعات في هذا الشهر.</div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-brand-secondary/20">
            <table className="w-full min-w-[700px] border-collapse text-sm">
              <thead className="bg-brand-blue/80 text-brand-gold">
                <tr>
                  <th className="px-4 py-3 text-right font-bold">الطالب</th>
                  <th className="px-4 py-3 text-right font-bold">المجموعة</th>
                  <th className="px-4 py-3 text-right font-bold">المبلغ</th>
                  <th className="px-4 py-3 text-right font-bold">التاريخ</th>
                  <th className="px-4 py-3 text-right font-bold">ملاحظة</th>
                  <th className="px-4 py-3 text-right font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => {
                  const student = studentMap.get(payment.student_id);
                  const groupName = groups.find((group) => group.id === student?.group_id)?.name ?? 'بدون مجموعة';
                  return (
                    <tr key={payment.id} className="border-t border-brand-secondary/10">
                      <td className="px-4 py-3 font-bold text-brand-light">{student?.name ?? 'غير معروف'}</td>
                      <td className="px-4 py-3 text-brand-secondary">{groupName}</td>
                      <td className="px-4 py-3 text-brand-secondary">{formatCurrency(payment.amount)}</td>
                      <td className="px-4 py-3 text-brand-secondary">{formatDate(payment.date)}</td>
                      <td className="px-4 py-3 text-brand-secondary">{payment.note || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(payment)}
                            className="rounded-full border border-brand-secondary/40 p-2 text-brand-light transition hover:border-brand-gold hover:text-brand-gold"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(payment.id)}
                            className="rounded-full border border-rose-500/40 p-2 text-rose-200 transition hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-brand-gold/10 font-bold text-brand-gold">
                  <td className="px-4 py-3" colSpan={2}>
                    الإجمالي
                  </td>
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
