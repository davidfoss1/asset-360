import { describe, expect, it } from 'vitest';

import { summarize } from './summarize';

describe(summarize.name, () => {
  it('returns undefined for no points', () => {
    expect(summarize([])).toBeUndefined();
  });

  it('reports the latest, minimum and maximum values', () => {
    // Arrange: out of order on purpose; "latest" is by timestamp, not array position
    const points = [
      { timestamp: 3000, value: 5 },
      { timestamp: 1000, value: 9 },
      { timestamp: 2000, value: 2 },
    ];

    // Act / Assert
    expect(summarize(points)).toEqual({ latest: { timestamp: 3000, value: 5 }, min: 2, max: 9 });
  });

  it('handles a single point', () => {
    expect(summarize([{ timestamp: 1, value: 7 }])).toEqual({ latest: { timestamp: 1, value: 7 }, min: 7, max: 7 });
  });
});
