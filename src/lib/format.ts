export const NO_VALUE = '—';

const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const clockTimeFormat = new Intl.DateTimeFormat(undefined, { timeStyle: 'medium' });
const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 });

export function formatDateTime(epochMs: number | undefined): string {
  return epochMs === undefined ? NO_VALUE : dateTimeFormat.format(epochMs);
}

/** Time of day with seconds, for "updated at" text where minutes alone would not change between refreshes. */
export function formatClockTime(epochMs: number): string {
  return clockTimeFormat.format(epochMs);
}

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}
