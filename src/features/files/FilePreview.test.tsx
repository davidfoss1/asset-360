import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { makeDeps, makeViewModelWrapper } from '../../__mocks__/viewModelWrapper';
import type { FileDownloadService } from '../../services/FileDownloadService';
import type { FileItem } from '../../services/RelatedDataService';

import { FilePreview } from './FilePreview';

const IMAGE: FileItem = { id: { space: 's', externalId: 'photo' }, name: 'Pump photo.png', mimeType: 'image/png', isUploaded: true };
const PDF: FileItem = { id: { space: 's', externalId: 'pid' }, name: 'P&ID.pdf', mimeType: 'application/pdf', isUploaded: true };

function renderPreview(file: FileItem, getDownloadUrl: FileDownloadService['getDownloadUrl'] = () => Promise.resolve('https://files.test/a')) {
  const openExternal = vi.fn<(url: string) => Promise<void>>(() => Promise.resolve());
  const deps = makeDeps({ files: { getDownloadUrl }, openExternal });
  render(<FilePreview file={file} />, { wrapper: makeViewModelWrapper({ deps }) });
  return { openExternal };
}

describe(FilePreview.name, () => {
  it('shows a loading skeleton while fetching the link', () => {
    renderPreview(IMAGE, () => new Promise<string>(() => undefined));

    expect(screen.getByRole('status', { name: 'Loading preview' })).toBeInTheDocument();
  });

  it('shows an image inline', async () => {
    renderPreview(IMAGE);

    const image = await screen.findByRole('img', { name: 'Pump photo.png' });
    expect(image).toHaveAttribute('src', 'https://files.test/a');
  });

  it('explains that a PDF opens in a new tab, and has no inline image', async () => {
    renderPreview(PDF);

    expect(await screen.findByText(/opens in a new browser tab/i)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('opens the file in a new tab from the button', async () => {
    // Arrange
    const { openExternal } = renderPreview(PDF);
    const button = await screen.findByRole('button', { name: /open in new tab/i });

    // Act
    await userEvent.click(button);

    // Assert
    expect(openExternal).toHaveBeenCalledWith('https://files.test/a');
  });

  it('falls back to the new-tab action when an image cannot be displayed inline', async () => {
    // Arrange
    renderPreview(IMAGE);
    const image = await screen.findByRole('img', { name: 'Pump photo.png' });

    // Act
    fireEvent.error(image);

    // Assert
    expect(await screen.findByText(/could not be displayed here/i)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open in new tab/i })).toBeInTheDocument();
  });

  it('shows an error with retry when the link cannot be fetched', async () => {
    // Arrange
    const getDownloadUrl = vi
      .fn<FileDownloadService['getDownloadUrl']>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('https://files.test/a');
    renderPreview(IMAGE, getDownloadUrl);

    // Act
    await userEvent.click(await screen.findByRole('button', { name: /retry/i }));

    // Assert
    expect(await screen.findByRole('img', { name: 'Pump photo.png' })).toBeInTheDocument();
  });
});
