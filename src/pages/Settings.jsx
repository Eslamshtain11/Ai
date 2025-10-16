import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabaseClient.js';
import { fetchSettings, upsertSettings } from '../services/settings.js';

const defaultSettings = {
  reminder_days_before: 3,
  reminder_days_after: 0
};

export default function Settings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) return;
        const fetched = await fetchSettings(userId);
        if (fetched) {
          setSettings({
            reminder_days_before: fetched.reminder_days_before ?? defaultSettings.reminder_days_before,
            reminder_days_after: fetched.reminder_days_after ?? defaultSettings.reminder_days_after
          });
        }
      } catch (error) {
        console.error('تعذر تحميل الإعدادات:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setSettings((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!supabase) {
      toast.error('تأكد من إعداد Supabase.');
      return;
    }
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;
      if (settings.reminder_days_before < 0 || settings.reminder_days_before > 60) {
        toast.error('قيمة التذكير قبل الموعد يجب أن تكون بين 0 و 60 يوماً.');
        return;
      }
      if (settings.reminder_days_after < 0 || settings.reminder_days_after > 60) {
        toast.error('قيمة التذكير بعد الموعد يجب أن تكون بين 0 و 60 يوماً.');
        return;
      }
      const saved = await upsertSettings(userId, settings);
      setSettings({
        reminder_days_before: saved.reminder_days_before,
        reminder_days_after: saved.reminder_days_after
      });
      toast.success('تم حفظ الإعدادات بنجاح.');
    } catch (error) {
      console.error('تعذر حفظ الإعدادات:', error);
      toast.error('حدث خطأ أثناء حفظ الإعدادات.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-brand-secondary/20 bg-brand-navy/60 p-6 shadow-soft">
        <h2 className="text-lg font-bold text-brand-gold">تذكيرات الأقساط</h2>
        <p className="text-sm text-brand-secondary">
          قم بتحديد عدد الأيام قبل وبعد موعد الدفع لإرسال التذكيرات للطلاب وأولياء الأمور.
        </p>
        {loading ? (
          <div className="py-12 text-center text-sm text-brand-secondary">جارٍ تحميل الإعدادات...</div>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="flex flex-col gap-2 text-sm font-bold text-brand-light">
                عدد الأيام قبل موعد الدفع
                <input
                  type="number"
                  min="0"
                  max="60"
                  name="reminder_days_before"
                  value={settings.reminder_days_before}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-brand-secondary/30 bg-brand-blue/70 px-4 py-3 text-right text-brand-light focus:border-brand-gold focus:outline-none"
                />
              </label>
              <p className="mt-1 text-xs text-brand-secondary">
                سيتم إرسال التذكير بهذا العدد من الأيام قبل موعد الدفعة الشهرية.
              </p>
            </div>
            <div>
              <label className="flex flex-col gap-2 text-sm font-bold text-brand-light">
                عدد الأيام بعد موعد الدفع
                <input
                  type="number"
                  min="0"
                  max="60"
                  name="reminder_days_after"
                  value={settings.reminder_days_after}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-brand-secondary/30 bg-brand-blue/70 px-4 py-3 text-right text-brand-light focus:border-brand-gold focus:outline-none"
                />
              </label>
              <p className="mt-1 text-xs text-brand-secondary">
                في حال التأخر، سيتم إرسال تذكير بهذا العدد من الأيام بعد موعد الدفع.
              </p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-brand-gold px-6 py-3 text-sm font-black text-brand-blue transition hover:bg-brand-gold/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
