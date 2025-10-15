import clsx from 'clsx';

const variants = {
  warning: 'border-amber-500/40 bg-amber-500/10 text-brand-gold',
  danger: 'border-red-500/40 bg-red-500/10 text-red-400',
  success: 'border-green-700/40 bg-green-700/10 text-green-400'
};

export default function StatusCard({ title, value, description, variant = 'warning' }) {
  return (
    <div className={clsx('rounded-xl border p-6 shadow-soft', variants[variant])}>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-2 text-2xl font-black">{value}</p>
      {description ? <p className="mt-2 text-sm opacity-80">{description}</p> : null}
    </div>
  );
}
