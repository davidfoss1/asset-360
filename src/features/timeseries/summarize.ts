import type { SeriesPoint } from '../../services/DatapointsService';

export type SeriesSummary = { latest: SeriesPoint; min: number; max: number };

/** Key figures for the chart's text alternative. Undefined when there are no points. */
export function summarize(points: SeriesPoint[]): SeriesSummary | undefined {
  const [first, ...rest] = points;
  if (!first) return undefined;

  let latest = first;
  let min = first.value;
  let max = first.value;
  for (const point of rest) {
    if (point.timestamp > latest.timestamp) latest = point;
    min = Math.min(min, point.value);
    max = Math.max(max, point.value);
  }
  return { latest, min, max };
}
