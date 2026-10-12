import { useQuery } from '@tanstack/react-query';

import { useAppDeps } from '../../deps/useAppDeps';
import { toLoadStatus, type LoadStatus } from '../../lib/loadStatus';
import type { InstanceRef } from '../../lib/properties';
import type { AssetSummary } from '../../services/AssetService';
import { useAppState } from '../../state/useAppState';

export type SearchViewModel = {
  query: string;
  setQuery: (query: string) => void;
  status: LoadStatus;
  results: AssetSummary[];
  selectedAssetId: InstanceRef | null;
  selectAsset: (assetId: InstanceRef) => void;
  retry: () => void;
};

export function useSearchViewModel(): SearchViewModel {
  const { assets } = useAppDeps();
  const { state, setQuery, selectAsset } = useAppState();
  const trimmed = state.query.trim();

  const search = useQuery({
    queryKey: ['assets', 'search', trimmed],
    queryFn: () => assets.search(trimmed),
    enabled: trimmed !== '',
  });

  return {
    query: state.query,
    setQuery,
    status: toLoadStatus(search, (results) => results.length === 0),
    results: search.data ?? [],
    selectedAssetId: state.assetId,
    selectAsset,
    retry: () => void search.refetch(),
  };
}
