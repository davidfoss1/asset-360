import { describe, expect, it } from 'vitest';

import { formatTimeTick, niceTimeTicks } from './timeTicks';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

describe(niceTimeTicks.name, () => {
  it('puts a 24-hour window on every fourth hour of the local clock', () => {
    // Arrange: starts at an awkward 14:46, as a window ending at a series' last datapoint does
    const start = at(2026, 8, 1, 14, 46);

    // Act
    const ticks = niceTimeTicks(start, start + 24 * HOUR);

    // Assert
    expect(clockTimes(ticks)).toEqual(['16:00', '20:00', '00:00', '04:00', '08:00', '12:00']);
  });

  it('keeps every mark inside the range and in ascending order', () => {
    const start = at(2026, 8, 1, 9, 13);
    const end = start + 24 * HOUR;

    const ticks = niceTimeTicks(start, end);

    expect(ticks.every((tick) => tick >= start && tick <= end)).toBe(true);
    expect([...ticks].sort((a, b) => a - b)).toEqual(ticks);
  });

  it('includes a mark that falls exactly on the start or the end', () => {
    const start = at(2026, 8, 1, 4, 0);

    const ticks = niceTimeTicks(start, start + 24 * HOUR);

    expect(clockTimes(ticks)).toEqual(['04:00', '08:00', '12:00', '16:00', '20:00', '00:00', '04:00']);
  });

  it('never returns more marks than asked for', () => {
    const start = at(2026, 8, 1, 0, 0);

    for (let offset = 0; offset < 24 * 60; offset += 37) {
      const from = start + offset * MINUTE;
      expect(niceTimeTicks(from, from + 24 * HOUR).length).toBeLessThanOrEqual(7);
      expect(niceTimeTicks(from, from + 24 * HOUR, 4).length).toBeLessThanOrEqual(4);
    }
  });

  it('uses finer steps for a shorter range', () => {
    const twoHours = niceTimeTicks(at(2026, 8, 1, 10, 7), at(2026, 8, 1, 12, 7));
    const twentyMinutes = niceTimeTicks(at(2026, 8, 1, 10, 7), at(2026, 8, 1, 10, 27));

    expect(clockTimes(twoHours)).toEqual(['10:30', '11:00', '11:30', '12:00']);
    expect(clockTimes(twentyMinutes)).toEqual(['10:10', '10:15', '10:20', '10:25']);
  });

  it('never marks a minute that is not a multiple of five', () => {
    const start = at(2026, 8, 1, 3, 3);

    for (const range of [10 * MINUTE, 45 * MINUTE, 3 * HOUR, 9 * HOUR, 24 * HOUR]) {
      for (const tick of niceTimeTicks(start, start + range)) {
        expect(new Date(tick).getMinutes() % 5).toBe(0);
      }
    }
  });

  it('keeps the marks on round local hours for windows all through the year, DST changes included', () => {
    // Arrange: a window every 29 hours across a year crosses every clock change a timezone has
    const first = at(2026, 0, 1, 0, 0);

    for (let t = first; t < first + 365 * 24 * HOUR; t += 29 * HOUR) {
      // Act
      const ticks = niceTimeTicks(t + 17 * MINUTE, t + 17 * MINUTE + 24 * HOUR);

      // Assert
      expect(ticks.length).toBeGreaterThan(0);
      for (const tick of ticks) {
        const date = new Date(tick);
        expect(date.getMinutes()).toBe(0);
        expect(date.getHours() % 4).toBe(0);
      }
    }
  });

  it.each([
    ['empty', at(2026, 8, 1, 12, 0), at(2026, 8, 1, 12, 0)],
    ['inverted', at(2026, 8, 1, 12, 0), at(2026, 8, 1, 11, 0)],
    ['too long for any step', at(2026, 8, 1, 0, 0), at(2026, 8, 8, 0, 0)],
    ['too short to contain a mark', at(2026, 8, 1, 12, 1), at(2026, 8, 1, 12, 3)],
  ])('has no marks for a range that is %s', (_name, start, end) => {
    expect(niceTimeTicks(start, end)).toEqual([]);
  });
});

describe(formatTimeTick.name, () => {
  it('shows the date for the mark at local midnight, so the day change is visible', () => {
    const label = formatTimeTick(at(2026, 8, 2, 0, 0));

    expect(label).toContain('2');
    expect(label).not.toMatch(/\d[:.]\d{2}/);
  });

  it('shows a clock time for every other mark', () => {
    expect(formatTimeTick(at(2026, 8, 2, 16, 0))).toMatch(/\d{1,2}[:.]00/);
  });
});

function at(year: number, month: number, day: number, hour: number, minute: number): number {
  return new Date(year, month, day, hour, minute).getTime();
}

/** The marks as local "HH:MM", independent of the display locale. */
function clockTimes(ticks: number[]): string[] {
  return ticks.map((tick) => {
    const date = new Date(tick);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  });
}
