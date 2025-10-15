import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { utils, writeFileXLSX } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatCurrencyEGP } from '../utils/formatters';

const buildMonthKey = (monthKey) => {
  if (!monthKey) {
    const now = new Date();
    return {
      key: format(now, 'yyyy_MM'),
      label: format(now, 'MMMM yyyy', { locale: ar })
    };
  }
  const safeDate = new Date(`${monthKey}-01T00:00:00`);
  return {
    key: format(safeDate, 'yyyy_MM'),
    label: format(safeDate, 'MMMM yyyy', { locale: ar })
  };
};

export const exportPaymentsXLSX = (rows, monthKey) => {
  const month = buildMonthKey(monthKey);
  const worksheetRows = rows.map((row) => ({
    الطالب: row.student,
    المجموعة: row.group,
    'المبلغ (ج.م)': row.amount,
    التاريخ: row.date,
    الملاحظات: row.note ?? ''
  }));

  const worksheet = utils.json_to_sheet(worksheetRows);

  worksheet['!cols'] = [
    { wch: 28 },
    { wch: 28 },
    { wch: 18 },
    { wch: 18 },
    { wch: 35 }
  ];

  worksheetRows.forEach((_, index) => {
    const cellAddress = utils.encode_cell({ c: 2, r: index + 1 });
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].t = 'n';
      worksheet[cellAddress].v = Number(rows[index].amountNumeric ?? rows[index].amount);
      worksheet[cellAddress].z = '#,##0" ج.م"';
    }
  });

  const total = rows.reduce((sum, row) => sum + Number(row.amountNumeric ?? row.amount ?? 0), 0);
  const totalRowIndex = worksheetRows.length + 1;
  const totalLabelCell = utils.encode_cell({ c: 0, r: totalRowIndex });
  worksheet[totalLabelCell] = {
    t: 's',
    v: 'الإجمالي الكلي',
    s: {
      font: { bold: true, color: { rgb: 'FF0A192F' } },
      fill: { patternType: 'solid', fgColor: { rgb: 'FFD4AF37' } }
    }
  };
  const totalAmountCell = utils.encode_cell({ c: 2, r: totalRowIndex });
  worksheet[totalAmountCell] = {
    t: 'n',
    v: total,
    z: '#,##0" ج.م"',
    s: {
      font: { bold: true, color: { rgb: 'FF0A192F' } },
      fill: { patternType: 'solid', fgColor: { rgb: 'FFD4AF37' } }
    }
  };

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, `كشف_الحساب_${month.key}`);
  writeFileXLSX(workbook, `كشف-الحساب-${month.key}.xlsx`, { compression: true });
};

export const exportPaymentsPDF = async (containerEl, monthKey) => {
  if (!containerEl) {
    throw new Error('لم يتم تمرير عنصر الجدول للطباعة.');
  }

  const month = buildMonthKey(monthKey);
  const canvas = await html2canvas(containerEl, {
    scale: 2,
    useCORS: true,
    scrollY: typeof window !== 'undefined' ? -window.scrollY : 0
  });

  const imageData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pageWidth / canvas.width, (pageHeight - 120) / canvas.height);
  const imageWidth = canvas.width * ratio;
  const imageHeight = canvas.height * ratio;
  const offsetX = (pageWidth - imageWidth) / 2;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text('كشف الحساب', pageWidth - 40, 50, { align: 'right' });
  pdf.setFontSize(12);
  pdf.text(month.label, pageWidth - 40, 75, { align: 'right' });

  pdf.addImage(imageData, 'PNG', offsetX, 90, imageWidth, imageHeight);
  pdf.save(`كشف-الحساب-${month.key}.pdf`);
};

export const mapPaymentRowsForExport = (payments, studentsLookup, groupsLookup) =>
  payments.map((payment) => {
    const student = studentsLookup[payment.student_id];
    const group = student ? groupsLookup[student.group_id] : null;
    const amountNumeric = Number(payment.amount ?? 0);
    return {
      student: student?.name ?? 'غير معروف',
      group: group?.name ?? 'غير مصنف',
      amount: formatCurrencyEGP(amountNumeric),
      amountNumeric,
      date: payment.date,
      note: payment.note ?? ''
    };
  });
