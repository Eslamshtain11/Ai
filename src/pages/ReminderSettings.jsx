import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Save } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import ActionButton from '../components/ActionButton';
import FormField from '../components/FormField';
import DataTable from '../components/DataTable';
import { useAppData } from '../context/AppDataContext';

const buildInitialGeneral = (settings) => ({
  reminder_days_before: settings?.reminder_days_before ?? 3,
  reminder_days_after: settings?.reminder_days_after ?? 2,
  use_group_override: settings?.use_group_override ?? false,
  use_student_override: settings?.use_student_override ?? false
});

export default function ReminderSettings() {
  const {
    settings,
    groups,
    students,
    groupOverrides,
    studentOverrides,
    saveReminderSettings,
    saveGroupReminder,
    saveStudentReminder,
    getEffectiveReminderDays
  } = useAppData();
  const [generalForm, setGeneralForm] = useState(buildInitialGeneral(settings));
  const [groupForms, setGroupForms] = useState({});
  const [studentForm, setStudentForm] = useState({ studentId: '', before: '', after: '' });
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingGroup, setSavingGroup] = useState('');
  const [savingStudent, setSavingStudent] = useState(false);

  useEffect(() => {
    setGeneralForm(buildInitialGeneral(settings));
  }, [settings]);

  useEffect(() => {
    const map = {};
    groups.forEach((group) => {
      const override = groupOverrides?.find((item) => item.group_id === group.id);
      map[group.id] = {
        reminder_days_before: override?.reminder_days_before ?? settings?.reminder_days_before ?? 3,
        reminder_days_after: override?.reminder_days_after ?? settings?.reminder_days_after ?? 2
      };
    });
    setGroupForms(map);
  }, [groups, groupOverrides, settings]);

  useEffect(() => {
    if (!studentForm.studentId) return;
    const override = studentOverrides?.find((item) => item.student_id === studentForm.studentId);
    setStudentForm((prev) => ({
      ...prev,
      before: override?.reminder_days_before ?? '',
      after: override?.reminder_days_after ?? ''
    }));
  }, [studentForm.studentId, studentOverrides]);

  const handleGeneralSubmit = async (event) => {
    event.preventDefault();
    setSavingGeneral(true);
    try {
      await saveReminderSettings(generalForm);
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleGroupChange = (groupId, key, value) => {
    setGroupForms((prev) => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        [key]: value === '' ? '' : Number(value)
      }
    }));
  };

  const handleGroupSave = async (groupId) => {
    setSavingGroup(groupId);
    try {
      const current = groupForms[groupId] ?? {};
      await saveGroupReminder(groupId, {
        reminder_days_before:
          current.reminder_days_before === '' ? null : Number(current.reminder_days_before),
        reminder_days_after: current.reminder_days_after === '' ? null : Number(current.reminder_days_after)
      });
    } finally {
      setSavingGroup('');
    }
  };

  const handleStudentSave = async (event) => {
    event.preventDefault();
    if (!studentForm.studentId) return;
    setSavingStudent(true);
    try {
      await saveStudentReminder(studentForm.studentId, {
        reminder_days_before: studentForm.before === '' ? null : Number(studentForm.before),
        reminder_days_after: studentForm.after === '' ? null : Number(studentForm.after)
      });
      setStudentForm({ studentId: '', before: '', after: '' });
    } finally {
      setSavingStudent(false);
    }
  };

  const effectiveRows = useMemo(
    () =>
      students.map((student) => {
        const effective = getEffectiveReminderDays(student.id, student.group_id);
        return {
          id: student.id,
          name: student.name,
          group: groups.find((group) => group.id === student.group_id)?.name ?? 'غير محدد',
          before: effective.before,
          after: effective.after
        };
      }),
    [getEffectiveReminderDays, groups, students]
  );

  const effectiveColumns = [
    { header: 'الطالب', accessor: 'name' },
    { header: 'المجموعة', accessor: 'group' },
    { header: 'تذكير قبل (يوم)', accessor: 'before' },
    { header: 'تذكير بعد (يوم)', accessor: 'after' }
  ];

  return (
    <div className="space-y-10">
      <SectionHeader
        title="إعدادات التذكير"
        subtitle="تحكم في مواعيد التذكير العامة والمخصصة لكل مجموعة أو طالب"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleGeneralSubmit}
          className="space-y-6 rounded-3xl border border-brand-secondary/20 bg-brand-navy/60 p-8 shadow-soft"
        >
          <h3 className="text-2xl font-bold text-brand-light">المستوى العام</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="تذكير قبل الاستحقاق (أيام)">
              <input
                type="number"
                min={0}
                max={60}
                value={generalForm.reminder_days_before}
                onChange={(event) =>
                  setGeneralForm((prev) => ({ ...prev, reminder_days_before: Number(event.target.value) }))
                }
                className="rounded-xl px-4 py-3"
              />
            </FormField>
            <FormField label="تذكير بعد الاستحقاق (أيام)">
              <input
                type="number"
                min={0}
                max={60}
                value={generalForm.reminder_days_after}
                onChange={(event) =>
                  setGeneralForm((prev) => ({ ...prev, reminder_days_after: Number(event.target.value) }))
                }
                className="rounded-xl px-4 py-3"
              />
            </FormField>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl border border-brand-secondary/30 bg-brand-blue/40 px-5 py-3 text-sm">
              <input
                type="checkbox"
                checked={generalForm.use_group_override}
                onChange={(event) =>
                  setGeneralForm((prev) => ({ ...prev, use_group_override: event.target.checked }))
                }
              />
              <span>تفعيل تخصيص المجموعات</span>
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-brand-secondary/30 bg-brand-blue/40 px-5 py-3 text-sm">
              <input
                type="checkbox"
                checked={generalForm.use_student_override}
                onChange={(event) =>
                  setGeneralForm((prev) => ({ ...prev, use_student_override: event.target.checked }))
                }
              />
              <span>تفعيل تخصيص الطلاب</span>
            </label>
          </div>
          <ActionButton type="submit" icon={savingGeneral ? CheckCircle2 : Save} disabled={savingGeneral} className="w-full justify-center">
            {savingGeneral ? 'جارٍ الحفظ...' : 'حفظ الإعدادات العامة'}
          </ActionButton>
        </form>

        <div className="space-y-6 rounded-3xl border border-brand-secondary/20 bg-brand-navy/60 p-8 shadow-soft">
          <h3 className="text-2xl font-bold text-brand-light">تخصيص المجموعات</h3>
          <p className="text-sm text-brand-secondary">
            حدّد القيم الخاصة بكل مجموعة عند تفعيل التخصيص من الإعدادات العامة.
          </p>
          <div className="space-y-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className="grid gap-3 rounded-2xl border border-brand-secondary/20 bg-brand-blue/40 p-4 md:grid-cols-[1fr_auto] md:items-center"
              >
                <div>
                  <p className="text-brand-light">{group.name}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="flex items-center gap-3 text-sm text-brand-secondary">
                      <span>قبل</span>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={groupForms[group.id]?.reminder_days_before ?? ''}
                        onChange={(event) => handleGroupChange(group.id, 'reminder_days_before', event.target.value)}
                        className="w-24 rounded-xl px-3 py-2"
                      />
                    </label>
                    <label className="flex items-center gap-3 text-sm text-brand-secondary">
                      <span>بعد</span>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={groupForms[group.id]?.reminder_days_after ?? ''}
                        onChange={(event) => handleGroupChange(group.id, 'reminder_days_after', event.target.value)}
                        className="w-24 rounded-xl px-3 py-2"
                      />
                    </label>
                  </div>
                </div>
                <ActionButton
                  icon={savingGroup === group.id ? CheckCircle2 : Save}
                  variant="outline"
                  onClick={() => handleGroupSave(group.id)}
                  disabled={savingGroup === group.id}
                >
                  {savingGroup === group.id ? 'تم الحفظ' : 'حفظ التخصيص'}
                </ActionButton>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <form
          onSubmit={handleStudentSave}
          className="space-y-6 rounded-3xl border border-brand-secondary/20 bg-brand-navy/60 p-8 shadow-soft"
        >
          <h3 className="text-2xl font-bold text-brand-light">تخصيص طالب محدد</h3>
          <FormField label="الطالب">
            <select
              value={studentForm.studentId}
              onChange={(event) => setStudentForm((prev) => ({ ...prev, studentId: event.target.value }))}
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
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="تذكير قبل (أيام)">
              <input
                type="number"
                min={0}
                max={60}
                value={studentForm.before}
                onChange={(event) => setStudentForm((prev) => ({ ...prev, before: event.target.value }))}
                className="rounded-xl px-4 py-3"
              />
            </FormField>
            <FormField label="تذكير بعد (أيام)">
              <input
                type="number"
                min={0}
                max={60}
                value={studentForm.after}
                onChange={(event) => setStudentForm((prev) => ({ ...prev, after: event.target.value }))}
                className="rounded-xl px-4 py-3"
              />
            </FormField>
          </div>
          <ActionButton
            type="submit"
            icon={savingStudent ? CheckCircle2 : Save}
            disabled={savingStudent}
            className="w-full justify-center"
          >
            {savingStudent ? 'جارٍ الحفظ...' : 'حفظ تخصيص الطالب'}
          </ActionButton>
        </form>

        <div className="space-y-6 rounded-3xl border border-brand-secondary/20 bg-brand-navy/60 p-8 shadow-soft">
          <h3 className="text-2xl font-bold text-brand-light">القيم الفعلية الحالية</h3>
          <p className="text-sm text-brand-secondary">
            يعتمد الترتيب على أولوية الطالب ثم المجموعة ثم الإعداد العام.
          </p>
          <DataTable columns={effectiveColumns} data={effectiveRows} />
        </div>
      </div>
    </div>
  );
}
