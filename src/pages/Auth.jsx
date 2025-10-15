import { useEffect, useMemo, useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ActionButton from '../components/ActionButton';
import FormField from '../components/FormField';
import toast from 'react-hot-toast';
import { useAppData } from '../context/AppDataContext';
import { supabase } from '../services/supabaseClient';
import { isValidEgyptPhone } from '../utils/validation';

const tabs = [
  { key: 'login', label: 'تسجيل الدخول', icon: LogIn },
  { key: 'signup', label: 'إنشاء حساب', icon: UserPlus }
];

const initialForm = {
  name: '',
  phone: '',
  password: ''
};

export default function Auth() {
  const navigate = useNavigate();
  const { session } = useAppData();
  const [activeTab, setActiveTab] = useState('login');
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const phoneToEmail = (phone) => `${phone}@app.local`.toLowerCase();

  const mapAuthError = (error) => {
    if (!error) {
      return 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.';
    }
    const message = error.message ?? '';
    const code = error.code ?? '';
    if (code === 'user_already_exists' || message.includes('already registered') || message.includes('duplicate key value')) {
      return 'رقم الجوال مسجل مسبقًا، يرجى تسجيل الدخول.';
    }
    if (code === 'invalid_credentials' || message.includes('Invalid login credentials')) {
      return 'بيانات الدخول غير صحيحة. تأكد من رقم الجوال وكلمة المرور.';
    }
    if (message.includes('permission denied')) {
      return 'ليست لديك صلاحية للوصول في الوقت الحالي. حاول مرة أخرى لاحقًا.';
    }
    return 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.';
  };

  const doSignUp = async (name, phone, password) => {
    const email = phoneToEmail(phone);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone }
      }
    });
    if (error) {
      throw error;
    }
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw sessionError;
    }
    const currentSession = sessionData?.session;
    if (currentSession?.user) {
      const { error: rpcError } = await supabase.rpc('ensure_user_row', {
        p_name: name,
        p_phone: phone
      });
      if (rpcError) {
        throw rpcError;
      }
    }
    return true;
  };

  const doSignIn = async (phone, password) => {
    const email = phoneToEmail(phone);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }
    await supabase
      .rpc('ensure_user_row', { p_name: null, p_phone: phone })
      .catch((rpcError) => {
        console.warn('تعذر تحديث بيانات المستخدم بعد تسجيل الدخول:', rpcError);
      });
    return true;
  };

  useEffect(() => {
    if (session?.user) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, session?.user]);

  const activeIcon = useMemo(() => tabs.find((tab) => tab.key === activeTab)?.icon, [activeTab]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    const nextErrors = {};
    if (activeTab === 'signup') {
      if (!form.name.trim()) {
        nextErrors.name = 'الاسم مطلوب.';
      } else if (form.name.trim().length < 3) {
        nextErrors.name = 'الاسم يجب أن يحتوي على 3 أحرف على الأقل.';
      }
    }
    if (!isValidEgyptPhone(form.phone)) {
      nextErrors.phone = 'أدخل رقم جوال مصري صحيح مكوَّن من 11 رقمًا.';
    }
    if (!form.password || form.password.length < 6) {
      nextErrors.password = 'كلمة المرور يجب ألا تقل عن 6 أحرف/أرقام.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setSubmitting(false);
      return;
    }

    if (!supabase) {
      toast.error('التهيئة غير مكتملة، يرجى إعداد مفاتيح Supabase أولًا.');
      setSubmitting(false);
      return;
    }

    setErrors({});
    try {
      if (activeTab === 'login') {
        await doSignIn(form.phone, form.password);
        toast.success('تم تسجيل الدخول بنجاح');
      } else {
        await doSignUp(form.name.trim(), form.phone, form.password);
        toast.success('تم إنشاء الحساب بنجاح');
      }
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('خطأ أثناء معالجة المصادقة:', error);
      toast.error(mapAuthError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-navy/80 px-4 py-16">
      <div className="w-full max-w-2xl rounded-3xl border border-brand-secondary/20 bg-brand-blue/70 p-10 shadow-soft">
        <div className="text-center">
          <h1 className="text-4xl font-black text-brand-gold">المحاسب الشخصي</h1>
          <p className="mt-3 text-brand-secondary">
            سجّل دخولك لإدارة الدخل والمصروفات وكل ما يخص طلابك بسهولة
          </p>
        </div>

        <div className="mt-10 flex justify-center gap-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setForm(initialForm);
                  setErrors({});
                }}
                className={`flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-brand-gold text-brand-blue shadow-lg'
                    : 'bg-brand-navy/60 text-brand-secondary hover:text-brand-light'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          {activeTab === 'signup' ? (
            <FormField label="الاسم الكامل" error={errors.name}>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="rounded-xl px-4 py-3 text-brand-light"
                placeholder="أدخل اسمك الكامل"
                required
              />
            </FormField>
          ) : null}

          <FormField label="رقم الجوال" error={errors.phone}>
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => {
                const value = event.target.value.replace(/[^0-9]/g, '');
                setForm((prev) => ({ ...prev, phone: value }));
                if (errors.phone) {
                  setErrors((prev) => ({ ...prev, phone: undefined }));
                }
              }}
              className="rounded-xl px-4 py-3 text-brand-light"
              placeholder="010XXXXXXXX"
              inputMode="numeric"
              maxLength={11}
              pattern="01[0-25][0-9]{8}"
              dir="ltr"
              required
            />
          </FormField>

          <FormField label="كلمة المرور" error={errors.password}>
            <input
              type="password"
              value={form.password}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, password: event.target.value }));
                if (errors.password) {
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              className="rounded-xl px-4 py-3 text-brand-light"
              placeholder="******"
              minLength={6}
              required
            />
          </FormField>

          <ActionButton
            type="submit"
            className="w-full justify-center"
            icon={activeIcon}
            disabled={submitting}
          >
            {submitting ? 'جارٍ المعالجة...' : tabs.find((tab) => tab.key === activeTab)?.label}
          </ActionButton>
        </form>
      </div>
    </div>
  );
}
