import { Bell, FileSpreadsheet, PlusCircle } from 'lucide-react';
import StatCard from '../components/StatCard';
import StatusCard from '../components/StatusCard';
import SectionHeader from '../components/SectionHeader';
import ActionButton from '../components/ActionButton';
import { useAppData } from '../context/AppDataContext';

export default function Dashboard() {
  const { netIncome, totalIncome, totalExpenses, payingStudents, reminders } = useAppData();

  return (
    <div className="space-y-10">
      <SectionHeader
        title="لوحة التحكم الرئيسية"
        subtitle="نظرة شاملة على الأداء المالي للمعلم"
        actions={
          <>
            <ActionButton icon={PlusCircle}>إضافة دفعة جديدة</ActionButton>
            <ActionButton variant="outline" icon={FileSpreadsheet}>
              عرض كشف الحساب
            </ActionButton>
          </>
        }
      />

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="صافي الدخل" value={`${netIncome.toLocaleString()} ر.س`} />
        <StatCard title="إجمالي الدخل" value={`${totalIncome.toLocaleString()} ر.س`} accent="green-700" />
        <StatCard title="إجمالي المصروفات" value={`${totalExpenses.toLocaleString()} ر.س`} accent="red-400" />
        <StatCard title="عدد الطلاب الدافعين" value={payingStudents} accent="brand-light" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <StatusCard
          title="تذكيرات الدفع"
          value={`قبل ${reminders} أيام`}
          description="سيتم إرسال إشعارات تلقائية للطلاب المتأخرين عبر Supabase Functions."
          variant="warning"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <StatusCard
            title="المدفوعات المتأخرة"
            value="3 طلاب"
            description="قم بالتواصل مع أولياء الأمور لتأكيد التحويل."
            variant="danger"
          />
          <StatusCard
            title="مدفوعات قريبة"
            value="5 طلاب"
            description="اقترب موعد الاستحقاق، أرسل تذكيرًا سريعًا."
            variant="warning"
          />
        </div>
      </div>

      <div className="rounded-3xl border border-brand-secondary/10 bg-brand-navy/70 p-8 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-2xl font-bold text-brand-light">خطط للتذكير بالمدفوعات</h3>
            <p className="text-brand-secondary">
              فعّل رسائل SMS التلقائية لطلابك لتحسين الالتزام.
            </p>
          </div>
          <ActionButton variant="subtle" icon={Bell}>
            إدارة التذكيرات
          </ActionButton>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((stage) => (
            <div
              key={stage}
              className="rounded-2xl border border-brand-secondary/20 bg-brand-blue/40 p-6 text-sm text-brand-secondary"
            >
              <p className="text-brand-gold">مرحلة {stage}</p>
              <p className="mt-3 leading-relaxed">
                رسالة مخصصة للطلاب {'{'}{stage === 1 ? 'قبل الاستحقاق' : stage === 2 ? 'في يوم الاستحقاق' : 'بعد الاستحقاق'}{'}'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
