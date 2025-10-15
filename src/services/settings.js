import {
  demoSettings,
  demoGroupSettings,
  demoStudentSettings
} from './demoData';

const settingsTable = 'settings';
const groupSettingsTable = 'group_settings';
const studentSettingsTable = 'student_settings';

export const fetchSettings = async (client, userId) => {
  if (client && userId) {
    const { data, error } = await client
      .from(settingsTable)
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (!error && data) {
      return data;
    }
    if (error) {
      console.error('تعذر تحميل إعدادات المستخدم من Supabase:', error);
    }
  }
  return { user_id: userId ?? 'demo-user', ...demoSettings };
};

export const saveSettings = async (client, payload) => {
  if (client && payload?.user_id) {
    const { data, error } = await client
      .from(settingsTable)
      .upsert({ ...payload, updated_at: new Date().toISOString() })
      .select()
      .maybeSingle();
    if (!error && data) {
      return data;
    }
    console.error('تعذر حفظ إعدادات المستخدم في Supabase:', error);
  }
  return payload;
};

export const fetchGroupOverrides = async (client) => {
  if (client) {
    const { data, error } = await client.from(groupSettingsTable).select('*');
    if (!error && Array.isArray(data)) {
      return data;
    }
    console.error('تعذر تحميل إعدادات المجموعات من Supabase:', error);
  }
  return demoGroupSettings;
};

export const saveGroupOverride = async (client, payload) => {
  if (client) {
    const { data, error } = await client
      .from(groupSettingsTable)
      .upsert({ ...payload, updated_at: new Date().toISOString() })
      .select()
      .maybeSingle();
    if (!error && data) {
      return data;
    }
    console.error('تعذر حفظ إعدادات المجموعة في Supabase:', error);
  }
  return payload;
};

export const fetchStudentOverrides = async (client) => {
  if (client) {
    const { data, error } = await client.from(studentSettingsTable).select('*');
    if (!error && Array.isArray(data)) {
      return data;
    }
    console.error('تعذر تحميل إعدادات الطلاب من Supabase:', error);
  }
  return demoStudentSettings;
};

export const saveStudentOverride = async (client, payload) => {
  if (client) {
    const { data, error } = await client
      .from(studentSettingsTable)
      .upsert({ ...payload, updated_at: new Date().toISOString() })
      .select()
      .maybeSingle();
    if (!error && data) {
      return data;
    }
    console.error('تعذر حفظ إعدادات الطالب في Supabase:', error);
  }
  return payload;
};

export const computeEffectiveReminderDays = (
  studentId,
  groupId,
  settings,
  groupOverrides,
  studentOverrides
) => {
  const effective = {
    before: settings?.reminder_days_before ?? 0,
    after: settings?.reminder_days_after ?? 0
  };

  if (settings?.use_group_override && groupId) {
    const groupSetting = groupOverrides?.find((item) => item.group_id === groupId);
    if (groupSetting) {
      effective.before = groupSetting.reminder_days_before ?? effective.before;
      effective.after = groupSetting.reminder_days_after ?? effective.after;
    }
  }

  if (settings?.use_student_override && studentId) {
    const studentSetting = studentOverrides?.find((item) => item.student_id === studentId);
    if (studentSetting) {
      effective.before = studentSetting.reminder_days_before ?? effective.before;
      effective.after = studentSetting.reminder_days_after ?? effective.after;
    }
  }

  return effective;
};
