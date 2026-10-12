import { useQuery } from '@tanstack/react-query';

import { useAppDeps } from '../../deps/useAppDeps';
import { toLoadStatus, type LoadStatus } from '../../lib/loadStatus';
import type { ActivityItem } from '../../services/RelatedDataService';
import { useAppState } from '../../state/useAppState';

export type ActivitiesViewModel = {
  status: LoadStatus;
  activities: ActivityItem[];
  retry: () => void;
};

export function useActivitiesViewModel(): ActivitiesViewModel {
  const { related } = useAppDeps();
  const { state } = useAppState();
  const assetId = state.assetId;

  const activities = useQuery({
    queryKey: ['activities', assetId?.space, assetId?.externalId],
    queryFn: () => (assetId ? related.listActivities(assetId) : Promise.resolve([])),
    enabled: assetId !== null,
  });

  return {
    status: toLoadStatus(activities, (items) => items.length === 0),
    activities: activities.data ?? [],
    retry: () => void activities.refetch(),
  };
}
