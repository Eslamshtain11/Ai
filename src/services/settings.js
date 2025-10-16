import { supabase } from './supabaseClient.js';

export async function fetchSettings(userId) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('settings')
    .select('user_id, reminder_days_before, reminder_days_after, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('تعذر تحميل الإعدادات:', error);
    return null;
  }
  return data ?? null;
}

export async function upsertSettings(userId, payload) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('settings')
    .upsert({ user_id: userId, ...payload, updated_at: new Date().toISOString() })
    .select('*')
    .single();
  if (error) {
    console.error('تعذر حفظ الإعدادات:', error);
    throw error;
  }
  return data;
}
