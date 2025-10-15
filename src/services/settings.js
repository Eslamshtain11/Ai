import {
  demoSettings,
  demoGroupSettings,
  demoStudentSettings
} from './demoData';

const settingsTable = 'settings';
const groupSettingsTable = 'group_settings';
const studentSettingsTable = 'student_settings';

export const fetchSettings = async (client, userId) => {
  if (!client || !userId) {
    return { user_id: userId ?? 'demo-user', ...demoSettings };
  }
  const { data, error } = await client
    .from(settingsTable)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message ?? 'تعذر تحميل إعدادات المستخدم');
  }
  if (data) {
    return data;
  }
  return { user_id: userId, ...demoSettings };
};

export const saveSettings = async (client, payload) => {
  if (!client || !payload?.user_id) {
    return payload;
  }
  const { data, error } = await client
    .from(settingsTable)
    .upsert({ ...payload, updated_at: new Date().toISOString() })
    .select()
    .maybeSingle();
  if (error || !data) {
    throw new Error(error?.message ?? 'تعذر حفظ إعدادات المستخدم');
  }
  return data;
};

export const fetchGroupOverrides = async (client, userId) => {
  if (!client || !userId) {
    return demoGroupSettings;
  }
  const { data, error } = await client.from(groupSettingsTable).select('*').eq('user_id', userId);
  if (error) {
    throw new Error(error.message ?? 'تعذر تحميل إعدادات المجموعات');
  }
  return data ?? [];
};

export const saveGroupOverride = async (client, payload) => {
  if (!client || !payload?.user_id) {
    return payload;
  }
  const { data, error } = await client
    .from(groupSettingsTable)
    .upsert({ ...payload, updated_at: new Date().toISOString() })
    .select()
    .maybeSingle();
  if (error || !data) {
    throw new Error(error?.message ?? 'تعذر حفظ إعدادات المجموعة');
  }
  return data;
};

export const fetchStudentOverrides = async (client, userId) => {
  if (!client || !userId) {
    return demoStudentSettings;
  }
  const { data, error } = await client.from(studentSettingsTable).select('*').eq('user_id', userId);
  if (error) {
    throw new Error(error.message ?? 'تعذر تحميل إعدادات الطلاب');
  }
  return data ?? [];
};

export const saveStudentOverride = async (client, payload) => {
  if (!client || !payload?.user_id) {
    return payload;
  }
  const { data, error } = await client
    .from(studentSettingsTable)
    .upsert({ ...payload, updated_at: new Date().toISOString() })
    .select()
    .maybeSingle();
  if (error || !data) {
    throw new Error(error?.message ?? 'تعذر حفظ إعدادات الطالب');
  }
  return data;
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
