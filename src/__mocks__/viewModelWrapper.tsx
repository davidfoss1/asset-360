import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ComponentType, ReactNode } from 'react';
import { assert, vi } from 'vitest';

import { AppDepsContext, type AppDeps } from '../deps/AppDepsContext';
import type { AssetService } from '../services/AssetService';
import type { DatapointsService } from '../services/DatapointsService';
import type { FileDownloadService } from '../services/FileDownloadService';
import type { RelatedDataService } from '../services/RelatedDataService';
import { AppStateProvider } from '../state/AppStateProvider';

type DepsOverrides = {
  assets?: Partial<AssetService>;
  related?: Partial<RelatedDataService>;
  datapoints?: Partial<DatapointsService>;
  files?: Partial<FileDownloadService>;
  openExternal?: AppDeps['openExternal'];
};

/** Service mocks that fail loudly if the unit under test calls something it should not. */
export function makeDeps(overrides: DepsOverrides = {}): AppDeps {
  return {
    assets: {
      search: vi.fn<AssetService['search']>(() => assert.fail('assets.search not implemented')),
      get: vi.fn<AssetService['get']>(() => assert.fail('assets.get not implemented')),
      ...overrides.assets,
    },
    related: {
      listTimeSeries: vi.fn<RelatedDataService['listTimeSeries']>(() => assert.fail('listTimeSeries not implemented')),
      listActivities: vi.fn<RelatedDataService['listActivities']>(() => assert.fail('listActivities not implemented')),
      listFiles: vi.fn<RelatedDataService['listFiles']>(() => assert.fail('listFiles not implemented')),
      ...overrides.related,
    },
    datapoints: {
      getSeries: vi.fn<DatapointsService['getSeries']>(() => assert.fail('getSeries not implemented')),
      getLatest: vi.fn<DatapointsService['getLatest']>(() => assert.fail('getLatest not implemented')),
      ...overrides.datapoints,
    },
    files: {
      getDownloadUrl: vi.fn<FileDownloadService['getDownloadUrl']>(() => assert.fail('getDownloadUrl not implemented')),
      ...overrides.files,
    },
    openExternal: overrides.openExternal ?? vi.fn<AppDeps['openExternal']>(() => assert.fail('openExternal not implemented')),
  };
}

type WrapperOptions = { deps: AppDeps; initialState?: Record<string, unknown> };

/** Query client + injected deps + app state, the context every ViewModel needs. */
export function makeViewModelWrapper({ deps, initialState }: WrapperOptions): ComponentType<{ children: ReactNode }> {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AppDepsContext.Provider value={deps}>
          <AppStateProvider api={null} initialState={initialState ? JSON.stringify(initialState) : undefined}>
            {children}
          </AppStateProvider>
        </AppDepsContext.Provider>
      </QueryClientProvider>
    );
  };
}
