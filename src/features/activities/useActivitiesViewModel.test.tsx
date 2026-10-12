import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { makeDeps, makeViewModelWrapper } from '../../__mocks__/viewModelWrapper';
import type { ActivityItem, ActivityList, RelatedDataService } from '../../services/RelatedDataService';

import { ACTIVITY_MAX, ACTIVITY_PAGE_SIZE, useActivitiesViewModel } from './useActivitiesViewModel';

const ASSET = { space: 's', externalId: 'pump-101' };
const ACTIVITY: ActivityItem = { id: { space: 's', externalId: 'wo-1' }, name: 'Replace seal', startTime: 1000 };

describe(useActivitiesViewModel.name, () => {
  it('is idle and does not fetch when no asset is selected', () => {
    const deps = makeDeps();

    const { result } = renderHook(() => useActivitiesViewModel(), { wrapper: makeViewModelWrapper({ deps }) });

    expect(result.current.status).toBe('idle');
    expect(deps.related.listActivities).not.toHaveBeenCalled();
  });

  it("loads the first page of the selected asset's activities", async () => {
    // Arrange
    const listActivities = vi.fn<RelatedDataService['listActivities']>(() => Promise.resolve(list([ACTIVITY])));

    // Act
    const { result } = renderHookFor(listActivities);

    // Assert
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.activities).toEqual([ACTIVITY]);
    expect(listActivities).toHaveBeenCalledWith(ASSET, ACTIVITY_PAGE_SIZE);
  });

  it('reports empty when the asset has no activities', async () => {
    const { result } = renderHookFor(() => Promise.resolve(list([])));

    await waitFor(() => expect(result.current.status).toBe('empty'));
  });

  it('reports an error, and retry loads again', async () => {
    // Arrange
    const listActivities = vi
      .fn<RelatedDataService['listActivities']>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(list([ACTIVITY]));
    const { result } = renderHookFor(listActivities);
    await waitFor(() => expect(result.current.status).toBe('error'));

    // Act
    act(() => result.current.retry());

    // Assert
    await waitFor(() => expect(result.current.status).toBe('success'));
  });

  describe('loading more', () => {
    it('offers more only when the service says there is more', async () => {
      const { result } = renderHookFor(() => Promise.resolve(list([ACTIVITY], { hasMore: true })));

      await waitFor(() => expect(result.current.hasMore).toBe(true));
    });

    it('offers nothing more when the service has no more', async () => {
      const { result } = renderHookFor(() => Promise.resolve(list([ACTIVITY], { hasMore: false })));

      await waitFor(() => expect(result.current.status).toBe('success'));
      expect(result.current.hasMore).toBe(false);
    });

    it('asks for a larger limit and shows the longer list', async () => {
      // Arrange
      const listActivities = vi.fn<RelatedDataService['listActivities']>((_asset, limit) =>
        Promise.resolve(list(activitiesUpTo(limit), { hasMore: true }))
      );
      const { result } = renderHookFor(listActivities);
      await waitFor(() => expect(result.current.activities).toHaveLength(ACTIVITY_PAGE_SIZE));

      // Act
      act(() => result.current.loadMore());

      // Assert
      await waitFor(() => expect(result.current.activities).toHaveLength(ACTIVITY_PAGE_SIZE * 2));
      expect(listActivities).toHaveBeenLastCalledWith(ASSET, ACTIVITY_PAGE_SIZE * 2);
    });

    it('keeps the current rows on screen while the next ones load', async () => {
      // Arrange
      const second = deferred<ActivityList>();
      const listActivities = vi
        .fn<RelatedDataService['listActivities']>()
        .mockResolvedValueOnce(list([ACTIVITY], { hasMore: true }))
        .mockReturnValueOnce(second.promise);
      const { result } = renderHookFor(listActivities);
      await waitFor(() => expect(result.current.hasMore).toBe(true));

      // Act
      act(() => result.current.loadMore());

      // Assert
      await waitFor(() => expect(result.current.isLoadingMore).toBe(true));
      expect(result.current.status).toBe('success');
      expect(result.current.activities).toEqual([ACTIVITY]);
      second.resolve(list([ACTIVITY], { hasMore: false }));
      await waitFor(() => expect(result.current.isLoadingMore).toBe(false));
    });

    it('keeps the rows and reports the failure when loading more fails', async () => {
      // Arrange
      const listActivities = vi
        .fn<RelatedDataService['listActivities']>()
        .mockResolvedValueOnce(list([ACTIVITY], { hasMore: true }))
        .mockRejectedValueOnce(new Error('boom'));
      const { result } = renderHookFor(listActivities);
      await waitFor(() => expect(result.current.hasMore).toBe(true));

      // Act
      act(() => result.current.loadMore());

      // Assert
      await waitFor(() => expect(result.current.loadMoreFailed).toBe(true));
      expect(result.current.status).toBe('success');
      expect(result.current.activities).toEqual([ACTIVITY]);
      expect(result.current.hasMore).toBe(true);
    });

    it('stops offering more at the cap, even if the service has more', async () => {
      // Arrange
      const listActivities = vi.fn<RelatedDataService['listActivities']>((_asset, limit) =>
        Promise.resolve(list(activitiesUpTo(limit), { hasMore: true }))
      );
      const { result } = renderHookFor(listActivities);

      // Act
      for (let shown = ACTIVITY_PAGE_SIZE; shown < ACTIVITY_MAX; shown += ACTIVITY_PAGE_SIZE) {
        await waitFor(() => expect(result.current.activities).toHaveLength(shown));
        act(() => result.current.loadMore());
      }

      // Assert
      await waitFor(() => expect(result.current.activities).toHaveLength(ACTIVITY_MAX));
      expect(result.current.hasMore).toBe(false);
    });

    it('does nothing when asked to load more and there is no more', async () => {
      const listActivities = vi.fn<RelatedDataService['listActivities']>(() => Promise.resolve(list([ACTIVITY])));
      const { result } = renderHookFor(listActivities);
      await waitFor(() => expect(result.current.status).toBe('success'));

      act(() => result.current.loadMore());

      expect(listActivities).toHaveBeenCalledTimes(1);
    });
  });
});

function renderHookFor(listActivities: RelatedDataService['listActivities']) {
  const deps = makeDeps({ related: { listActivities } });
  return renderHook(() => useActivitiesViewModel(), {
    wrapper: makeViewModelWrapper({ deps, initialState: { assetId: ASSET } }),
  });
}

function list(items: ActivityItem[], { hasMore = false }: { hasMore?: boolean } = {}): ActivityList {
  return { items, hasMore };
}

function activitiesUpTo(count: number): ActivityItem[] {
  return Array.from({ length: count }, (_, i) => ({ id: { space: 's', externalId: `wo-${i}` }, name: `Activity ${i}` }));
}

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
