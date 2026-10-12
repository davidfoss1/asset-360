import type { HostAppAPI } from '@cognite/app-sdk';
import { CogniteClient } from '@cognite/sdk';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps, ComponentType, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { stubLayoutSize } from './__mocks__/stubLayout';
import { makeDeps } from './__mocks__/viewModelWrapper';
import App from './App';
import type { AppDeps } from './deps/AppDepsContext';
import type { AssetDetail, AssetSummary } from './services/AssetService';
import type { ActivityItem, FileItem, TimeSeriesItem } from './services/RelatedDataService';

type SdkDeps = NonNullable<ComponentProps<typeof App>['deps']>;
type AppApi = Pick<HostAppAPI, 'syncInternalState' | 'navigateExternal'>;

const PUMP: AssetSummary = { id: { space: 's', externalId: 'pump-101' }, name: 'PUMP-101', description: 'Feed pump' };
const PUMP_DETAIL: AssetDetail = { ...PUMP, assetClass: 'Pump' };
const PRESSURE: TimeSeriesItem = { id: { space: 's', externalId: 'pressure' }, name: 'Pressure', type: 'numeric', unit: 'bar' };
const SEAL: ActivityItem = { id: { space: 's', externalId: 'wo-1' }, name: 'Replace seal' };
const PID: FileItem = { id: { space: 's', externalId: 'pid' }, name: 'P&ID.pdf', isUploaded: true };

