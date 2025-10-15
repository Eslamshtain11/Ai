import { useMemo, useState } from 'react';
import { CheckCircle2, Plus, Search, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import SectionHeader from '../components/SectionHeader';
import ActionButton from '../components/ActionButton';
import FormField from '../components/FormField';
import DataTable from '../components/DataTable';
import SmartDatePicker from '../components/SmartDatePicker';
import { useAppData } from '../context/AppDataContext';
import { formatCurrencyEGP } from '../utils/formatters';
import { isPositiveAmount, isValidEgyptPhone } from '../utils/validation';

const initialForm = {
  name: '',
  phone: '',
  group_id: '',
  join_date: '',
  monthly_fee: '',
  note: ''
};

export default function StudentsRegister() {
  const { groups, students, addStudent } = useAppData();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const nextErrors = {};
    if (!form.name.trim()) {
      nextErrors.name = 'اسم الطالب مطلوب.';
    }
    if (form.phone && !isValidEgyptPhone(form.phone)) {
      nextErrors.phone = 'رقم الجوال غير صحيح.';
    }
    if (!form.group_id) {
      nextErrors.group_id = 'اختر مجموعة للطالب.';
    }
    if (!form.join_date) {
      nextErrors.join_date = 'حدد تاريخ الانضمام.';
    }
    if (form.monthly_fee !== '' && !isPositiveAmount(form.monthly_fee)) {
      nextErrors.monthly_fee = 'الرسوم يجب أن تكون رقمًا موجبًا أو صفرًا.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error('يرجى تصحيح الحقول المطلوبة قبل الحفظ.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      await addStudent({
        name: form.name,
        phone: form.phone,
        group_id: form.group_id,
        join_date: form.join_date,
        monthly_fee: Number(form.monthly_fee || 0),
        note: form.note
      });
      setForm(initialForm);
      setErrors({});
    } finally {
      setSaving(false);
    }
  };

  const recentStudents = useMemo(() => {
    const filtered = students.filter((student) => {
      const matchesName = (student.name ?? '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGroup = groupFilter ? student.group_id === groupFilter : true;
      return matchesName && matchesGroup;
    });
    return filtered
      .slice()
      .sort((a, b) => new Date(b.created_at ?? b.join_date) - new Date(a.created_at ?? a.join_date))
      .slice(0, 10);
  }, [students, searchTerm, groupFilter]);

  const tableColumns = [
    { header: 'الطالب', accessor: 'name' },
    {
      header: 'المجموعة',
      accessor: 'group',
      cell: (row) => groups.find((group) => group.id === row.group_id)?.name ?? 'غير محدد'
    },
    {
      header: 'تاريخ الانضمام',
      accessor: 'join_date',
      cell: (row) => (row.join_date ? format(parseISO(row.join_date), 'dd/MM/yyyy') : '-')
    },
    {
      header: 'الرسوم الشهرية',
      accessor: 'monthly_fee',
      cell: (row) => formatCurrencyEGP(row.monthly_fee)
    }
  ];

  return (
    <div className="space-y-10">
      <SectionHeader
        title="تسجيل طالب جديد"
        subtitle="أضف الطلاب وحدّث بياناتهم مع عرض أحدث عمليات التسجيل"
      />

      <div className="rounded-3xl border border-brand-secondary/20 bg-brand-navy/60 p-8 shadow-soft">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="اسم الطالب" error={errors.name}>
              <input
                type="text"
                value={form.name}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, name: event.target.value }));
                  if (errors.name) {
                    setErrors((prev) => ({ ...prev, name: undefined }));
                  }
                }}
                className="rounded-xl px-4 py-3"
                placeholder="اكتب اسم الطالب"
                required
              />
            </FormField>
            <FormField label="رقم ولي الأمر/الطالب (اختياري)" error={errors.phone}>
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => {
                  const value = event.target.value.replace(/[^0-9]/g, '');
                  setForm((prev) => ({ ...prev, phone: value }));
                  if (errors.phone) {
                    setErrors((prev) => ({ ...prev, phone: undefined }));
                  }
                }}
                className="rounded-xl px-4 py-3"
                placeholder="010XXXXXXXX"
                inputMode="numeric"
                dir="ltr"
                maxLength={11}
              />
            </FormField>
            <FormField label="المجموعة" error={errors.group_id}>
              <select
                value={form.group_id}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, group_id: event.target.value }));
                  if (errors.group_id) {
                    setErrors((prev) => ({ ...prev, group_id: undefined }));
                  }
                }}
                className="rounded-xl px-4 py-3"
                required
              >
                <option value="">اختر المجموعة</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="تاريخ الانضمام" error={errors.join_date}>
              <SmartDatePicker
                selected={form.join_date ? parseISO(form.join_date) : null}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, join_date: value ? format(value, 'yyyy-MM-dd') : '' }))
                }
                placeholderText="اختر تاريخ الانضمام"
                onCalendarClose={() => {
                  if (errors.join_date && form.join_date) {
                    setErrors((prev) => ({ ...prev, join_date: undefined }));
                  }
                }}
              />
            </FormField>
            <FormField label="الرسوم الشهرية (ج.م)" error={errors.monthly_fee}>
              <input
                type="number"
                value={form.monthly_fee}
                onChange={(event) => {
                  const value = event.target.value;
                  setForm((prev) => ({ ...prev, monthly_fee: value }));
                  if (errors.monthly_fee) {
                    setErrors((prev) => ({ ...prev, monthly_fee: undefined }));
                  }
                }}
                className="rounded-xl px-4 py-3"
                placeholder="مثال: 400"
                min={0}
                step={1}
              />
            </FormField>
            <FormField label="ملاحظات إضافية">
              <textarea
                value={form.note}
                onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
                className="rounded-xl px-4 py-3"
                rows={3}
                placeholder="أضف أي تفاصيل إضافية"
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-3">
            <ActionButton
              type="button"
              variant="subtle"
              icon={XCircle}
              onClick={() => {
                setForm(initialForm);
                setErrors({});
              }}
            >
              إلغاء
            </ActionButton>
            <ActionButton type="submit" icon={saving ? CheckCircle2 : Plus} disabled={saving}>
              {saving ? 'جاري الحفظ...' : 'حفظ الطالب'}
            </ActionButton>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-brand-secondary/30 bg-brand-blue/60 px-5 py-3">
            <Search className="h-5 w-5 text-brand-secondary" />
            <input
              type="text"
              placeholder="بحث باسم الطالب"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full bg-transparent text-sm"
            />
          </div>
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-brand-secondary/30 bg-brand-blue/60 px-5 py-3">
            <span className="text-sm text-brand-secondary">المجموعة</span>
            <select
              value={groupFilter}
              onChange={(event) => setGroupFilter(event.target.value)}
              className="w-full rounded-xl bg-brand-blue px-3 py-2 text-sm"
            >
              <option value="">كل المجموعات</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DataTable columns={tableColumns} data={recentStudents} />
      </div>
    </div>
  );
}
