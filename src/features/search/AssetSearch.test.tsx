import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeDeps, makeViewModelWrapper } from '../../__mocks__/viewModelWrapper';
import type { AssetDetail, AssetService, AssetSummary } from '../../services/AssetService';

import { AssetSearch } from './AssetSearch';

const PUMP: AssetSummary = { id: { space: 's', externalId: 'pump-101' }, name: 'PUMP-101', description: 'Feed pump' };
const TANK: AssetSummary = { id: { space: 's', externalId: 'tank-7' }, name: 'TANK-7' };
const PUMP_DETAIL: AssetDetail = { ...PUMP };

describe(AssetSearch.name, () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function renderSearch(options: { search?: AssetService['search']; initialState?: Record<string, unknown> } = {}) {
    const search = options.search ?? vi.fn<AssetService['search']>(() => Promise.resolve({ items: [PUMP, TANK], limited: false }));
    const get = vi.fn<AssetService['get']>(() => Promise.resolve(PUMP_DETAIL));
    const deps = makeDeps({ assets: { search, get } });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<AssetSearch debounceMs={300} />, {
      wrapper: makeViewModelWrapper({ deps, initialState: options.initialState }),
    });
    return { search, user };
  }

  it('shows a prompt on the trigger when no asset is selected', () => {
    renderSearch();

    expect(screen.getByRole('combobox', { name: 'Asset' })).toHaveTextContent('Search assets…');
  });

  it('shows the selected asset name on the trigger', async () => {
    renderSearch({ initialState: { assetId: PUMP.id } });

    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Asset' })).toHaveTextContent('PUMP-101'));
  });

  it('searches after the user stops typing, and lists the results in server order', async () => {
    // Arrange
    const { search, user } = renderSearch();
    await user.click(screen.getByRole('combobox'));

    // Act
    await user.type(await screen.findByPlaceholderText(/search by tag/i), 'pump');
    expect(search).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(300);

    // Assert
    expect(await screen.findByText('PUMP-101')).toBeInTheDocument();
    expect(search).toHaveBeenCalledWith('pump');
    const options = screen.getAllByRole('option').map((option) => option.textContent);
    expect(options[0]).toContain('PUMP-101');
    expect(options[1]).toContain('TANK-7');
  });

  it('selects an asset, closes the list and shows the asset on the trigger', async () => {
    // Arrange
    const { user } = renderSearch({ initialState: { query: 'pump' } });
    await user.click(screen.getByRole('combobox'));

    // Act
    await user.click(await screen.findByRole('option', { name: /PUMP-101/ }));

    // Assert
    await waitFor(() => expect(screen.queryByRole('option')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Asset' })).toHaveTextContent('PUMP-101'));
  });

  it('shows an empty message when nothing matches', async () => {
    const { user } = renderSearch({ search: () => Promise.resolve({ items: [], limited: false }), initialState: { query: 'zzz' } });
    await user.click(screen.getByRole('combobox'));

    expect(await screen.findByText(/no assets match/i)).toBeInTheDocument();
  });

  it('shows an error with retry when the search fails', async () => {
    // Arrange
    const search = vi.fn<AssetService['search']>().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce({ items: [PUMP], limited: false });
    const { user } = renderSearch({ search, initialState: { query: 'pump' } });
    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('button', { name: /retry/i }));

    // Assert
    expect(await screen.findByRole('option', { name: /PUMP-101/ })).toBeInTheDocument();
    expect(search).toHaveBeenCalledTimes(2);
  });

  it('asks the user to refine the search when the results were cut short', async () => {
    // Arrange
    const search = () => Promise.resolve({ items: [PUMP, TANK], limited: true });
    const { user } = renderSearch({ search, initialState: { query: 'pump' } });

    // Act
    await user.click(screen.getByRole('combobox'));

    // Assert
    expect(await screen.findByRole('option', { name: /PUMP-101/ })).toBeInTheDocument();
    expect(screen.getByText(/refine your search/i)).toBeInTheDocument();
  });

  it('does not ask for a narrower search when all results are shown', async () => {
    const { user } = renderSearch({ initialState: { query: 'pump' } });

    await user.click(screen.getByRole('combobox'));

    await screen.findByRole('option', { name: /PUMP-101/ });
    expect(screen.queryByText(/refine your search/i)).not.toBeInTheDocument();
  });

  it('explains that the top results had no match when none of a cut-short search matched', async () => {
    const { user } = renderSearch({
      search: () => Promise.resolve({ items: [], limited: true }),
      initialState: { query: 'pump 101' },
    });

    await user.click(screen.getByRole('combobox'));

    expect(await screen.findByText(/refine your search/i)).toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });
});
