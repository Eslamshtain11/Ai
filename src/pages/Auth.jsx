import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient.js';
import toast from 'react-hot-toast';

const initialForm = {
  email: '',
  password: '',
  fullName: '',
  phone: ''
};

export default function Auth() {
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const ensureProfile = async (fullName, phone) => {
    try {
      await supabase.rpc('ensure_profile', {
        p_name: fullName || null,
        p_phone: phone || null
      });
    } catch (error) {
      console.error('تعذر تحديث الملف الشخصي:', error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!supabase) {
      toast.error('برجاء تهيئة مفاتيح Supabase أولاً.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              full_name: form.fullName,
              phone: form.phone
            }
          }
        });
        if (error) throw error;
        await ensureProfile(form.fullName, form.phone);
        if (data.user) {
          toast.success('تم التسجيل بنجاح!');
          navigate('/dashboard');
        } else {
          toast('تم إرسال رابط التفعيل إلى بريدك الإلكتروني.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password
        });
        if (error) throw error;
        await ensureProfile(form.fullName, form.phone);
        toast.success('مرحبًا بعودتك!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('فشل تسجيل الدخول/التسجيل:', error);
      toast.error(error?.message ?? 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-blue px-4">
      <div className="w-full max-w-lg rounded-3xl border border-brand-secondary/30 bg-brand-navy/80 p-8 shadow-soft">
        <div className="mb-6 flex gap-3 rounded-full border border-brand-secondary/40 bg-brand-blue/60 p-1 text-sm font-bold">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 rounded-full px-4 py-2 transition ${
              mode === 'signin' ? 'bg-brand-gold text-brand-blue' : 'text-brand-light'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 rounded-full px-4 py-2 transition ${
              mode === 'signup' ? 'bg-brand-gold text-brand-blue' : 'text-brand-light'
            }`}
          >
            إنشاء حساب
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <label className="flex flex-col gap-2 text-sm font-bold text-brand-light">
                الاسم الكامل
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                  placeholder="محمد أحمد"
                  className="rounded-xl border border-brand-secondary/40 bg-brand-blue/70 px-4 py-3 text-right text-brand-light focus:border-brand-gold focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-bold text-brand-light">
                رقم الهاتف
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="01000000000"
                  className="rounded-xl border border-brand-secondary/40 bg-brand-blue/70 px-4 py-3 text-right text-brand-light focus:border-brand-gold focus:outline-none"
                />
              </label>
            </>
          )}

          <label className="flex flex-col gap-2 text-sm font-bold text-brand-light">
            البريد الإلكتروني
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              type="email"
              required
              placeholder="teacher@example.com"
              className="rounded-xl border border-brand-secondary/40 bg-brand-blue/70 px-4 py-3 text-right text-brand-light focus:border-brand-gold focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-bold text-brand-light">
            كلمة المرور
            <input
              name="password"
              value={form.password}
              onChange={handleChange}
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              className="rounded-xl border border-brand-secondary/40 bg-brand-blue/70 px-4 py-3 text-right text-brand-light focus:border-brand-gold focus:outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-brand-gold px-6 py-3 text-sm font-black text-brand-blue transition hover:bg-brand-gold/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'لحظات...' : mode === 'signup' ? 'تسجيل حساب جديد' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
}
