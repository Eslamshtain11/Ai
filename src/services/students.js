import { demoStudents } from './demoData';

const generateLocalId = () => `local-student-${Math.random().toString(36).slice(2, 11)}`;

const table = 'students';

export const listStudents = async (client, userId) => {
  if (!client || !userId) {
    return demoStudents;
  }
  const { data, error } = await client
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    throw new Error(error.message ?? 'تعذر تحميل الطلاب');
  }
  return data ?? [];
};

export const createStudent = async (client, payload) => {
  const record = {
    id: generateLocalId(),
    ...payload,
    user_id: payload.user_id ?? 'demo-user',
    created_at: new Date().toISOString()
  };

  if (!client) {
    return record;
  }

  if (!payload.user_id) {
    throw new Error('معرّف المستخدم مطلوب لتسجيل الطالب.');
  }

  const { data, error } = await client.from(table).insert(payload).select().single();
  if (error || !data) {
    throw new Error(error?.message ?? 'تعذر حفظ الطالب');
  }
  return data;
};

export const deleteStudent = async (client, id, userId) => {
  if (!client) {
    return true;
  }
  const query = client.from(table).delete().eq('id', id);
  if (userId) {
    query.eq('user_id', userId);
  }
  const { error } = await query;
  if (error) {
    throw new Error(error.message ?? 'تعذر حذف الطالب');
  }
  return true;
};

export const updateStudent = async (client, id, payload, userId) => {
  if (!client) {
    return { id, ...payload };
  }
  const query = client.from(table).update(payload).eq('id', id);
  if (userId) {
    query.eq('user_id', userId);
  }
  const { data, error } = await query.select().single();
  if (error || !data) {
    throw new Error(error?.message ?? 'تعذر تحديث الطالب');
  }
  return data;
};
