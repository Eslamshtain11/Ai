import { useMemo } from 'react';
import { getDaysInMonth, parseISO } from 'date-fns';

const MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر'
];

function parseValue(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  try {
    return parseISO(value);
  } catch (error) {
    return null;
  }
}

export default function RtlDatePicker({ label, value, onChange, required = false }) {
  const dateValue = parseValue(value) ?? new Date();
  const currentYear = new Date().getFullYear();

  const years = useMemo(() => Array.from({ length: 15 }, (_v, index) => currentYear - index), [currentYear]);
  const months = useMemo(() => MONTHS.map((month, index) => ({ label: month, value: index })), []);
  const daysInMonth = getDaysInMonth(new Date(dateValue.getFullYear(), dateValue.getMonth()));
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_v, index) => index + 1), [daysInMonth]);

  const handleChange = (part, nextValue) => {
    const year = part === 'year' ? Number(nextValue) : dateValue.getFullYear();
    const month = part === 'month' ? Number(nextValue) : dateValue.getMonth();
    const day = part === 'day' ? Number(nextValue) : dateValue.getDate();
    const safeDay = Math.min(day, getDaysInMonth(new Date(year, month)));
    const nextDate = new Date(year, month, safeDay);
    onChange?.(nextDate.toISOString().slice(0, 10));
  };

  return (
    <label className="flex flex-col gap-2 text-sm font-bold text-brand-light">
      {label}
      <div className="grid grid-cols-3 gap-2">
        <select
          required={required}
          value={dateValue.getFullYear()}
          onChange={(event) => handleChange('year', event.target.value)}
          className="rounded-xl border border-brand-secondary/30 bg-brand-navy px-3 py-2 text-right text-brand-light focus:border-brand-gold focus:outline-none"
        >
          {years.map((year) => (
            <option key={year} value={year} className="bg-brand-blue">
              {year}
            </option>
          ))}
        </select>
        <select
          required={required}
          value={dateValue.getMonth()}
          onChange={(event) => handleChange('month', event.target.value)}
          className="rounded-xl border border-brand-secondary/30 bg-brand-navy px-3 py-2 text-right text-brand-light focus:border-brand-gold focus:outline-none"
        >
          {months.map((month) => (
            <option key={month.value} value={month.value} className="bg-brand-blue">
              {month.label}
            </option>
          ))}
        </select>
        <select
          required={required}
          value={dateValue.getDate()}
          onChange={(event) => handleChange('day', event.target.value)}
          className="rounded-xl border border-brand-secondary/30 bg-brand-navy px-3 py-2 text-right text-brand-light focus:border-brand-gold focus:outline-none"
        >
          {days.map((day) => (
            <option key={day} value={day} className="bg-brand-blue">
              {day}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}
