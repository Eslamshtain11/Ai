import { useEffect, useMemo, useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ActionButton from '../components/ActionButton';
import FormField from '../components/FormField';
import { useAppData } from '../context/AppDataContext';

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
  const { signIn, signUp, session } = useAppData();
  const [activeTab, setActiveTab] = useState('login');
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session?.user) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, session?.user]);

  const activeIcon = useMemo(() => tabs.find((tab) => tab.key === activeTab)?.icon, [activeTab]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (activeTab === 'login') {
        await signIn({ phone: form.phone, password: form.password });
      } else {
        await signUp({ name: form.name, phone: form.phone, password: form.password });
      }
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
            <FormField label="الاسم الكامل">
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

          <FormField label="رقم الجوال">
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              className="rounded-xl px-4 py-3 text-brand-light"
              placeholder="010XXXXXXXX"
              required
            />
          </FormField>

          <FormField label="كلمة المرور">
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              className="rounded-xl px-4 py-3 text-brand-light"
              placeholder="******"
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
