import { useState } from 'react';
import { Layers, Trash2 } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import ActionButton from '../components/ActionButton';
import FormField from '../components/FormField';
import { useAppData } from '../context/AppDataContext';

export default function Groups() {
  const { groups, addGroup, deleteGroup } = useAppData();
  const [groupName, setGroupName] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    await addGroup(groupName);
    setGroupName('');
  };

  return (
    <div className="space-y-10">
      <SectionHeader
        title="إدارة المجموعات"
        subtitle="أضف مجموعات جديدة ونظم الطلاب داخلها"
        actions={<ActionButton icon={Layers}>عدد المجموعات: {groups.length}</ActionButton>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-brand-secondary/20 bg-brand-navy/70 p-8">
          <h3 className="text-2xl font-bold text-brand-light">إضافة مجموعة جديدة</h3>
          <FormField label="اسم المجموعة">
            <input
              type="text"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              className="rounded-xl px-4 py-3"
              placeholder="مثال: فيزياء 12A"
            />
          </FormField>
          <ActionButton type="submit" className="w-full justify-center">
            حفظ المجموعة
          </ActionButton>
        </form>

        <div className="space-y-4 rounded-3xl border border-brand-secondary/20 bg-brand-navy/70 p-8">
          <h3 className="text-2xl font-bold text-brand-light">المجموعات الحالية</h3>
          <ul className="space-y-3">
            {groups.map((group) => (
              <li
                key={group.id}
                className="flex items-center justify-between rounded-2xl border border-brand-secondary/20 bg-brand-blue/40 px-4 py-3"
              >
                <span className="text-brand-light">{group.name}</span>
                <ActionButton
                  variant="danger"
                  icon={Trash2}
                  onClick={() => deleteGroup(group.id)}
                  disabled={groups.length <= 1}
                >
                  حذف
                </ActionButton>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
