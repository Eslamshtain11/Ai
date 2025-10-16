import { supabase } from './supabaseClient.js';

export async function fetchStudents(userId) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from('students')
    .select('id, user_id, group_id, name, phone, join_date, monthly_fee, note, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('تعذر تحميل الطلاب:', error);
    return [];
  }
  return data ?? [];
}

export async function createStudent(userId, payload) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('students')
    .insert({ ...payload, user_id: userId })
    .select('*')
    .single();
  if (error) {
    console.error('تعذر إضافة الطالب:', error);
    throw error;
  }
  return data;
}

export async function updateStudent(studentId, payload) {
  const { data, error } = await supabase
    .from('students')
    .update(payload)
    .eq('id', studentId)
    .select('*')
    .single();
  if (error) {
    console.error('تعذر تحديث بيانات الطالب:', error);
    throw error;
  }
  return data;
}

export async function deleteStudent(studentId) {
  const { error } = await supabase.from('students').delete().eq('id', studentId);
  if (error) {
    console.error('تعذر حذف الطالب:', error);
    throw error;
  }
}
