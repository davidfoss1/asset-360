import { useQuery } from '@tanstack/react-query';

import { useAppDeps } from '../../deps/useAppDeps';
import { toLoadStatus, type LoadStatus } from '../../lib/loadStatus';
import type { AssetDetail } from '../../services/AssetService';
import { useAppState } from '../../state/useAppState';

export type AssetViewModel = {
  status: LoadStatus;
  asset: AssetDetail | undefined;
  retry: () => void;
};

export function useAssetViewModel(): AssetViewModel {
  const { assets } = useAppDeps();
  const { state } = useAppState();
  const assetId = state.assetId;

  const asset = useQuery({
    queryKey: ['asset', assetId?.space, assetId?.externalId],
    // react-query rejects `undefined` results, so "not found" becomes null.
    queryFn: async () => (assetId ? ((await assets.get(assetId)) ?? null) : null),
    enabled: assetId !== null,
  });

  return {
    status: toLoadStatus(asset, (data) => data === null),
    asset: asset.data ?? undefined,
    retry: () => void asset.refetch(),
  };
}
