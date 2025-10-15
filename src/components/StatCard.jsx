import clsx from 'clsx';

const accentMap = {
  'brand-gold': 'text-brand-gold',
  'brand-light': 'text-brand-light',
  'red-400': 'text-red-400',
  'green-700': 'text-green-700',
  'purple-700': 'text-purple-700'
};

export default function StatCard({ title, value, subtitle, accent = 'brand-gold' }) {
  return (
    <div className="rounded-xl border border-brand-secondary/20 bg-brand-navy/80 p-6 shadow-soft">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-secondary">{title}</p>
      <p className={clsx('mt-4 text-4xl font-black', accentMap[accent] ?? accentMap['brand-gold'])}>{value}</p>
      {subtitle ? <p className="mt-2 text-sm text-brand-secondary">{subtitle}</p> : null}
    </div>
  );
}
