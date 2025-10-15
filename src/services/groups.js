import { demoGroups } from './demoData';

const generateLocalId = () => `local-group-${Math.random().toString(36).slice(2, 11)}`;
const table = 'groups';

export const listGroups = async (client, userId) => {
  if (!client || !userId) {
    return demoGroups;
  }
  const { data, error } = await client
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) {
    throw new Error(error.message ?? 'تعذر تحميل المجموعات');
  }
  return data ?? [];
};

export const createGroup = async (client, payload) => {
  const record = {
    id: generateLocalId(),
    name: payload.name,
    user_id: payload.user_id ?? 'demo-user',
    created_at: new Date().toISOString()
  };

  if (!client) {
    return record;
  }

  if (!payload.user_id) {
    throw new Error('معرّف المستخدم مطلوب لحفظ المجموعة.');
  }

  const { data, error } = await client.from(table).insert(payload).select().single();
  if (error || !data) {
    throw new Error(error?.message ?? 'تعذر إنشاء المجموعة في Supabase');
  }
  return data;
};

export const deleteGroup = async (client, id, userId) => {
  if (!client) {
    return true;
  }
  const query = client.from(table).delete().eq('id', id);
  if (userId) {
    query.eq('user_id', userId);
  }
  const { error } = await query;
  if (error) {
    throw new Error(error.message ?? 'تعذر حذف المجموعة');
  }
  return true;
};
