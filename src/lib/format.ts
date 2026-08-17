/** Markdown dates are stored as UTC midnight. Read the calendar day, not the local clock. */
export function calendarDate(date: Date) {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function money(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

export function percent(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(1)}%`;
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(calendarDate(date));
}

export function formatMonth(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
  }).format(calendarDate(date));
}

export function sharesLabel(shares: number) {
  return Number.isInteger(shares) ? String(shares) : shares.toString();
}
