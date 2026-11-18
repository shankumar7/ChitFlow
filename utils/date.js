export const getCurrentMonthNumber = () => new Date().getMonth() + 1;

// Build the date from the first day of the month so that months with fewer days
// never overflow into the next month (for example Jan 31 + February).
export const getMonthName = (monthNumber) => {
  const date = new Date(new Date().getFullYear(), monthNumber - 1, 1);
  return date.toLocaleString('default', { month: 'long' });
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Returns the maturity date (YYYY-MM-DD) for a chit, or null when the input is not a valid date.
export const calculateEndDate = (startDateStr, durationMonths) => {
  if (!startDateStr) return null;
  const start = new Date(startDateStr);
  if (Number.isNaN(start.getTime())) return null;
  const months = Number(durationMonths) || 0;
  const end = new Date(start.getFullYear(), start.getMonth() + months, start.getDate());
  if (Number.isNaN(end.getTime())) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;
};

// Strict YYYY-MM-DD check that also rejects impossible dates such as 2026-02-31.
export const isValidDateString = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
};
