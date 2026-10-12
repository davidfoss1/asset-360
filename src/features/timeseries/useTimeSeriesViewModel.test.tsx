import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { makeDeps, makeViewModelWrapper } from '../../__mocks__/viewModelWrapper';
import type { DatapointsService, SeriesPoint } from '../../services/DatapointsService';
import type { RelatedDataService, TimeSeriesItem } from '../../services/RelatedDataService';

import { useTimeSeriesViewModel } from './useTimeSeriesViewModel';

const ASSET = { space: 's', externalId: 'pump-101' };
const DAY = 24 * 60 * 60 * 1000;
// The series' last datapoint. The window ends here, not at the real current time.
const LATEST = 10 * DAY;
const STATUS: TimeSeriesItem = { id: { space: 's', externalId: 'status' }, name: 'Status', type: 'state' };
const PRESSURE: TimeSeriesItem = { id: { space: 's', externalId: 'pressure' }, name: 'Pressure', type: 'numeric', unit: 'bar' };
const TEMP: TimeSeriesItem = { id: { space: 's', externalId: 'temp' }, name: 'Temperature', type: 'numeric', unit: 'degC' };
const POINTS: SeriesPoint[] = [{ timestamp: LATEST - 1000, value: 4.2 }];

function setup(options: {
  series?: TimeSeriesItem[];
  initialState?: Record<string, unknown>;
  getSeries?: DatapointsService['getSeries'];
  getLatest?: DatapointsService['getLatest'];
  listTimeSeries?: RelatedDataService['listTimeSeries'];
}) {
  const getSeries = options.getSeries ?? vi.fn<DatapointsService['getSeries']>(() => Promise.resolve(POINTS));
  const getLatest =
    options.getLatest ??
    vi.fn<DatapointsService['getLatest']>(() => Promise.resolve({ timestamp: LATEST, value: 4.2 }));
  const deps = makeDeps({
    related: { listTimeSeries: options.listTimeSeries ?? (() => Promise.resolve(options.series ?? [])) },
    datapoints: { getSeries, getLatest },
  });
  const hook = renderHook(() => useTimeSeriesViewModel(), {
    wrapper: makeViewModelWrapper({ deps, initialState: { assetId: ASSET, ...options.initialState } }),
  });
  return { ...hook, getSeries, getLatest };
}

