import { supabase } from './supabaseClient.js';

export async function fetchPayments(userId) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from('payments')
    .select('id, user_id, student_id, amount, date, note, created_at')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) {
    console.error('تعذر تحميل الدفعات:', error);
    return [];
  }
  return data ?? [];
}

export async function createPayment(userId, payload) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('payments')
    .insert({ ...payload, user_id: userId })
    .select('*')
    .single();
  if (error) {
    console.error('تعذر إضافة الدفعة:', error);
    throw error;
  }
  return data;
}

export async function updatePayment(paymentId, payload) {
  const { data, error } = await supabase
    .from('payments')
    .update(payload)
    .eq('id', paymentId)
    .select('*')
    .single();
  if (error) {
    console.error('تعذر تحديث الدفعة:', error);
    throw error;
  }
  return data;
}

export async function deletePayment(paymentId) {
  const { error } = await supabase.from('payments').delete().eq('id', paymentId);
  if (error) {
    console.error('تعذر حذف الدفعة:', error);
    throw error;
  }
}
