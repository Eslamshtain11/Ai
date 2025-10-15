import { demoUser } from './demoData';

const table = 'users';

export const findUserByPhone = async (client, phone, options = {}) => {
  const { fallbackToDemo = true } = options;
  if (client && phone) {
    const { data, error } = await client.from(table).select('*').eq('phone', phone).maybeSingle();
    if (error) {
      throw new Error(error.message ?? 'تعذر البحث عن المستخدم');
    }
    if (data) {
      return data;
    }
  }
  if (fallbackToDemo && (!phone || phone === demoUser.phone)) {
    return demoUser;
  }
  return null;
};

export const createUser = async (client, payload) => {
  if (client) {
    const { data, error } = await client.from(table).insert(payload).select().single();
    if (error || !data) {
      throw new Error(error?.message ?? 'تعذر إنشاء المستخدم');
    }
    return data;
  }
  return { id: `local-user-${Date.now()}`, ...payload };
};
