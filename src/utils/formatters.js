import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

const currencyFormatter = new Intl.NumberFormat('ar-EG', {
  style: 'currency',
  currency: 'EGP',
  minimumFractionDigits: 2
});

export function formatCurrency(value) {
  const amount = Number(value ?? 0);
  return currencyFormatter.format(Number.isNaN(amount) ? 0 : amount);
}

export function formatDate(value) {
  if (!value) return 'بدون تاريخ';
  try {
    const date = typeof value === 'string' ? parseISO(value) : value;
    return format(date, 'dd MMMM yyyy', { locale: ar });
  } catch (error) {
    console.error('تعذر تنسيق التاريخ:', error);
    return value;
  }
}

export function getCurrentYearMonth() {
  return format(new Date(), 'yyyy-MM');
}
