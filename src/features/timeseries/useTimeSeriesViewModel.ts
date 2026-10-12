import { useQuery } from '@tanstack/react-query';

import { useAppDeps } from '../../deps/useAppDeps';
import { toLoadStatus, type LoadStatus } from '../../lib/loadStatus';
import type { InstanceRef } from '../../lib/properties';
import type { LatestPoint, SeriesPoint } from '../../services/DatapointsService';
import type { TimeSeriesItem } from '../../services/RelatedDataService';
import { useAppState } from '../../state/useAppState';

const WINDOW_MS = 24 * 60 * 60 * 1000;

// react-query rejects `undefined` results, so "no datapoints" is a null window end.
type SeriesWindow = { points: SeriesPoint[]; windowEnd: number | null };

export type TimeSeriesViewModel = {
  listStatus: LoadStatus;
  timeSeries: TimeSeriesItem[];
  /** The charted series: the saved one, else the first numeric series, else the first series. */
  selected: TimeSeriesItem | undefined;
  selectSeries: (id: InstanceRef) => void;
  retryList: () => void;
  /** Status of the selected series' data, independent of the list. */
  dataStatus: LoadStatus;
  /** Chart points for a numeric series. Empty for string and state series. */
  points: SeriesPoint[];
  /** Where the chart's 24-hour window ends: the series' latest datapoint. Undefined if it has none. */
  windowEnd: number | undefined;
  /** Latest value for a string or state series. */
  latest: LatestPoint | undefined;
  refresh: () => void;
  /** A refresh is in flight. The data already shown stays until it finishes. */
  isRefreshing: boolean;
  /** The last refresh failed, so what is shown is older than the user asked for. */
  refreshFailed: boolean;
  /** When the shown data was fetched (epoch ms). Undefined until the first load completes. */
  updatedAt: number | undefined;
};

export function useTimeSeriesViewModel(): TimeSeriesViewModel {
  const { related, datapoints } = useAppDeps();
  const { state, selectTimeSeries } = useAppState();
  const assetId = state.assetId;

  const list = useQuery({
    queryKey: ['timeSeries', assetId?.space, assetId?.externalId],
    queryFn: () => (assetId ? related.listTimeSeries(assetId) : Promise.resolve([])),
    enabled: assetId !== null,
  });

  const timeSeries = list.data ?? [];
  const selected = pickSelected(timeSeries, state.timeSeriesId);
  const isNumeric = selected?.type === 'numeric';

  // The window ends at the series' latest datapoint rather than the current time, so series whose
  // data stopped in the past (static or demo data) still chart. For live series the two coincide.
  // It is resolved inside queryFn, so each manual refresh slides the window forward.
  const series = useQuery({
    queryKey: ['datapoints', 'series', selected?.id.space, selected?.id.externalId],
    queryFn: async (): Promise<SeriesWindow> => {
      if (!selected) return { points: [], windowEnd: null };
      const newest = await datapoints.getLatest(selected.id);
      if (!newest) return { points: [], windowEnd: null };
      // The API's `end` is exclusive; +1 ms keeps the latest datapoint inside the window.
      const points = await datapoints.getSeries(selected.id, {
        start: newest.timestamp - WINDOW_MS,
        end: newest.timestamp + 1,
      });
      return { points, windowEnd: newest.timestamp };
    },
    enabled: selected !== undefined && isNumeric,
  });

  const latest = useQuery({
    queryKey: ['datapoints', 'latest', selected?.id.space, selected?.id.externalId],
    // react-query rejects `undefined` results, so "no datapoints" becomes null.
    queryFn: async () => (selected ? ((await datapoints.getLatest(selected.id)) ?? null) : null),
    enabled: selected !== undefined && !isNumeric,
  });

  const active = isNumeric ? series : latest;
  return {
    listStatus: toLoadStatus(list, (items) => items.length === 0),
    timeSeries,
    selected,
    selectSeries: selectTimeSeries,
    retryList: () => void list.refetch(),
    dataStatus: isNumeric
      ? toLoadStatus(series, (window) => window.points.length === 0)
      : toLoadStatus(latest, (point) => point === null),
    points: series.data?.points ?? [],
    windowEnd: series.data?.windowEnd ?? undefined,
    latest: latest.data ?? undefined,
    refresh: () => void active.refetch(),
    isRefreshing: active.isRefetching,
    refreshFailed: active.isRefetchError,
    updatedAt: active.dataUpdatedAt === 0 ? undefined : active.dataUpdatedAt,
  };
}

function pickSelected(items: TimeSeriesItem[], savedId: InstanceRef | null): TimeSeriesItem | undefined {
  const saved = savedId
    ? items.find((item) => item.id.space === savedId.space && item.id.externalId === savedId.externalId)
    : undefined;
  return saved ?? items.find((item) => item.type === 'numeric') ?? items[0];
}
