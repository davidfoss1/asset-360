import type { CogniteClient } from '@cognite/sdk';

import type { InstanceRef } from '../lib/properties';
import type { TaskRunner } from '../lib/taskRunner';

export type TimeRange = { start: number; end: number };
export type SeriesPoint = { timestamp: number; value: number };
export type LatestPoint = { timestamp: number; value: string | number };

export interface DatapointsService {
  /** Aggregated numeric datapoints for charting. */
  getSeries(id: InstanceRef, range: TimeRange): Promise<SeriesPoint[]>;
  /** Latest datapoint of any type, for string and state series. */
  getLatest(id: InstanceRef): Promise<LatestPoint | undefined>;
}

/** The subset of the SDK this service needs. */
export type DatapointsClient = { datapoints: Pick<CogniteClient['datapoints'], 'retrieve' | 'retrieveLatest'> };

const TARGET_POINTS = 300;
const MAX_GRANULARITY_MINUTES = 120;
const MINUTE_MS = 60 * 1000;
const POINT_LIMIT = 1000;

export class CdmDatapointsService implements DatapointsService {
  constructor(
    private readonly client: DatapointsClient,
    private readonly run: TaskRunner
  ) {}

  async getSeries(id: InstanceRef, { start, end }: TimeRange): Promise<SeriesPoint[]> {
    const result = await this.run(() =>
      this.client.datapoints.retrieve({
        items: [{ instanceId: id }],
        start,
        end,
        aggregates: ['average'],
        granularity: granularityFor(end - start),
        limit: POINT_LIMIT,
      })
    );

    const points: SeriesPoint[] = [];
    for (const point of result[0]?.datapoints ?? []) {
      if ('average' in point && typeof point.average === 'number') {
        points.push({ timestamp: point.timestamp.getTime(), value: point.average });
      }
    }
    return points;
  }

  async getLatest(id: InstanceRef): Promise<LatestPoint | undefined> {
    const result = await this.run(() => this.client.datapoints.retrieveLatest([{ instanceId: id, before: 'now' }]));
    const point = result[0]?.datapoints[0];
    return point ? { timestamp: point.timestamp.getTime(), value: point.value } : undefined;
  }
}

/** Aims for ~300 buckets, in whole minutes, within the API's minute-granularity cap. */
function granularityFor(rangeMs: number): string {
  const minutes = Math.ceil(rangeMs / MINUTE_MS / TARGET_POINTS);
  return `${Math.min(MAX_GRANULARITY_MINUTES, Math.max(1, minutes))}m`;
}

/** The only way other modules get the implementation. */
export function createDatapointsService(client: DatapointsClient, run: TaskRunner): DatapointsService {
  return new CdmDatapointsService(client, run);
}
