import { describe, expect, it } from 'vitest';

import { formatClockTime, formatDateTime, formatNumber, NO_VALUE } from './format';

describe(formatDateTime.name, () => {
  it('formats an epoch timestamp with date and time', () => {
    const text = formatDateTime(Date.UTC(2026, 8, 1, 12, 30));

    expect(text).toContain('2026');
    expect(text).not.toBe(NO_VALUE);
  });

  it('returns a placeholder for a missing timestamp', () => {
    expect(formatDateTime(undefined)).toBe(NO_VALUE);
  });
});

describe(formatNumber.name, () => {
  it('limits to three decimals', () => {
    expect(formatNumber(1.23456)).toBe('1.235');
  });

  it('does not pad whole numbers', () => {
    expect(formatNumber(42)).toBe('42');
  });
});

describe(formatClockTime.name, () => {
  it('shows the time of day to the minute, without seconds', () => {
    const text = formatClockTime(new Date(2026, 8, 1, 14, 3, 27).getTime());

    expect(text).toContain('03');
    expect(text).not.toContain('27');
  });

  it('does not include the date', () => {
    expect(formatClockTime(new Date(2026, 8, 1, 14, 3, 7).getTime())).not.toContain('2026');
  });
});
