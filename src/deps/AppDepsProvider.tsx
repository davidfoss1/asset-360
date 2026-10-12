import { useCogniteSdk } from '@cognite/app-sdk/react';
import { useMemo, type ReactNode } from 'react';

import { AppDepsContext, type AppDeps } from './AppDepsContext';
import { createAppDeps, type AppHost } from './createAppDeps';

type AppDepsProviderProps = {
  host: AppHost;
  /** Replaces parts of the real dependencies. Used by tests to mock at the service boundary. */
  deps?: Partial<AppDeps>;
  children: ReactNode;
};

/** Provides the app dependencies. Must sit inside CogniteSdkProvider. */
export function AppDepsProvider({ host, deps: override, children }: AppDepsProviderProps) {
  const client = useCogniteSdk();
  const defaults = useMemo(() => createAppDeps(client, host), [client, host]);
  const value = useMemo(() => ({ ...defaults, ...override }), [defaults, override]);

  return <AppDepsContext.Provider value={value}>{children}</AppDepsContext.Provider>;
}
