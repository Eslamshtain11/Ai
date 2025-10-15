export default function SummaryRow({ label, value }) {
  return (
    <tr className="text-lg font-bold">
      <td colSpan={3} className="px-6 py-4">
        {label}
      </td>
      <td className="px-6 py-4 text-brand-gold">{value}</td>
    </tr>
  );
}
