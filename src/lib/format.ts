export const NO_VALUE = '—';

const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 });

export function formatDateTime(epochMs: number | undefined): string {
  return epochMs === undefined ? NO_VALUE : dateTimeFormat.format(epochMs);
}

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}
