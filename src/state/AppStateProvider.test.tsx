import { act, renderHook } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppStateProvider, type AppStateApi } from './AppStateProvider';
import { useAppState } from './useAppState';

const ASSET = { space: 'instances-space', externalId: 'pump-101' };
const SERIES = { space: 'instances-space', externalId: 'pump-101-pressure' };
const FILE = { space: 'instances-space', externalId: 'pid.pdf' };

describe(AppStateProvider.name, () => {
  let api: AppStateApi;

  beforeEach(() => {
    api = { syncInternalState: vi.fn<AppStateApi['syncInternalState']>(() => Promise.resolve(true)) };
  });

  it('starts from the default state when there is no initial state', () => {
    const { result } = renderHook(() => useAppState(), { wrapper: makeWrapper(api) });

    expect(result.current.state).toEqual({ query: '', assetId: null, timeSeriesId: null, fileId: null, tab: 'activities' });
  });

  it('seeds its state from the initial state', () => {
    // Arrange
    const initialState = JSON.stringify({ query: 'pump', assetId: ASSET, timeSeriesId: SERIES, fileId: FILE, tab: 'files' });

    // Act
    const { result } = renderHook(() => useAppState(), { wrapper: makeWrapper(api, initialState) });

    // Assert
    expect(result.current.state).toEqual({
      query: 'pump',
      assetId: ASSET,
      timeSeriesId: SERIES,
      fileId: FILE,
      tab: 'files',
    });
  });

  it('does not sync on mount', () => {
    renderHook(() => useAppState(), { wrapper: makeWrapper(api, JSON.stringify({ query: 'pump' })) });

    expect(api.syncInternalState).not.toHaveBeenCalled();
  });

  it('updates the query and syncs the new state to the host', () => {
    // Arrange
    const { result } = renderHook(() => useAppState(), { wrapper: makeWrapper(api) });

    // Act
    act(() => result.current.setQuery('PUMP-101'));

    // Assert
    expect(result.current.state.query).toBe('PUMP-101');
    expect(api.syncInternalState).toHaveBeenCalledWith(
      JSON.stringify({ query: 'PUMP-101', assetId: null, timeSeriesId: null, fileId: null, tab: 'activities' })
    );
  });

  it('selecting an asset clears the selected time series and file', () => {
    // Arrange
    const { result } = renderHook(() => useAppState(), {
      wrapper: makeWrapper(api, JSON.stringify({ query: 'pump', assetId: ASSET, timeSeriesId: SERIES, fileId: FILE })),
    });
    const other = { space: 'instances-space', externalId: 'pump-102' };

    // Act
    act(() => result.current.selectAsset(other));

    // Assert
    expect(result.current.state).toEqual({
      query: 'pump',
      assetId: other,
      timeSeriesId: null,
      fileId: null,
      tab: 'activities',
    });
    expect(api.syncInternalState).toHaveBeenCalledWith(
      JSON.stringify({ query: 'pump', assetId: other, timeSeriesId: null, fileId: null, tab: 'activities' })
    );
  });

  it('selects a time series and syncs it', () => {
    // Arrange
    const { result } = renderHook(() => useAppState(), { wrapper: makeWrapper(api) });

    // Act
    act(() => result.current.selectTimeSeries(SERIES));

    // Assert
    expect(result.current.state.timeSeriesId).toEqual(SERIES);
    expect(api.syncInternalState).toHaveBeenCalledTimes(1);
  });

  it('selects a file and syncs it, and clears it with null', () => {
    // Arrange
    const { result } = renderHook(() => useAppState(), { wrapper: makeWrapper(api) });

    // Act
    act(() => result.current.selectFile(FILE));
    expect(result.current.state.fileId).toEqual(FILE);
    act(() => result.current.selectFile(null));

    // Assert
    expect(result.current.state.fileId).toBeNull();
    expect(api.syncInternalState).toHaveBeenCalledTimes(2);
  });

  it('switches tab and syncs it', () => {
    const { result } = renderHook(() => useAppState(), { wrapper: makeWrapper(api) });

    act(() => result.current.selectTab('files'));

    expect(result.current.state.tab).toBe('files');
    expect(api.syncInternalState).toHaveBeenCalledTimes(1);
  });

  it('keeps working when there is no host api', () => {
    const { result } = renderHook(() => useAppState(), { wrapper: makeWrapper(null) });

    act(() => result.current.setQuery('pump'));

    expect(result.current.state.query).toBe('pump');
  });

  it('keeps the new state when syncing to the host fails', async () => {
    // Arrange
    vi.mocked(api.syncInternalState).mockRejectedValue(new Error('host unavailable'));
    const { result } = renderHook(() => useAppState(), { wrapper: makeWrapper(api) });

    // Act
    await act(async () => result.current.setQuery('pump'));

    // Assert
    expect(result.current.state.query).toBe('pump');
  });
});

describe(useAppState.name, () => {
  it('throws when used outside the provider', () => {
    // Arrange: React logs the error it re-throws
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    // Act / Assert
    expect(() => renderHook(() => useAppState())).toThrow(/AppStateProvider/);
  });
});

function makeWrapper(api: AppStateApi | null, initialState?: string): ComponentType<{ children: ReactNode }> {
  return function Wrapper({ children }) {
    return (
      <AppStateProvider api={api} initialState={initialState}>
        {children}
      </AppStateProvider>
    );
  };
}
