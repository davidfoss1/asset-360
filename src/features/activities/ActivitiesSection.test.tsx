import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { stubLayoutSize } from '../../__mocks__/stubLayout';
import { makeDeps, makeViewModelWrapper } from '../../__mocks__/viewModelWrapper';
import type { ActivityItem, ActivityList, RelatedDataService } from '../../services/RelatedDataService';

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
    renderSection(() => new Promise<ActivityList>(() => undefined));

    expect(screen.getByRole('status', { name: 'Loading activities' })).toBeInTheDocument();
  });

  it('lists activities in a table with their dates', async () => {
    // Arrange / Act
    renderSection(() => Promise.resolve(list([SEAL, INSPECT])));

    // Assert
    expect(await screen.findByText('Replace seal')).toBeInTheDocument();
    expect(screen.getByText('Mechanical seal leaking')).toBeInTheDocument();
    expect(screen.getByText('Inspect bearings')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Activities' })).toBeInTheDocument();
  });

  it('shows an empty state naming what is missing', async () => {
    renderSection(() => Promise.resolve(list([])));

    expect(await screen.findByText('No activities for this asset')).toBeInTheDocument();
  });

  it('shows an error with retry that loads again', async () => {
    // Arrange
    const listActivities = vi
      .fn<RelatedDataService['listActivities']>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(list([SEAL]));
    renderSection(listActivities);

    // Act
    (await screen.findByRole('button', { name: /retry/i })).click();

    // Assert
    await waitFor(() => expect(screen.getByText('Replace seal')).toBeInTheDocument());
  });

  it('has no Load more button when everything is shown', async () => {
    renderSection(() => Promise.resolve(list([SEAL, INSPECT])));
    await screen.findByText('Replace seal');

    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('loads and shows more activities when Load more is pressed', async () => {
    // Arrange
    const listActivities = vi
      .fn<RelatedDataService['listActivities']>()
      .mockResolvedValueOnce(list([SEAL], true))
      .mockResolvedValueOnce(list([SEAL, INSPECT]));
    renderSection(listActivities);

    // Act
    await userEvent.click(await screen.findByRole('button', { name: 'Load more' }));

    // Assert
    expect(await screen.findByText('Inspect bearings')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument());
  });

  it('disables the button while more are loading', async () => {
    // Arrange
    const listActivities = vi
      .fn<RelatedDataService['listActivities']>()
      .mockResolvedValueOnce(list([SEAL], true))
      .mockReturnValueOnce(new Promise<ActivityList>(() => undefined));
    renderSection(listActivities);

    // Act
    await userEvent.click(await screen.findByRole('button', { name: 'Load more' }));

    // Assert
    expect(await screen.findByRole('button', { name: 'Loading more…' })).toBeDisabled();
    expect(screen.getByText('Replace seal')).toBeInTheDocument();
  });

  it('says so when loading more fails, and lets the user try again', async () => {
    // Arrange
    const listActivities = vi
      .fn<RelatedDataService['listActivities']>()
      .mockResolvedValueOnce(list([SEAL], true))
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(list([SEAL, INSPECT]));
    renderSection(listActivities);
    await userEvent.click(await screen.findByRole('button', { name: 'Load more' }));
    expect(await screen.findByText('Could not load more activities.')).toBeInTheDocument();
    expect(screen.getByText('Replace seal')).toBeInTheDocument();

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));

    // Assert
    expect(await screen.findByText('Inspect bearings')).toBeInTheDocument();
  });
});

function list(items: ActivityItem[], hasMore = false): ActivityList {
  return { items, hasMore };
}
