import clsx from 'clsx';

const variants = {
  primary: 'bg-brand-gold text-brand-blue hover:bg-brand-gold/90',
  outline: 'border border-brand-gold text-brand-gold hover:bg-brand-gold/10',
  danger: 'bg-red-500/20 text-red-400 hover:bg-red-500/30',
  success: 'bg-green-700/20 text-green-400 hover:bg-green-700/30',
  subtle: 'bg-brand-navy text-brand-secondary hover:text-brand-light'
};

export default function ActionButton({ icon: Icon, children, variant = 'primary', className, disabled, type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={clsx(
        'flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200',
        variants[variant],
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      <span>{children}</span>
    </button>
  );
}
