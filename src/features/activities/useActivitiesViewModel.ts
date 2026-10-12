import { useInfiniteQuery } from '@tanstack/react-query';

import { useAppDeps } from '../../deps/useAppDeps';
import { toLoadStatus, type LoadStatus } from '../../lib/loadStatus';
import type { InstanceRef } from '../../lib/properties';
import type { ActivityItem } from '../../services/RelatedDataService';
import { useAppState } from '../../state/useAppState';

export const ACTIVITY_PAGE_SIZE = 25;
/** Where "Load more" stops. An asset with this many activities is better served by a narrower view. */
export const ACTIVITY_MAX = 500;

export type ActivitiesViewModel = {
  status: LoadStatus;
  activities: ActivityItem[];
  /** The open activity. Undefined if none is open or the saved one is not among the activities loaded so far. */
  selectedActivity: ActivityItem | undefined;
  selectActivity: (activityId: InstanceRef) => void;
  closeActivity: () => void;
  hasMore: boolean;
  loadMore: () => void;
  isLoadingMore: boolean;
  /** Loading more failed. The rows already shown stay, and `loadMore` tries again. */
  loadMoreFailed: boolean;
  retry: () => void;
};

export function useActivitiesViewModel(): ActivitiesViewModel {
  const { related } = useAppDeps();
  const { state, selectActivity } = useAppState();
  const assetId = state.assetId;

  // The API sorts the activities, and DMS cannot page a custom sort without a cursorable index. So a
  // "page" here is the newest N, and the next page asks for the newest N + 25. Only the latest page
  // is kept (`maxPages: 1`): it already contains the earlier ones, and a refetch then asks once.
  const activities = useInfiniteQuery({
    queryKey: ['activities', assetId?.space, assetId?.externalId],
    queryFn: ({ pageParam }) => (assetId ? related.listActivities(assetId, pageParam) : Promise.resolve(EMPTY)),
    initialPageParam: ACTIVITY_PAGE_SIZE,
    getNextPageParam: (last, _pages, limit) =>
      last.hasMore && limit < ACTIVITY_MAX ? limit + ACTIVITY_PAGE_SIZE : undefined,
    getPreviousPageParam: () => undefined,
    maxPages: 1,
    select: (data) => data.pages[data.pages.length - 1],
    enabled: assetId !== null,
  });

  const activityId = state.activityId;
  return {
    status: toLoadStatus(activities, (latest) => latest.items.length === 0),
    activities: activities.data?.items ?? [],
    selectedActivity: activityId
      ? activities.data?.items.find(
          (activity) => activity.id.space === activityId.space && activity.id.externalId === activityId.externalId
        )
      : undefined,
    selectActivity,
    closeActivity: () => selectActivity(null),
    hasMore: activities.hasNextPage,
    loadMore: () => {
      if (activities.hasNextPage && !activities.isFetchingNextPage) void activities.fetchNextPage();
    },
    isLoadingMore: activities.isFetchingNextPage,
    loadMoreFailed: activities.isFetchNextPageError,
    retry: () => void activities.refetch(),
  };
}

const EMPTY = { items: [], hasMore: false };
