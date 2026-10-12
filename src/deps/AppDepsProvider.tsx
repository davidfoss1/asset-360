import { useCogniteSdk } from '@cognite/app-sdk/react';
import { useMemo, type ReactNode } from 'react';

import { createAssetService } from '../services/AssetService';
import { createDatapointsService } from '../services/DatapointsService';
import { createRelatedDataService } from '../services/RelatedDataService';

import { AppDepsContext, type AppDeps } from './AppDepsContext';

type AppDepsProviderProps = {
  /** Replaces the real services. Used by tests to mock at the service boundary. */
  deps?: AppDeps;
  children: ReactNode;
};

/** Wires the real services to the authenticated SDK client. Must sit inside CogniteSdkProvider. */
export function AppDepsProvider({ deps: override, children }: AppDepsProviderProps) {
  const client = useCogniteSdk();
  const defaults = useMemo<AppDeps>(
    () => ({
      assets: createAssetService(client),
      related: createRelatedDataService(client),
      datapoints: createDatapointsService(client),
    }),
    [client]
  );

  return <AppDepsContext.Provider value={override ?? defaults}>{children}</AppDepsContext.Provider>;
}
