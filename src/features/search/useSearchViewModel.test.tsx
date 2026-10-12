import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { makeDeps, makeViewModelWrapper } from '../../__mocks__/viewModelWrapper';
import type { AssetService, AssetSummary } from '../../services/AssetService';

import { useSearchViewModel } from './useSearchViewModel';

const PUMP: AssetSummary = { id: { space: 's', externalId: 'pump-101' }, name: 'PUMP-101' };

describe(useSearchViewModel.name, () => {
  it('is idle and does not search for a blank query', () => {
    // Arrange
    const deps = makeDeps();

    // Act
    const { result } = renderHook(() => useSearchViewModel(), { wrapper: makeViewModelWrapper({ deps }) });

    // Assert
    expect(result.current.status).toBe('idle');
    expect(result.current.results).toEqual([]);
    expect(deps.assets.search).not.toHaveBeenCalled();
  });

  it('loads, then exposes results for the restored query', async () => {
    // Arrange
    const search = vi.fn<AssetService['search']>(() => Promise.resolve([PUMP]));
    const deps = makeDeps({ assets: { search } });

    // Act
    const { result } = renderHook(() => useSearchViewModel(), {
      wrapper: makeViewModelWrapper({ deps, initialState: { query: 'pump' } }),
    });

    // Assert
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.results).toEqual([PUMP]);
    expect(search).toHaveBeenCalledWith('pump');
  });

  it('searches with the trimmed query when the user types', async () => {
    // Arrange
    const search = vi.fn<AssetService['search']>(() => Promise.resolve([PUMP]));
    const { result } = renderHook(() => useSearchViewModel(), {
      wrapper: makeViewModelWrapper({ deps: makeDeps({ assets: { search } }) }),
    });

    // Act
    act(() => result.current.setQuery('  pump 101 '));

    // Assert
    await waitFor(() => expect(search).toHaveBeenCalledWith('pump 101'));
    expect(result.current.query).toBe('  pump 101 ');
  });

  it('reports empty when nothing matches', async () => {
    const deps = makeDeps({ assets: { search: () => Promise.resolve([]) } });

    const { result } = renderHook(() => useSearchViewModel(), {
      wrapper: makeViewModelWrapper({ deps, initialState: { query: 'zzz' } }),
    });

    await waitFor(() => expect(result.current.status).toBe('empty'));
  });

  it('reports an error, and retry searches again', async () => {
    // Arrange
    const search = vi
      .fn<AssetService['search']>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce([PUMP]);
    const { result } = renderHook(() => useSearchViewModel(), {
      wrapper: makeViewModelWrapper({ deps: makeDeps({ assets: { search } }), initialState: { query: 'pump' } }),
    });
    await waitFor(() => expect(result.current.status).toBe('error'));

    // Act
    act(() => result.current.retry());

    // Assert
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(search).toHaveBeenCalledTimes(2);
  });

  it('exposes and updates the selected asset', () => {
    // Arrange
    const { result } = renderHook(() => useSearchViewModel(), {
      wrapper: makeViewModelWrapper({ deps: makeDeps(), initialState: { assetId: PUMP.id } }),
    });
    expect(result.current.selectedAssetId).toEqual(PUMP.id);
    const other = { space: 's', externalId: 'pump-102' };

    // Act
    act(() => result.current.selectAsset(other));

    // Assert
    expect(result.current.selectedAssetId).toEqual(other);
  });
});
