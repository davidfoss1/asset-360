import { describe, expect, it } from 'vitest';

import { activityColumnLayout } from './activityColumns';

const ids = (width: number | undefined) => activityColumnLayout(width).map((column) => column.id);
const size = (width: number | undefined, id: string) => activityColumnLayout(width).find((column) => column.id === id)?.size;

describe(activityColumnLayout.name, () => {
  it('shows every column when there is room, name and description sharing what the dates leave', () => {
    expect(ids(1100)).toEqual(['name', 'description', 'scheduled', 'start', 'end']);
    expect(size(1100, 'scheduled')).toBe(190);
    expect(size(1100, 'start')).toBe(190);
    expect(size(1100, 'end')).toBe(190);
    // 1100 less the gutter and 570 for the dates leaves the rest to the two text columns, description wider
    const name = size(1100, 'name') ?? 0;
    const description = size(1100, 'description') ?? 0;
    expect(name + description).toBe(1100 - 16 - 570);
    expect(description).toBeGreaterThan(name);
  });

  it('never makes the text columns narrower than they are readable at', () => {
    for (const width of [990, 1000, 1200, 1600, 2400]) {
      expect(size(width, 'name')).toBeGreaterThanOrEqual(160);
      expect(size(width, 'description')).toBeGreaterThanOrEqual(160);
    }
  });

  it('never makes the columns wider than the table', () => {
    for (const width of [300, 450, 600, 700, 990, 1100, 1600]) {
      const total = activityColumnLayout(width).reduce((sum, column) => sum + column.size, 0);
      // The narrowest layout has a minimum width it cannot go under; every other fits.
      expect(total).toBeLessThanOrEqual(Math.max(width, 190 + 120));
    }
  });

  it('drops the description and scheduled start at a medium width, keeping what and when', () => {
    expect(ids(800)).toEqual(['name', 'start', 'end']);
    expect(size(800, 'name')).toBe(800 - 16 - 380);
  });

  it('keeps only the name and when it started at a narrow width', () => {
    expect(ids(450)).toEqual(['name', 'start']);
    expect(size(450, 'start')).toBe(190);
  });

  it('gives the name a readable minimum even in a very narrow table', () => {
    expect(size(200, 'name')).toBe(120);
  });

  it('switches layout exactly at the thresholds', () => {
    expect(ids(985)).toEqual(['name', 'start', 'end']);
    expect(ids(986)).toEqual(['name', 'description', 'scheduled', 'start', 'end']);
    expect(ids(595)).toEqual(['name', 'start']);
    expect(ids(596)).toEqual(['name', 'start', 'end']);
  });

  it('uses the full layout with default widths before the width is known', () => {
    expect(activityColumnLayout(undefined)).toEqual([
      { id: 'name', size: 200 },
      { id: 'description', size: 240 },
      { id: 'scheduled', size: 190 },
      { id: 'start', size: 190 },
      { id: 'end', size: 190 },
    ]);
  });
});
