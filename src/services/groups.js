import { supabase } from './supabaseClient.js';

export async function fetchGroups(userId) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from('groups')
    .select('id, name, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('تعذر تحميل المجموعات:', error);
    return [];
  }
  return data ?? [];
}

export async function createGroup(userId, name) {
  if (!supabase || !userId || !name) return null;
  const { data, error } = await supabase
    .from('groups')
    .insert({ user_id: userId, name })
    .select('id, name')
    .single();
  if (error) {
    console.error('تعذر إنشاء المجموعة:', error);
    throw error;
  }
  return data;
}
