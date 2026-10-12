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
  it('shows the time of day down to the second, so two refreshes a few seconds apart look different', () => {
    const first = formatClockTime(new Date(2026, 8, 1, 14, 3, 7).getTime());
    const second = formatClockTime(new Date(2026, 8, 1, 14, 3, 22).getTime());

    expect(first).toMatch(/3.07/);
    expect(second).toMatch(/3.22/);
  });

  it('does not include the date', () => {
    expect(formatClockTime(new Date(2026, 8, 1, 14, 3, 7).getTime())).not.toContain('2026');
  });
});
