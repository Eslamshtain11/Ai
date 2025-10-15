export const isValidEgyptPhone = (value = '') => /^01[0-25][0-9]{8}$/.test(String(value).trim());

export const isPositiveAmount = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0;
};
