export default function DataTable({ columns, data, footer, containerRef }) {
  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-2xl border border-brand-secondary/20 bg-brand-navy/80 shadow-soft"
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-brand-secondary/20 text-right">
          <thead className="bg-brand-blue/40 text-brand-secondary">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.accessor}
                  scope="col"
                  className="px-6 py-4 text-sm font-semibold tracking-wide"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-secondary/10 text-sm text-brand-light">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-brand-secondary">
                  لا توجد بيانات متاحة.
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="transition hover:bg-brand-blue/40">
                  {columns.map((column) => (
                    <td key={column.accessor} className="px-6 py-4 align-middle">
                      {typeof column.cell === 'function'
                        ? column.cell(row)
                        : row[column.accessor] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          {footer ? <tfoot className="bg-brand-blue/60 text-brand-gold">{footer}</tfoot> : null}
        </table>
      </div>
    </div>
  );
}
