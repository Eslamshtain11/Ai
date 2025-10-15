import { forwardRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ar } from 'date-fns/locale';
import clsx from 'clsx';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('ar', ar);

const SmartDatePicker = forwardRef(({ className, ...props }, ref) => (
  <DatePicker
    ref={ref}
    locale="ar"
    isClearable
    calendarStartDay={6}
    showMonthDropdown
    showYearDropdown
    dropdownMode="select"
    isRTL
    dateFormat="dd/MM/yyyy"
    className={clsx(
      'w-full rounded-xl border border-brand-secondary/40 bg-brand-blue px-4 py-3 text-sm text-brand-light placeholder:text-brand-secondary focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold',
      className
    )}
    popperClassName="rtl-datepicker"
    {...props}
  />
));

SmartDatePicker.displayName = 'SmartDatePicker';

export default SmartDatePicker;
