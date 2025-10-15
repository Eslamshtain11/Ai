import GuestCodeCard from '../components/GuestCodeCard';
import SectionHeader from '../components/SectionHeader';

export default function GuestCodes() {
  return (
    <div className="space-y-10">
      <SectionHeader
        title="أكواد الضيوف"
        subtitle="قم بإنشاء أكواد وصول مؤقتة لمشاركة الدفعات"
      />
      <GuestCodeCard />
    </div>
  );
}
