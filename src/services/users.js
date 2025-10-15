import { demoUser } from './demoData';

const table = 'users';

export const findUserByPhone = async (client, phone) => {
  if (client) {
    const { data, error } = await client.from(table).select('*').eq('phone', phone).maybeSingle();
    if (!error && data) {
      return data;
    }
    if (error) {
      console.error('تعذر العثور على المستخدم في Supabase:', error);
    }
  }
  if (!phone || phone === demoUser.phone) {
    return demoUser;
  }
  return null;
};

export const createUser = async (client, payload) => {
  if (client) {
    const { data, error } = await client.from(table).insert(payload).select().single();
    if (!error && data) {
      return data;
    }
    console.error('تعذر إنشاء المستخدم في Supabase:', error);
  }
  return { id: `local-user-${Date.now()}`, ...payload };
};
