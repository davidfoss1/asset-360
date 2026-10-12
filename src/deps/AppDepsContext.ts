import { createContext } from 'react';

import type { AssetService } from '../services/AssetService';
import type { DatapointsService } from '../services/DatapointsService';
import type { RelatedDataService } from '../services/RelatedDataService';

/** The services the ViewModels depend on, injected so tests can replace them. */
export type AppDeps = {
  assets: AssetService;
  related: RelatedDataService;
  datapoints: DatapointsService;
};

export const AppDepsContext = createContext<AppDeps | null>(null);
