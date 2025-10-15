export default function SectionHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h2 className="text-3xl font-black text-brand-light">{title}</h2>
        {subtitle ? <p className="mt-2 text-brand-secondary">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