describe(useTimeSeriesViewModel.name, () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('is idle and does not fetch when no asset is selected', () => {
    const deps = makeDeps();

    const { result } = renderHook(() => useTimeSeriesViewModel(), { wrapper: makeViewModelWrapper({ deps }) });

    expect(result.current.listStatus).toBe('idle');
    expect(result.current.dataStatus).toBe('idle');
    expect(deps.related.listTimeSeries).not.toHaveBeenCalled();
  });

  it('lists the time series and charts the first numeric one over the 24 hours up to its latest datapoint', async () => {
    // Arrange / Act
    const { result, getSeries, getLatest } = setup({ series: [STATUS, PRESSURE, TEMP] });

    // Assert
    await waitFor(() => expect(result.current.dataStatus).toBe('success'));
    expect(result.current.timeSeries).toEqual([STATUS, PRESSURE, TEMP]);
    expect(result.current.selected).toEqual(PRESSURE);
    expect(result.current.points).toEqual(POINTS);
    expect(result.current.windowEnd).toBe(LATEST);
    expect(getLatest).toHaveBeenCalledWith(PRESSURE.id);
    // `end` is exclusive, so it is one millisecond past the latest datapoint.
    expect(getSeries).toHaveBeenCalledWith(PRESSURE.id, { start: LATEST - DAY, end: LATEST + 1 });
  });

  it('reports empty data without querying a range when a numeric series has no datapoints', async () => {
    const { result, getSeries } = setup({ series: [PRESSURE], getLatest: () => Promise.resolve(undefined) });

    await waitFor(() => expect(result.current.dataStatus).toBe('empty'));
    expect(result.current.windowEnd).toBeUndefined();
    expect(getSeries).not.toHaveBeenCalled();
  });

  it('reports a data error when the latest datapoint cannot be found', async () => {
    const { result } = setup({ series: [PRESSURE], getLatest: () => Promise.reject(new Error('boom')) });

    await waitFor(() => expect(result.current.dataStatus).toBe('error'));
    expect(result.current.listStatus).toBe('success');
  });

  it('charts the saved series, and switches when another is selected', async () => {
    // Arrange
    const { result, getSeries } = setup({ series: [PRESSURE, TEMP], initialState: { timeSeriesId: TEMP.id } });
    await waitFor(() => expect(result.current.dataStatus).toBe('success'));
    expect(result.current.selected).toEqual(TEMP);

    // Act
    act(() => result.current.selectSeries(PRESSURE.id));

    // Assert
    await waitFor(() => expect(result.current.selected).toEqual(PRESSURE));
    await waitFor(() => expect(getSeries).toHaveBeenCalledWith(PRESSURE.id, expect.anything()));
  });

  it('falls back to the first series when none is numeric', async () => {
    const { result } = setup({
      series: [STATUS],
      getLatest: () => Promise.resolve({ timestamp: LATEST, value: 'RUNNING' }),
    });

    await waitFor(() => expect(result.current.dataStatus).toBe('success'));
    expect(result.current.selected).toEqual(STATUS);
  });

  it('shows only the latest value for a state series', async () => {
    // Arrange
    const { result, getSeries, getLatest } = setup({
      series: [STATUS],
      getLatest: vi.fn<DatapointsService['getLatest']>(() => Promise.resolve({ timestamp: LATEST, value: 'RUNNING' })),
    });

    // Assert
    await waitFor(() => expect(result.current.dataStatus).toBe('success'));
    expect(result.current.latest).toEqual({ timestamp: LATEST, value: 'RUNNING' });
    expect(result.current.points).toEqual([]);
    expect(getLatest).toHaveBeenCalledWith(STATUS.id);
    expect(getSeries).not.toHaveBeenCalled();
  });

  it('reports empty data for a state series with no datapoints', async () => {
    const { result } = setup({ series: [STATUS], getLatest: () => Promise.resolve(undefined) });

    await waitFor(() => expect(result.current.dataStatus).toBe('empty'));
  });

  it('reports empty data when the chart window has no points', async () => {
    const { result } = setup({ series: [PRESSURE], getSeries: () => Promise.resolve([]) });

    await waitFor(() => expect(result.current.dataStatus).toBe('empty'));
  });

  it('reports an empty list, and stays idle for the data', async () => {
    const { result } = setup({ series: [] });

    await waitFor(() => expect(result.current.listStatus).toBe('empty'));
    expect(result.current.selected).toBeUndefined();
    expect(result.current.dataStatus).toBe('idle');
  });

  it('reports a list error, and retry loads again', async () => {
    // Arrange
    const listTimeSeries = vi
      .fn<RelatedDataService['listTimeSeries']>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce([PRESSURE]);
    const { result } = setup({ listTimeSeries });
    await waitFor(() => expect(result.current.listStatus).toBe('error'));

    // Act
    act(() => result.current.retryList());

    // Assert
    await waitFor(() => expect(result.current.listStatus).toBe('success'));
  });

  it('reports a data error independently of the list, and refresh loads again', async () => {
    // Arrange
    const getSeries = vi
      .fn<DatapointsService['getSeries']>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(POINTS);
    const { result } = setup({ series: [PRESSURE], getSeries });
    await waitFor(() => expect(result.current.dataStatus).toBe('error'));
    expect(result.current.listStatus).toBe('success');

    // Act
    act(() => result.current.refresh());

    // Assert
    await waitFor(() => expect(result.current.dataStatus).toBe('success'));
  });

  it('refetches the chart data every 30 seconds', async () => {
    // Arrange
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { result, getSeries } = setup({ series: [PRESSURE] });
    await waitFor(() => expect(result.current.dataStatus).toBe('success'));
    expect(getSeries).toHaveBeenCalledTimes(1);

    // Act
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    // Assert
    await waitFor(() => expect(getSeries).toHaveBeenCalledTimes(2));
  });
});
