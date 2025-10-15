import { demoExpenses } from './demoData';

const generateLocalId = () => `local-expense-${Math.random().toString(36).slice(2, 11)}`;
const table = 'expenses';

export const listExpenses = async (client) => {
  if (client) {
    const { data, error } = await client.from(table).select('*').order('date', { ascending: false });
    if (!error && Array.isArray(data)) {
      return data;
    }
    console.error('تعذر تحميل المصروفات من Supabase:', error);
  }
  return demoExpenses;
};

export const createExpense = async (client, payload) => {
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
    console.error('تعذر إنشاء المصروف في Supabase:', error);
  }

  return record;
};

export const updateExpense = async (client, id, payload) => {
  if (client) {
    const { data, error } = await client.from(table).update(payload).eq('id', id).select().single();
    if (!error && data) {
      return data;
    }
    console.error('تعذر تحديث المصروف في Supabase:', error);
  }
  return { id, ...payload };
};

export const deleteExpense = async (client, id) => {
  if (client) {
    const { error } = await client.from(table).delete().eq('id', id);
    if (!error) return true;
    console.error('تعذر حذف المصروف من Supabase:', error);
  }
  return true;
};
