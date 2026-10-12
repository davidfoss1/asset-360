import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { makeDeps, makeViewModelWrapper } from '../../__mocks__/viewModelWrapper';
import type { AssetDetail } from '../../services/AssetService';

import { AssetHeader } from './AssetHeader';

const ID = { space: 's', externalId: 'pump-101' };
const DETAIL: AssetDetail = {
  id: ID,
  name: 'PUMP-101',
  description: 'Feed pump for unit 1',
  parentName: 'Pump station',
  assetClass: 'Pump',
  assetType: 'Centrifugal pump',
};

function renderHeader(get: () => Promise<AssetDetail | undefined>) {
  const deps = makeDeps({ assets: { get } });
  render(<AssetHeader />, { wrapper: makeViewModelWrapper({ deps, initialState: { assetId: ID } }) });
}

describe(AssetHeader.name, () => {
  it('shows a loading skeleton first', () => {
    renderHeader(() => new Promise<AssetDetail>(() => undefined));

    expect(screen.getByRole('status', { name: 'Loading asset' })).toBeInTheDocument();
  });

  it('shows the asset name, description, class, type and parent', async () => {
    renderHeader(() => Promise.resolve(DETAIL));

    expect(await screen.findByRole('heading', { name: 'PUMP-101' })).toBeInTheDocument();
    expect(screen.getByText('Feed pump for unit 1')).toBeInTheDocument();
    expect(screen.getByText('Pump')).toBeInTheDocument();
    expect(screen.getByText('Centrifugal pump')).toBeInTheDocument();
    expect(screen.getByText(/Pump station/)).toBeInTheDocument();
  });

  it('omits class, type and parent when the asset has none', async () => {
    renderHeader(() => Promise.resolve({ id: ID, name: 'PUMP-101' }));

    await screen.findByRole('heading', { name: 'PUMP-101' });
    expect(screen.queryByText(/Parent/)).not.toBeInTheDocument();
  });

  it('shows a not-found empty state when the asset no longer exists', async () => {
    renderHeader(() => Promise.resolve(undefined));

    expect(await screen.findByText('Asset not found')).toBeInTheDocument();
  });

  it('shows an error with retry', async () => {
    renderHeader(() => Promise.reject(new Error('boom')));

    expect(await screen.findByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});
