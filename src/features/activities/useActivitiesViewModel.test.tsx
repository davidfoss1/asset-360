import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { makeDeps, makeViewModelWrapper } from '../../__mocks__/viewModelWrapper';
import type { ActivityItem, RelatedDataService } from '../../services/RelatedDataService';

import { useActivitiesViewModel } from './useActivitiesViewModel';

const ASSET = { space: 's', externalId: 'pump-101' };
const ACTIVITY: ActivityItem = { id: { space: 's', externalId: 'wo-1' }, name: 'Replace seal', startTime: 1000 };

describe(useActivitiesViewModel.name, () => {
  it('is idle and does not fetch when no asset is selected', () => {
    const deps = makeDeps();

    const { result } = renderHook(() => useActivitiesViewModel(), { wrapper: makeViewModelWrapper({ deps }) });

    expect(result.current.status).toBe('idle');
    expect(deps.related.listActivities).not.toHaveBeenCalled();
  });

  it("loads the selected asset's activities", async () => {
    // Arrange
    const listActivities = vi.fn<RelatedDataService['listActivities']>(() => Promise.resolve([ACTIVITY]));
    const deps = makeDeps({ related: { listActivities } });

    // Act
    const { result } = renderHook(() => useActivitiesViewModel(), {
      wrapper: makeViewModelWrapper({ deps, initialState: { assetId: ASSET } }),
    });

    // Assert
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.activities).toEqual([ACTIVITY]);
    expect(listActivities).toHaveBeenCalledWith(ASSET);
  });

  it('reports empty when the asset has no activities', async () => {
    const deps = makeDeps({ related: { listActivities: () => Promise.resolve([]) } });

    const { result } = renderHook(() => useActivitiesViewModel(), {
      wrapper: makeViewModelWrapper({ deps, initialState: { assetId: ASSET } }),
    });

    await waitFor(() => expect(result.current.status).toBe('empty'));
  });

  it('reports an error, and retry loads again', async () => {
    // Arrange
    const listActivities = vi
      .fn<RelatedDataService['listActivities']>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce([ACTIVITY]);
    const { result } = renderHook(() => useActivitiesViewModel(), {
      wrapper: makeViewModelWrapper({ deps: makeDeps({ related: { listActivities } }), initialState: { assetId: ASSET } }),
    });
    await waitFor(() => expect(result.current.status).toBe('error'));

    // Act
    act(() => result.current.retry());

    // Assert
    await waitFor(() => expect(result.current.status).toBe('success'));
  });
});
