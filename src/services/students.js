import { demoStudents } from './demoData';

const generateLocalId = () => `local-student-${Math.random().toString(36).slice(2, 11)}`;

const table = 'students';

export const listStudents = async (client) => {
  if (client) {
    const { data, error } = await client
      .from(table)
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && Array.isArray(data)) {
      return data;
    }
    console.error('فشل تحميل الطلاب من Supabase:', error);
  }
  return demoStudents;
};

export const createStudent = async (client, payload) => {
  const record = {
    id: generateLocalId(),
    ...payload,
    created_at: new Date().toISOString()
  };

  if (client) {
    const { data, error } = await client.from(table).insert(payload).select().single();
    if (!error && data) {
      return data;
    }
    console.error('تعذر حفظ الطالب في Supabase:', error);
  }

  return record;
};

export const deleteStudent = async (client, id) => {
  if (client) {
    const { error } = await client.from(table).delete().eq('id', id);
    if (!error) return true;
    console.error('تعذر حذف الطالب من Supabase:', error);
  }
  return true;
};

export const updateStudent = async (client, id, payload) => {
  if (client) {
    const { data, error } = await client.from(table).update(payload).eq('id', id).select().single();
    if (!error && data) {
      return data;
    }
    console.error('تعذر تحديث الطالب في Supabase:', error);
  }
  return { id, ...payload };
};
