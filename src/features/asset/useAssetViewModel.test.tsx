import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { makeDeps, makeViewModelWrapper } from '../../__mocks__/viewModelWrapper';
import type { AssetDetail, AssetService } from '../../services/AssetService';

import { useAssetViewModel } from './useAssetViewModel';

const ID = { space: 's', externalId: 'pump-101' };
const DETAIL: AssetDetail = { id: ID, name: 'PUMP-101', description: 'Feed pump', assetClass: 'Pump' };

describe(useAssetViewModel.name, () => {
  it('is idle and does not fetch when no asset is selected', () => {
    const deps = makeDeps();

    const { result } = renderHook(() => useAssetViewModel(), { wrapper: makeViewModelWrapper({ deps }) });

    expect(result.current.status).toBe('idle');
    expect(result.current.asset).toBeUndefined();
    expect(deps.assets.get).not.toHaveBeenCalled();
  });

  it('loads the selected asset', async () => {
    // Arrange
    const get = vi.fn<AssetService['get']>(() => Promise.resolve(DETAIL));
    const deps = makeDeps({ assets: { get } });

    // Act
    const { result } = renderHook(() => useAssetViewModel(), {
      wrapper: makeViewModelWrapper({ deps, initialState: { assetId: ID } }),
    });

    // Assert
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.asset).toEqual(DETAIL);
    expect(get).toHaveBeenCalledWith(ID);
  });

  it('reports empty when the asset no longer exists', async () => {
    const deps = makeDeps({ assets: { get: () => Promise.resolve(undefined) } });

    const { result } = renderHook(() => useAssetViewModel(), {
      wrapper: makeViewModelWrapper({ deps, initialState: { assetId: ID } }),
    });

    await waitFor(() => expect(result.current.status).toBe('empty'));
    expect(result.current.asset).toBeUndefined();
  });

  it('reports an error, and retry loads again', async () => {
    // Arrange
    const get = vi.fn<AssetService['get']>().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(DETAIL);
    const { result } = renderHook(() => useAssetViewModel(), {
      wrapper: makeViewModelWrapper({ deps: makeDeps({ assets: { get } }), initialState: { assetId: ID } }),
    });
    await waitFor(() => expect(result.current.status).toBe('error'));

    // Act
    act(() => result.current.retry());

    // Assert
    await waitFor(() => expect(result.current.status).toBe('success'));
  });
});