describe('App', () => {
  let restoreLayout: () => void;

  beforeEach(() => {
    restoreLayout = stubLayoutSize();
  });

  afterEach(() => {
    restoreLayout();
  });

  it('shows a loading state while connecting to the host', () => {
    render(<App deps={makeSdkDeps()} connectToHostApp={() => new Promise<never>(() => undefined)} />);

    expect(screen.getByText('Loading project...')).toBeInTheDocument();
  });

  it('shows an error when the host connection fails', async () => {
    render(<App deps={makeSdkDeps()} connectToHostApp={() => Promise.reject(new Error('no host'))} />);

    expect(await screen.findByText('Failed to connect to Fusion host')).toBeInTheDocument();
  });

  it('starts with a prompt to search for an asset', async () => {
    renderApp();

    expect(await screen.findByText('Search for an asset to begin')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Asset 360' })).toBeInTheDocument();
  });

  it('finds an asset by tag and shows its time series, activities and files together', async () => {
    // Arrange
    const { api } = renderApp();
    const user = userEvent.setup();

    // Act
    await searchAndSelect(user, 'pump');

    // Assert
    expect(await screen.findByRole('heading', { name: 'PUMP-101' })).toBeInTheDocument();
    expect(await screen.findByRole('combobox', { name: 'Time series' })).toHaveTextContent('Pressure');
    expect(await screen.findByText(/Latest: 4.2 bar/)).toBeInTheDocument();
    expect(await screen.findByText('Replace seal')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Files' }));
    expect(await screen.findByText('P&ID.pdf')).toBeInTheDocument();
    expect(api.syncInternalState).toHaveBeenLastCalledWith(expect.stringContaining('"externalId":"pump-101"'));
  });

  it('opens a file from the files tab in a new browser tab', async () => {
    // Arrange
    const { api } = renderApp({ initialState: { assetId: PUMP.id, tab: 'files' } });
    const user = userEvent.setup();
    await screen.findByText('P&ID.pdf');

    // Act
    await user.click(screen.getByRole('button', { name: 'Open P&ID.pdf' }));
    await user.click(await screen.findByRole('button', { name: /open in new tab/i }));

    // Assert
    expect(api.navigateExternal).toHaveBeenCalledWith({ url: 'https://files.test/pid', openInNewTab: true });
  });

  it('shows a no-results state when nothing matches', async () => {
    renderApp({ assets: { search: () => Promise.resolve({ items: [], limited: false }) } });
    const user = userEvent.setup();

    await user.click(await screen.findByRole('combobox', { name: 'Asset' }));
    await user.type(screen.getByPlaceholderText(/search by tag/i), 'zzz');

    expect(await screen.findByText(/no assets match/i)).toBeInTheDocument();
  });

  it('shows an empty state for an asset with no time series, activities or files', async () => {
    renderApp({
      related: {
        listTimeSeries: () => Promise.resolve([]),
        listActivities: () => Promise.resolve({ items: [], hasMore: false }),
        listFiles: () => Promise.resolve({ items: [] }),
      },
      initialState: { assetId: PUMP.id },
    });
    const user = userEvent.setup();

    expect(await screen.findByText('No time series for this asset')).toBeInTheDocument();
    expect(await screen.findByText('No activities for this asset')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Files' }));
    expect(await screen.findByText('No files for this asset')).toBeInTheDocument();
  });

  it('keeps the other sections working when one section fails, and retries just that one', async () => {
    // Arrange
    const listActivities = vi
      .fn<AppDeps['related']['listActivities']>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({ items: [SEAL], hasMore: false });
    renderApp({ related: { listActivities }, initialState: { assetId: PUMP.id } });
    const user = userEvent.setup();

    // Assert: the failed section shows an error, the rest still render
    expect(await screen.findByText(/could not load activities/i)).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'PUMP-101' })).toBeInTheDocument();
    expect(await screen.findByText(/Latest: 4.2 bar/)).toBeInTheDocument();

    // Act
    await user.click(screen.getByRole('button', { name: /retry/i }));

    // Assert
    expect(await screen.findByText('Replace seal')).toBeInTheDocument();
  });

  it('restores the selected asset and tab from the saved state', async () => {
    renderApp({ initialState: { assetId: PUMP.id, tab: 'files' } });

    expect(await screen.findByRole('heading', { name: 'PUMP-101' })).toBeInTheDocument();
    expect(await screen.findByText('P&ID.pdf')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true');
  });

  it('ignores malformed saved state', async () => {
    renderApp({ rawInitialState: '{broken' });

    expect(await screen.findByText('Search for an asset to begin')).toBeInTheDocument();
  });
});

type RenderOptions = {
  assets?: Partial<AppDeps['assets']>;
  related?: Partial<AppDeps['related']>;
  initialState?: Record<string, unknown>;
  rawInitialState?: string;
};

function renderApp({ assets, related, initialState, rawInitialState }: RenderOptions = {}) {
  const api: AppApi = {
    syncInternalState: vi.fn<HostAppAPI['syncInternalState']>(() => Promise.resolve(true)),
    navigateExternal: vi.fn<HostAppAPI['navigateExternal']>(() => Promise.resolve(true)),
  };
  const appDeps = makeDeps({
    assets: { search: () => Promise.resolve({ items: [PUMP], limited: false }), get: () => Promise.resolve(PUMP_DETAIL), ...assets },
    related: {
      listTimeSeries: () => Promise.resolve([PRESSURE]),
      listActivities: () => Promise.resolve({ items: [SEAL], hasMore: false }),
      listFiles: () => Promise.resolve({ items: [PID] }),
      ...related,
    },
    files: { getDownloadUrl: () => Promise.resolve('https://files.test/pid') },
    datapoints: {
      getLatest: () => Promise.resolve({ timestamp: 1000, value: 4.2 }),
      getSeries: () => Promise.resolve([{ timestamp: 1000, value: 4.2 }]),
    },
  });
  const state = rawInitialState ?? (initialState ? JSON.stringify(initialState) : undefined);

  render(
    <App
      deps={makeSdkDeps()}
      appDeps={{ assets: appDeps.assets, related: appDeps.related, datapoints: appDeps.datapoints, files: appDeps.files }}
      connectToHostApp={() => Promise.resolve({ api, initialState: state })}
    />,
    { wrapper: makeQueryWrapper() }
  );
  return { api };
}

// main.tsx provides the QueryClient in the real app.
function makeQueryWrapper(): ComponentType<{ children: ReactNode }> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function QueryWrapper({ children }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

async function searchAndSelect(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.click(await screen.findByRole('combobox', { name: 'Asset' }));
  await user.type(screen.getByPlaceholderText(/search by tag/i), text);
  const option = await screen.findByRole('option', { name: /PUMP-101/ });
  await user.click(within(option).getByText('PUMP-101'));
  await waitFor(() => expect(screen.queryByRole('option')).not.toBeInTheDocument());
}

function makeSdkDeps(): SdkDeps {
  return {
    connectToHostApp: vi.fn<SdkDeps['connectToHostApp']>(() =>
      Promise.resolve({
        api: {
          getProject: vi.fn<HostAppAPI['getProject']>(() => Promise.resolve('publicdatacdm')),
          getBaseUrl: vi.fn<HostAppAPI['getBaseUrl']>(() => Promise.resolve('https://cognite.test')),
          getAccessToken: vi.fn<HostAppAPI['getAccessToken']>(() => Promise.resolve('test-token')),
          getAppId: vi.fn<HostAppAPI['getAppId']>(() => Promise.resolve('test-app-id')),
        } as Partial<HostAppAPI> as HostAppAPI,
      })
    ),
    createClient: vi.fn<SdkDeps['createClient']>((config) => new CogniteClient(config)),
  };
}
