import { Copy, RefreshCcw } from 'lucide-react';
import ActionButton from './ActionButton';
import { useAppData } from '../context/AppDataContext';

export default function GuestCodeCard() {
  const { guestCode, generateGuestCode } = useAppData();

  const copyCode = async () => {
    if (!guestCode?.code) return;
    await navigator.clipboard.writeText(guestCode.code);
  };

  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-dashed border-brand-gold bg-brand-navy/70 p-10 text-center shadow-soft">
      <h2 className="text-2xl font-bold text-brand-gold">وصول الزائر</h2>
      <p className="mt-2 text-brand-secondary">شارك هذا الكود مع ولي الأمر للاطلاع فقط.</p>
      <div className="mt-8 rounded-2xl border border-brand-gold/60 bg-brand-blue/40 p-6 text-4xl font-black tracking-widest text-brand-light">
        {guestCode?.code}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        <ActionButton variant="outline" icon={Copy} onClick={copyCode}>
          نسخ الكود
        </ActionButton>
        <ActionButton variant="primary" icon={RefreshCcw} onClick={generateGuestCode}>
          إنشاء كود جديد
        </ActionButton>
      </div>
    </div>
  );
}
