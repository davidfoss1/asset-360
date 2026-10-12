import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { stubLayoutSize } from '../../__mocks__/stubLayout';
import { makeDeps, makeViewModelWrapper } from '../../__mocks__/viewModelWrapper';
import type { ActivityItem, RelatedDataService } from '../../services/RelatedDataService';

import { ActivitiesSection } from './ActivitiesSection';

const ASSET = { space: 's', externalId: 'pump-101' };
const SEAL: ActivityItem = {
  id: { space: 's', externalId: 'wo-1' },
  name: 'Replace seal',
  description: 'Mechanical seal leaking',
  startTime: Date.UTC(2026, 8, 1, 8, 0),
  endTime: Date.UTC(2026, 8, 1, 12, 0),
};
const INSPECT: ActivityItem = { id: { space: 's', externalId: 'wo-2' }, name: 'Inspect bearings' };

function renderSection(listActivities: RelatedDataService['listActivities']) {
  const deps = makeDeps({ related: { listActivities } });
  render(<ActivitiesSection />, { wrapper: makeViewModelWrapper({ deps, initialState: { assetId: ASSET } }) });
}

describe(ActivitiesSection.name, () => {
  let restoreLayout: () => void;

  beforeEach(() => {
    restoreLayout = stubLayoutSize();
  });

  afterEach(() => {
    restoreLayout();
  });

  it('shows a loading skeleton first', () => {
    renderSection(() => new Promise<ActivityItem[]>(() => undefined));

    expect(screen.getByRole('status', { name: 'Loading activities' })).toBeInTheDocument();
  });

  it('lists activities in a table with their dates', async () => {
    // Arrange / Act
    renderSection(() => Promise.resolve([SEAL, INSPECT]));

    // Assert
    expect(await screen.findByText('Replace seal')).toBeInTheDocument();
    expect(screen.getByText('Mechanical seal leaking')).toBeInTheDocument();
    expect(screen.getByText('Inspect bearings')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Activities' })).toBeInTheDocument();
  });

  it('shows an empty state naming what is missing', async () => {
    renderSection(() => Promise.resolve([]));

    expect(await screen.findByText('No activities for this asset')).toBeInTheDocument();
  });

  it('shows an error with retry that loads again', async () => {
    // Arrange
    const listActivities = vi
      .fn<RelatedDataService['listActivities']>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce([SEAL]);
    renderSection(listActivities);

    // Act
    (await screen.findByRole('button', { name: /retry/i })).click();

    // Assert
    await waitFor(() => expect(screen.getByText('Replace seal')).toBeInTheDocument());
  });
});
