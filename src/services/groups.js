import { demoGroups } from './demoData';

const generateLocalId = () => `local-group-${Math.random().toString(36).slice(2, 11)}`;
const table = 'groups';

export const listGroups = async (client) => {
  if (client) {
    const { data, error } = await client.from(table).select('*').order('created_at', { ascending: true });
    if (!error && Array.isArray(data)) {
      return data;
    }
    console.error('تعذر تحميل المجموعات من Supabase:', error);
  }
  return demoGroups;
};

export const createGroup = async (client, payload) => {
  const record = {
    id: generateLocalId(),
    name: payload.name,
    created_at: new Date().toISOString()
  };

  if (client) {
    const { data, error } = await client.from(table).insert({ name: payload.name }).select().single();
    if (!error && data) {
      return data;
    }
    console.error('تعذر إنشاء المجموعة في Supabase:', error);
  }

  return record;
};

export const deleteGroup = async (client, id) => {
  if (client) {
    const { error } = await client.from(table).delete().eq('id', id);
    if (!error) return true;
    console.error('تعذر حذف المجموعة من Supabase:', error);
  }
  return true;
};
