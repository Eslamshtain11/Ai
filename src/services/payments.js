import { demoPayments } from './demoData';

const generateLocalId = () => `local-payment-${Math.random().toString(36).slice(2, 11)}`;
const table = 'payments';

export const listPayments = async (client, userId) => {
  if (!client || !userId) {
    return demoPayments;
  }
  const { data, error } = await client
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) {
    throw new Error(error.message ?? 'تعذر تحميل الدفعات');
  }
  return data ?? [];
};

export const createPayment = async (client, payload) => {
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
    throw new Error('معرّف المستخدم مطلوب لحفظ الدفعة.');
  }

  const { data, error } = await client.from(table).insert(payload).select().single();
  if (error || !data) {
    throw new Error(error?.message ?? 'تعذر إنشاء الدفعة');
  }
  return data;
};

export const updatePayment = async (client, id, payload, userId) => {
  if (!client) {
    return { id, ...payload };
  }
  const query = client.from(table).update(payload).eq('id', id);
  if (userId) {
    query.eq('user_id', userId);
  }
  const { data, error } = await query.select().single();
  if (error || !data) {
    throw new Error(error?.message ?? 'تعذر تحديث الدفعة');
  }
  return data;
};

export const deletePayment = async (client, id, userId) => {
  if (!client) {
    return true;
  }
  const query = client.from(table).delete().eq('id', id);
  if (userId) {
    query.eq('user_id', userId);
  }
  const { error } = await query;
  if (error) {
    throw new Error(error.message ?? 'تعذر حذف الدفعة');
  }
  return true;
};
