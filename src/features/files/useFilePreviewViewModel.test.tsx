import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { makeDeps, makeViewModelWrapper } from '../../__mocks__/viewModelWrapper';
import type { FileDownloadService } from '../../services/FileDownloadService';
import type { FileItem } from '../../services/RelatedDataService';

import { useFilePreviewViewModel } from './useFilePreviewViewModel';

const IMAGE: FileItem = { id: { space: 's', externalId: 'photo' }, name: 'photo.png', mimeType: 'image/png', isUploaded: true };
const PDF: FileItem = { id: { space: 's', externalId: 'pid' }, name: 'P&ID.pdf', mimeType: 'application/pdf', isUploaded: true };
const URL_A = 'https://files.test/a';

function setup(file: FileItem, options: { getDownloadUrl?: FileDownloadService['getDownloadUrl']; openExternal?: (url: string) => Promise<void> } = {}) {
  const getDownloadUrl = options.getDownloadUrl ?? vi.fn<FileDownloadService['getDownloadUrl']>(() => Promise.resolve(URL_A));
  const openExternal = options.openExternal ?? vi.fn<(url: string) => Promise<void>>(() => Promise.resolve());
  const deps = makeDeps({ files: { getDownloadUrl }, openExternal });
  const hook = renderHook(() => useFilePreviewViewModel(file), { wrapper: makeViewModelWrapper({ deps }) });
  return { ...hook, getDownloadUrl, openExternal };
}

describe(useFilePreviewViewModel.name, () => {
  it('loads the download url for the file', async () => {
    // Arrange / Act
    const { result, getDownloadUrl } = setup(IMAGE);

    // Assert
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.url).toBe(URL_A);
    expect(getDownloadUrl).toHaveBeenCalledWith(IMAGE.id);
  });

  it('previews images inline and opens other files externally', async () => {
    const image = setup(IMAGE);
    const pdf = setup(PDF);

    await waitFor(() => expect(image.result.current.status).toBe('success'));
    await waitFor(() => expect(pdf.result.current.status).toBe('success'));
    expect(image.result.current.kind).toBe('image');
    expect(pdf.result.current.kind).toBe('external');
  });

  it('reports an error, and retry loads again', async () => {
    // Arrange
    const getDownloadUrl = vi
      .fn<FileDownloadService['getDownloadUrl']>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(URL_A);
    const { result } = setup(PDF, { getDownloadUrl });
    await waitFor(() => expect(result.current.status).toBe('error'));

    // Act
    act(() => result.current.retry());

    // Assert
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.url).toBe(URL_A);
  });

  it('opens the download url in a new tab through the host', async () => {
    // Arrange
    const { result, openExternal } = setup(PDF);
    await waitFor(() => expect(result.current.status).toBe('success'));

    // Act
    act(() => result.current.openInNewTab());

    // Assert
    expect(openExternal).toHaveBeenCalledWith(URL_A);
  });

  it('does nothing when asked to open before the url is ready', () => {
    const { result, openExternal } = setup(PDF, { getDownloadUrl: () => new Promise<string>(() => undefined) });

    act(() => result.current.openInNewTab());

    expect(openExternal).not.toHaveBeenCalled();
  });

  it('survives the host failing to open the tab', async () => {
    // Arrange
    const { result } = setup(PDF, { openExternal: () => Promise.reject(new Error('host gone')) });
    await waitFor(() => expect(result.current.status).toBe('success'));

    // Act / Assert: no unhandled rejection, the preview stays usable
    await act(async () => result.current.openInNewTab());
    expect(result.current.status).toBe('success');
  });
});
