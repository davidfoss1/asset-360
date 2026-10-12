import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { stubLayoutSize } from '../../__mocks__/stubLayout';
import { makeDeps, makeViewModelWrapper } from '../../__mocks__/viewModelWrapper';
import type { FileItem, FilePage, RelatedDataService } from '../../services/RelatedDataService';

import { FilesSection } from './FilesSection';

const ASSET = { space: 's', externalId: 'pump-101' };
const PID: FileItem = {
  id: { space: 's', externalId: 'pid' },
  name: 'P&ID.pdf',
  mimeType: 'application/pdf',
  directory: '/diagrams',
  isUploaded: true,
};
const PENDING: FileItem = { id: { space: 's', externalId: 'pending' }, name: 'Pending.pdf', isUploaded: false };

function StubPreview({ file }: { file: FileItem }) {
  return <div data-testid="preview">previewing {file.name}</div>;
}

describe(FilesSection.name, () => {
  let restoreLayout: () => void;

  beforeEach(() => {
    restoreLayout = stubLayoutSize();
  });

  afterEach(() => {
    restoreLayout();
  });

  function renderSection(
    listFiles: RelatedDataService['listFiles'],
    initialState: Record<string, unknown> = { assetId: ASSET }
  ) {
    const deps = makeDeps({ related: { listFiles } });
    render(<FilesSection Preview={StubPreview} />, { wrapper: makeViewModelWrapper({ deps, initialState }) });
  }

  it('shows a loading skeleton first', () => {
    renderSection(() => new Promise<FilePage>(() => undefined));

    expect(screen.getByRole('status', { name: 'Loading files' })).toBeInTheDocument();
  });

  it('lists files in a table', async () => {
    renderSection(() => Promise.resolve(page([PID, PENDING])));

    expect(await screen.findByText('P&ID.pdf')).toBeInTheDocument();
    expect(screen.getByText('/diagrams')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Files' })).toBeInTheDocument();
  });

  it('opens a file in the preview, and closes it again', async () => {
    // Arrange
    renderSection(() => Promise.resolve(page([PID])));
    await screen.findByText('P&ID.pdf');

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Open P&ID.pdf' }));

    // Assert
    expect(await screen.findByTestId('preview')).toHaveTextContent('previewing P&ID.pdf');
    await userEvent.click(screen.getByRole('button', { name: /close preview/i }));
    expect(screen.queryByTestId('preview')).not.toBeInTheDocument();
  });

  it('restores the open file from saved state', async () => {
    renderSection(() => Promise.resolve(page([PID])), { assetId: ASSET, fileId: PID.id });

    expect(await screen.findByTestId('preview')).toHaveTextContent('previewing P&ID.pdf');
  });

  it('cannot open a file that has not been uploaded', async () => {
    renderSection(() => Promise.resolve(page([PENDING])));
    await screen.findByText('Pending.pdf');

    expect(screen.getByRole('button', { name: 'Open Pending.pdf' })).toBeDisabled();
    expect(screen.getByText('Not uploaded')).toBeInTheDocument();
  });

  it('shows an empty state naming what is missing', async () => {
    renderSection(() => Promise.resolve(page([])));

    expect(await screen.findByText('No files for this asset')).toBeInTheDocument();
  });

  it('shows an error with retry that loads again', async () => {
    // Arrange
    const listFiles = vi
      .fn<RelatedDataService['listFiles']>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(page([PID]));
    renderSection(listFiles);

    // Act
    await userEvent.click(await screen.findByRole('button', { name: /retry/i }));

    // Assert
    await waitFor(() => expect(screen.getByText('P&ID.pdf')).toBeInTheDocument());
    expect(within(screen.getByRole('table', { name: 'Files' })).getByText('P&ID.pdf')).toBeInTheDocument();
  });

  it('has no Load more button on the last page', async () => {
    renderSection(() => Promise.resolve(page([PID])));
    await screen.findByText('P&ID.pdf');

    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('loads and shows the next page when Load more is pressed', async () => {
    // Arrange
    const listFiles = vi
      .fn<RelatedDataService['listFiles']>()
      .mockResolvedValueOnce(page([PID], 'cursor-2'))
      .mockResolvedValueOnce(page([PENDING]));
    renderSection(listFiles);

    // Act
    await userEvent.click(await screen.findByRole('button', { name: 'Load more' }));

    // Assert
    expect(await screen.findByText('Pending.pdf')).toBeInTheDocument();
    expect(screen.getByText('P&ID.pdf')).toBeInTheDocument();
    expect(listFiles).toHaveBeenLastCalledWith(ASSET, 'cursor-2');
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument());
  });

  it('says so when loading more fails, and lets the user try again', async () => {
    // Arrange
    const listFiles = vi
      .fn<RelatedDataService['listFiles']>()
      .mockResolvedValueOnce(page([PID], 'cursor-2'))
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(page([PENDING]));
    renderSection(listFiles);
    await userEvent.click(await screen.findByRole('button', { name: 'Load more' }));
    expect(await screen.findByText('Could not load more files.')).toBeInTheDocument();

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));

    // Assert
    expect(await screen.findByText('Pending.pdf')).toBeInTheDocument();
  });
});

function page(items: FileItem[], nextCursor?: string): FilePage {
  return { items, nextCursor };
}
