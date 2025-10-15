export const formatCurrencyEGP = (value) =>
  new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0
  }).format(Number(value ?? 0));

export const formatMonthKey = (monthKey) => {
  if (!monthKey) return '';
  const [year, month] = monthKey.split('-').map((part) => Number(part));
  const safeDate = new Date(year, (month ?? 1) - 1, 1);
  return safeDate;
};
