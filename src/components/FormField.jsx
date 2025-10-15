export default function FormField({ label, children, description, error }) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="text-brand-secondary">{label}</span>
      {children}
      {description ? <span className="text-xs text-brand-secondary">{description}</span> : null}
      {error ? <span className="text-xs text-red-400">{error}</span> : null}
    </label>
  );
}
