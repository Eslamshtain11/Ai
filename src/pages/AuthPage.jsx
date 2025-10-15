import { useState } from 'react';
import { LogIn, UserPlus, DoorOpen } from 'lucide-react';
import ActionButton from '../components/ActionButton';
import FormField from '../components/FormField';
import { useAppData } from '../context/AppDataContext';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

const authTabs = [
  { key: 'login', label: 'تسجيل الدخول', icon: LogIn },
  { key: 'signup', label: 'إنشاء حساب', icon: UserPlus },
  { key: 'guest', label: 'دخول الزائر', icon: DoorOpen }
];

const initialForm = {
  name: '',
  phone: '',
  password: '',
  guestCode: ''
};

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('login');
  const [form, setForm] = useState(initialForm);
  const { signIn, signUp, setSession, guestCode } = useAppData();

  const handleSubmit = (event) => {
    event.preventDefault();

    if (activeTab === 'login') {
      signIn({ phone: form.phone, password: form.password });
    } else if (activeTab === 'signup') {
      signUp({ name: form.name, phone: form.phone, password: form.password });
    } else {
      if (form.guestCode === guestCode.code) {
        setSession({ user: { id: 'guest', name: 'وضع الزائر', phone: '---' }, guest: true });
        toast.success('تم تسجيل دخول الزائر');
      } else {
        toast.error('كود الزائر غير صحيح');
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-navy/80 px-4 py-16">
      <Toaster position="top-center" toastOptions={{ duration: 2500 }} />
      <div className="w-full max-w-2xl rounded-3xl border border-brand-secondary/20 bg-brand-blue/60 p-10 shadow-soft">
        <div className="text-center">
          <h1 className="text-4xl font-black text-brand-gold">المحاسب الشخصي</h1>
          <p className="mt-3 text-brand-secondary">
            نظام متكامل لإدارة دخل ومصروفات المعلم الخصوصي
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {authTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-brand-gold text-brand-blue shadow-lg'
                    : 'bg-brand-navy text-brand-secondary hover:text-brand-light'
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
              />
            </FormField>
          ) : null}

          {activeTab !== 'guest' ? (
            <>
              <FormField label="رقم الجوال">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  className="rounded-xl px-4 py-3 text-brand-light"
                  placeholder="05XXXXXXXX"
                />
              </FormField>
              <FormField label="كلمة المرور">
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  className="rounded-xl px-4 py-3 text-brand-light"
                  placeholder="******"
                />
              </FormField>
            </>
          ) : (
            <FormField label="كود الدخول">
              <input
                type="text"
                value={form.guestCode}
                onChange={(event) => setForm((prev) => ({ ...prev, guestCode: event.target.value }))}
                className="rounded-xl px-4 py-3 text-brand-light tracking-widest"
                placeholder="G-XXXXXX"
              />
            </FormField>
          )}

          <ActionButton type="submit" className="w-full justify-center" icon={authTabs.find((tab) => tab.key === activeTab)?.icon}>
            {authTabs.find((tab) => tab.key === activeTab)?.label}
          </ActionButton>
        </form>
      </div>
    </div>
  );
}
