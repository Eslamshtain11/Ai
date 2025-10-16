import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { fetchGroups, createGroup } from '../services/groups.js';
import {
  fetchStudents,
  createStudent,
  updateStudent,
  deleteStudent
} from '../services/students.js';
import { supabase } from '../services/supabaseClient.js';
import RtlDatePicker from '../components/RtlDatePicker.jsx';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { Pencil, Trash2 } from 'lucide-react';

const initialForm = {
  id: null,
  name: '',
  phone: '',
  groupId: '',
  newGroupName: '',
  joinDate: new Date().toISOString().slice(0, 10),
  monthlyFee: '',
  note: ''
};

export default function Students() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;
      const [groupsData, studentsData] = await Promise.all([
        fetchGroups(userId),
        fetchStudents(userId)
      ]);
      setGroups(groupsData);
      setStudents(studentsData);
    } catch (error) {
      console.error('فشل تحميل بيانات الطلاب:', error);
      toast.error('تعذر تحميل بيانات الطلاب، حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => setForm(initialForm);

  const handleEdit = (student) => {
    setForm({
      id: student.id,
      name: student.name,
      phone: student.phone ?? '',
      groupId: student.group_id ?? '',
      newGroupName: '',
      joinDate: student.join_date ?? new Date().toISOString().slice(0, 10),
      monthlyFee: student.monthly_fee ?? '',
      note: student.note ?? ''
    });
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm('هل أنت متأكد من حذف الطالب؟')) return;
    try {
      await deleteStudent(studentId);
      setStudents((prev) => prev.filter((student) => student.id !== studentId));
      toast.success('تم حذف الطالب بنجاح.');
    } catch (error) {
      toast.error('تعذر حذف الطالب.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!supabase) {
      toast.error('تأكد من إعداد مفاتيح Supabase.');
      return;
    }
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;

      let groupId = form.groupId || null;
      if (form.groupId === 'new' && form.newGroupName.trim()) {
        const newGroup = await createGroup(userId, form.newGroupName.trim());
        setGroups((prev) => [...prev, newGroup]);
        groupId = newGroup.id;
      }

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        group_id: groupId,
        join_date: form.joinDate || null,
        monthly_fee: form.monthlyFee ? Number(form.monthlyFee) : 0,
        note: form.note.trim() || null
      };

      if (!payload.name) {
        toast.error('اسم الطالب مطلوب.');
        return;
      }

      if (form.id) {
        const updated = await updateStudent(form.id, payload);
        setStudents((prev) => prev.map((student) => (student.id === updated.id ? updated : student)));
        toast.success('تم تحديث بيانات الطالب.');
      } else {
        const created = await createStudent(userId, payload);
        setStudents((prev) => [created, ...prev]);
        toast.success('تم إضافة الطالب بنجاح.');
      }

      resetForm();
    } catch (error) {
      console.error('فشل حفظ بيانات الطالب:', error);
      toast.error('تعذر حفظ بيانات الطالب.');
    }
  };

  const filteredStudents = useMemo(() => {
    const term = search.trim();
    if (!term) return students;
    return students.filter(
      (student) =>
        student.name.includes(term) ||
        (student.phone && student.phone.includes(term))
    );
  }, [students, search]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-brand-secondary/20 bg-brand-navy/60 p-6 shadow-soft">
        <h2 className="text-lg font-bold text-brand-gold">تسجيل طالب جديد</h2>
        <p className="mt-1 text-sm text-brand-secondary">املأ البيانات التالية لإضافة طالب إلى مجموعاتك.</p>
        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm font-bold text-brand-light md:col-span-2">
            اسم الطالب
            <input
              name="name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
              className="rounded-xl border border-brand-secondary/30 bg-brand-blue/70 px-4 py-3 text-right text-brand-light focus:border-brand-gold focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-bold text-brand-light">
            رقم الهاتف
            <input
              name="phone"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              className="rounded-xl border border-brand-secondary/30 bg-brand-blue/70 px-4 py-3 text-right text-brand-light focus:border-brand-gold focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-bold text-brand-light">
            المجموعة
            <select
              value={form.groupId}
              onChange={(event) => setForm((prev) => ({ ...prev, groupId: event.target.value }))}
              className="rounded-xl border border-brand-secondary/30 bg-brand-blue/70 px-4 py-3 text-right text-brand-light focus:border-brand-gold focus:outline-none"
            >
              <option value="">بدون مجموعة</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id} className="bg-brand-blue">
                  {group.name}
                </option>
              ))}
              <option value="new" className="bg-brand-blue">
                + إضافة مجموعة جديدة
              </option>
            </select>
          </label>
          {form.groupId === 'new' && (
            <label className="flex flex-col gap-2 text-sm font-bold text-brand-light">
              اسم المجموعة الجديدة
              <input
                value={form.newGroupName}
                onChange={(event) => setForm((prev) => ({ ...prev, newGroupName: event.target.value }))}
                className="rounded-xl border border-brand-secondary/30 bg-brand-blue/70 px-4 py-3 text-right text-brand-light focus:border-brand-gold focus:outline-none"
              />
            </label>
          )}
          <RtlDatePicker
            label="تاريخ الانضمام"
            value={form.joinDate}
            onChange={(value) => setForm((prev) => ({ ...prev, joinDate: value }))}
            required
          />
          <label className="flex flex-col gap-2 text-sm font-bold text-brand-light">
            المصروف الشهري
            <input
              name="monthlyFee"
              value={form.monthlyFee}
              onChange={(event) => setForm((prev) => ({ ...prev, monthlyFee: event.target.value }))}
              type="number"
              min="0"
              step="0.5"
              className="rounded-xl border border-brand-secondary/30 bg-brand-blue/70 px-4 py-3 text-right text-brand-light focus:border-brand-gold focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-bold text-brand-light md:col-span-2">
            ملاحظات
            <textarea
              name="note"
              value={form.note}
              onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
              rows="3"
              className="rounded-xl border border-brand-secondary/30 bg-brand-blue/70 px-4 py-3 text-right text-brand-light focus:border-brand-gold focus:outline-none"
            />
          </label>
          <div className="flex items-center gap-3 md:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-brand-gold px-6 py-3 text-sm font-black text-brand-blue transition hover:bg-brand-gold/90"
            >
              {form.id ? 'تحديث بيانات الطالب' : 'إضافة الطالب'}
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
          <div>
            <h3 className="text-lg font-bold text-brand-gold">قائمة الطلاب</h3>
            <p className="text-sm text-brand-secondary">ابحث بسرعة باستخدام الاسم أو رقم الهاتف.</p>
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث باسم الطالب..."
            className="w-full rounded-full border border-brand-secondary/30 bg-brand-blue/70 px-4 py-2 text-sm text-brand-light placeholder:text-brand-secondary focus:border-brand-gold focus:outline-none md:w-72"
          />
        </div>
        {loading ? (
          <div className="py-12 text-center text-sm text-brand-secondary">جارٍ تحميل الطلاب...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-12 text-center text-sm text-brand-secondary">لا توجد نتائج مطابقة.</div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-brand-secondary/20">
            <table className="w-full min-w-[600px] border-collapse text-sm">
              <thead className="bg-brand-blue/80 text-brand-gold">
                <tr>
                  <th className="px-4 py-3 text-right font-bold">الطالب</th>
                  <th className="px-4 py-3 text-right font-bold">المجموعة</th>
                  <th className="px-4 py-3 text-right font-bold">الهاتف</th>
                  <th className="px-4 py-3 text-right font-bold">رسوم شهرية</th>
                  <th className="px-4 py-3 text-right font-bold">تاريخ الانضمام</th>
                  <th className="px-4 py-3 text-right font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const groupName = groups.find((group) => group.id === student.group_id)?.name ?? 'بدون مجموعة';
                  return (
                    <tr key={student.id} className="border-t border-brand-secondary/10">
                      <td className="px-4 py-3 font-bold text-brand-light">{student.name}</td>
                      <td className="px-4 py-3 text-brand-secondary">{groupName}</td>
                      <td className="px-4 py-3 text-brand-secondary">{student.phone || 'غير مسجل'}</td>
                      <td className="px-4 py-3 text-brand-secondary">{formatCurrency(student.monthly_fee)}</td>
                      <td className="px-4 py-3 text-brand-secondary">{formatDate(student.join_date)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(student)}
                            className="rounded-full border border-brand-secondary/40 p-2 text-brand-light transition hover:border-brand-gold hover:text-brand-gold"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(student.id)}
                            className="rounded-full border border-rose-500/40 p-2 text-rose-200 transition hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
