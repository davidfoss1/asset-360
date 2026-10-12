import { createContext } from 'react';

import type { AssetService } from '../services/AssetService';
import type { DatapointsService } from '../services/DatapointsService';
import type { FileDownloadService } from '../services/FileDownloadService';
import type { RelatedDataService } from '../services/RelatedDataService';

/** The services and host actions the ViewModels depend on, injected so tests can replace them. */
export type AppDeps = {
  assets: AssetService;
  related: RelatedDataService;
  datapoints: DatapointsService;
  files: FileDownloadService;
  /** Opens an https URL in a new browser tab. */
  openExternal: (url: string) => Promise<void>;
};

export const AppDepsContext = createContext<AppDeps | null>(null);
