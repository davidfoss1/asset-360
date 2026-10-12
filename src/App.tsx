import { connectToHostApp as connectToHostAppImpl } from '@cognite/app-sdk';
import { CogniteSdkProvider } from '@cognite/app-sdk/react';
// Import per-component, not from the `@cognite/aura/components` barrel: the
// barrel pulls in Aura's whole dependency graph (including large libraries like
// mermaid and shiki), which slows the build and can exhaust memory in CI.
import { Alert, AlertDescription } from '@cognite/aura/components/alert';
import { Card, CardContent } from '@cognite/aura/components/card';
import { Loader } from '@cognite/aura/components/loader';
import { useEffect, useState } from 'react';
import type { ComponentProps } from 'react';

import type { AppDeps } from './deps/AppDepsContext';
import { AppDepsProvider } from './deps/AppDepsProvider';
import type { AppHost } from './deps/createAppDeps';
import { AssetSearch } from './features/search/AssetSearch';
import { AssetWorkspace } from './features/workspace/AssetWorkspace';
import { AppStateProvider, type AppStateApi } from './state/AppStateProvider';

type AppConnectResult = { api: AppStateApi & AppHost; initialState?: string };

const loadingFallback = (
  <main className="min-h-screen bg-muted/50 text-foreground">
    <section className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center p-4 sm:p-8">
      <div className="mx-auto w-full max-w-sm">
        <Card aria-label="Loading project" aria-live="polite">
          <CardContent>
            <div className="inline-flex items-center gap-3 text-muted-foreground">
              <Loader size={20} />
              <span>Loading project...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  </main>
);

const errorFallback = (
  <main className="min-h-screen bg-muted/50 text-foreground">
    <section className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center p-4 sm:p-8">
      <div className="mx-auto w-full max-w-sm">
        <Alert>
          <AlertDescription>Failed to connect to Fusion host</AlertDescription>
        </Alert>
      </div>
    </section>
  </main>
);

type AppProps = {
  deps?: ComponentProps<typeof CogniteSdkProvider>['deps'];
  /** Replaces parts of the real dependencies, so tests can mock at the service boundary. */
  appDeps?: Partial<AppDeps>;
  connectToHostApp?: () => Promise<AppConnectResult>;
};

function App({
  deps,
  appDeps,
  connectToHostApp = deps?.connectToHostApp ?? connectToHostAppImpl,
}: AppProps) {
  const [connection, setConnection] = useState<AppConnectResult | 'failed' | null>(null);

  useEffect(() => {
    let cancelled = false;
    connectToHostApp().then(
      (result) => {
        if (!cancelled) setConnection(result);
      },
      () => {
        if (!cancelled) setConnection('failed');
      }
    );
    return () => {
      cancelled = true;
    };
  }, [connectToHostApp]);

  if (connection === 'failed') return errorFallback;

  return (
    <CogniteSdkProvider loadingFallback={loadingFallback} errorFallback={errorFallback} deps={deps}>
      {connection === null ? (
        loadingFallback
      ) : (
        // initialState is read once when the provider mounts, so wait until we have it.
        <AppDepsProvider host={connection.api} deps={appDeps}>
          <AppStateProvider api={connection.api} initialState={connection.initialState}>
            <main className="min-h-screen bg-muted/50 text-foreground">
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-8">
                <header className="flex flex-col gap-4">
                  <h1 className="text-3xl font-medium">Asset 360</h1>
                  <div className="w-full max-w-xl">
                    <AssetSearch />
                  </div>
                </header>
                <Card>
                  <CardContent>
                    <AssetWorkspace />
                  </CardContent>
                </Card>
              </div>
            </main>
          </AppStateProvider>
        </AppDepsProvider>
      )}
    </CogniteSdkProvider>
  );
}

export default App;
