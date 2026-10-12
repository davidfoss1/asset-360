import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { stubLayoutSize } from '../../__mocks__/stubLayout';
import { makeDeps, makeViewModelWrapper } from '../../__mocks__/viewModelWrapper';
import type { ActivityItem } from '../../services/RelatedDataService';

import { AssetWorkspace } from './AssetWorkspace';

const ASSET = { space: 's', externalId: 'pump-101' };
const REPLACE_SEAL: ActivityItem = { id: { space: 's', externalId: 'wo-1' }, name: 'Replace seal' };
const PRESSURE = { id: { space: 's', externalId: 'pressure' }, name: 'Pressure', type: 'numeric' as const };

function renderWorkspace(initialState: Record<string, unknown> = {}, activities: ActivityItem[] = [REPLACE_SEAL]) {
  const deps = makeDeps({
    assets: { get: () => Promise.resolve({ id: ASSET, name: 'PUMP-101' }) },
    related: {
      listTimeSeries: () => Promise.resolve([PRESSURE]),
      listActivities: () => Promise.resolve({ items: activities, hasMore: false }),
      listFiles: () =>
        Promise.resolve({ items: [{ id: { space: 's', externalId: 'pid' }, name: 'P&ID.pdf', isUploaded: true }] }),
    },
    datapoints: { getSeries: () => Promise.resolve([{ timestamp: 1000, value: 3 }]) },
  });
  return render(<AssetWorkspace />, { wrapper: makeViewModelWrapper({ deps, initialState }) });
}

describe(AssetWorkspace.name, () => {
  let restoreLayout: () => void;

  beforeEach(() => {
    restoreLayout = stubLayoutSize();
  });

  afterEach(() => {
    restoreLayout();
  });

  it('prompts the user to search when no asset is selected', () => {
    renderWorkspace();

    expect(screen.getByText('Search for an asset to begin')).toBeInTheDocument();
  });

  it('shows the asset, its time series and the activities tab together', async () => {
    renderWorkspace({ assetId: ASSET });

    expect(await screen.findByRole('heading', { name: 'PUMP-101' })).toBeInTheDocument();
    expect(await screen.findByRole('combobox', { name: 'Time series' })).toHaveTextContent('Pressure');
    expect(await screen.findByText('Replace seal')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Activities' })).toHaveAttribute('aria-selected', 'true');
  });

  it('fills the width of its container, so a wide table cannot resize the chart', async () => {
    // Arrange: Aura's CardContent is `items-start`, so children shrink to their content unless told
    // otherwise. happy-dom cannot measure layout, so this guards the class that prevents it.
    const { container } = renderWorkspace({ assetId: ASSET });
    await screen.findByText('Replace seal');

    // Assert
    expect(container.firstElementChild).toHaveClass('w-full', 'min-w-0');
  });

  it('switches to the files tab', async () => {
    // Arrange
    renderWorkspace({ assetId: ASSET });
    await screen.findByText('Replace seal');

    // Act
    await userEvent.click(screen.getByRole('tab', { name: 'Files' }));

    // Assert
    expect(await screen.findByText('P&ID.pdf')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true');
  });

  it('restores the files tab from saved state', async () => {
    renderWorkspace({ assetId: ASSET, tab: 'files' });

    expect(await screen.findByText('P&ID.pdf')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true');
  });

  it('contains a crash in one section so the rest of the page keeps working', async () => {
    // Arrange: a start time beyond the range a Date can hold makes the table throw while rendering.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const outOfRange = { ...REPLACE_SEAL, startTime: Number.MAX_SAFE_INTEGER };

    // Act
    renderWorkspace({ assetId: ASSET }, [outOfRange]);

    // Assert
    expect(await screen.findByText('Something went wrong in activities')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'PUMP-101' })).toBeInTheDocument();
    expect(await screen.findByRole('combobox', { name: 'Time series' })).toHaveTextContent('Pressure');
    await userEvent.click(screen.getByRole('tab', { name: 'Files' }));
    expect(await screen.findByText('P&ID.pdf')).toBeInTheDocument();
    vi.restoreAllMocks();
  });
});
