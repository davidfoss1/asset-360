import { createContext } from 'react';

import type { InstanceRef } from '../lib/properties';

import type { AppState, AssetTab } from './appState';

export type AppStateContextValue = {
  state: AppState;
  setQuery: (query: string) => void;
  /**
   * Selecting an asset also clears the search that found it, and the selected time series, file and
   * activity, which belong to the previous asset. One update, since two in a row would drop the first.
   */
  selectAsset: (assetId: InstanceRef | null) => void;
  selectTimeSeries: (timeSeriesId: InstanceRef | null) => void;
  selectFile: (fileId: InstanceRef | null) => void;
  selectActivity: (activityId: InstanceRef | null) => void;
  selectTab: (tab: AssetTab) => void;
};

export const AppStateContext = createContext<AppStateContextValue | null>(null);
