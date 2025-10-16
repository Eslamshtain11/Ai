import { supabase } from './supabaseClient.js';

export async function fetchExpenses(userId) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from('expenses')
    .select('id, user_id, description, amount, date, note, created_at')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) {
    console.error('تعذر تحميل المصروفات:', error);
    return [];
  }
  return data ?? [];
}

export async function createExpense(userId, payload) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('expenses')
    .insert({ ...payload, user_id: userId })
    .select('*')
    .single();
  if (error) {
    console.error('تعذر إضافة المصروف:', error);
    throw error;
  }
  return data;
}

export async function updateExpense(expenseId, payload) {
  const { data, error } = await supabase
    .from('expenses')
    .update(payload)
    .eq('id', expenseId)
    .select('*')
    .single();
  if (error) {
    console.error('تعذر تحديث المصروف:', error);
    throw error;
  }
  return data;
}

export async function deleteExpense(expenseId) {
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
  if (error) {
    console.error('تعذر حذف المصروف:', error);
    throw error;
  }
}
