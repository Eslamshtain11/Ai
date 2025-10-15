import { demoPayments } from './demoData';

const generateLocalId = () => `local-payment-${Math.random().toString(36).slice(2, 11)}`;
const table = 'payments';

export const listPayments = async (client) => {
  if (client) {
    const { data, error } = await client.from(table).select('*').order('date', { ascending: false });
    if (!error && Array.isArray(data)) {
      return data;
    }
    console.error('تعذر تحميل الدفعات من Supabase:', error);
  }
  return demoPayments;
};

export const createPayment = async (client, payload) => {
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
    console.error('تعذر إنشاء الدفعة في Supabase:', error);
  }

  return record;
};

export const updatePayment = async (client, id, payload) => {
  if (client) {
    const { data, error } = await client.from(table).update(payload).eq('id', id).select().single();
    if (!error && data) {
      return data;
    }
    console.error('تعذر تحديث الدفعة في Supabase:', error);
  }
  return { id, ...payload };
};

export const deletePayment = async (client, id) => {
  if (client) {
    const { error } = await client.from(table).delete().eq('id', id);
    if (!error) return true;
    console.error('تعذر حذف الدفعة من Supabase:', error);
  }
  return true;
};
