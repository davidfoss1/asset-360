import type { HostAppAPI } from '@cognite/app-sdk';
import { useCallback, useMemo, useState, type ReactNode } from 'react';

import type { InstanceRef } from '../lib/properties';

import { parseAppState, serializeAppState, type AppState, type AssetTab } from './appState';
import { AppStateContext, type AppStateContextValue } from './AppStateContext';

export type AppStateApi = Pick<HostAppAPI, 'syncInternalState'>;

type AppStateProviderProps = {
  api: AppStateApi | null;
  /** The string the host extracted from the URL on load. Read once, so render this only after connecting. */
  initialState?: string;
  children: ReactNode;
};

/**
 * Owns the host-synced UI state (search query, selected asset, time series and file). Every change is
 * pushed to the host so reloads and shared links restore the same view.
 */
export function AppStateProvider({ api, initialState, children }: AppStateProviderProps) {
  const [state, setState] = useState<AppState>(() => parseAppState(initialState));

  const update = useCallback(
    (patch: Partial<AppState>) => {
      const next = { ...state, ...patch };
      setState(next);
      // Best effort: failing to update the URL must not break the view the user is looking at.
      api?.syncInternalState(serializeAppState(next)).catch(() => undefined);
    },
    [api, state]
  );

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      setQuery: (query: string) => update({ query }),
      selectAsset: (assetId: InstanceRef | null) =>
        update({ assetId, query: '', timeSeriesId: null, fileId: null, activityId: null }),
      selectTimeSeries: (timeSeriesId: InstanceRef | null) => update({ timeSeriesId }),
      selectFile: (fileId: InstanceRef | null) => update({ fileId }),
      selectActivity: (activityId: InstanceRef | null) => update({ activityId }),
      selectTab: (tab: AssetTab) => update({ tab }),
    }),
    [state, update]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
