import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { makeDeps, makeViewModelWrapper } from '../../__mocks__/viewModelWrapper';
import type { FileItem, FilePage, RelatedDataService } from '../../services/RelatedDataService';

import { useFilesViewModel } from './useFilesViewModel';

const ASSET = { space: 's', externalId: 'pump-101' };
const PID: FileItem = { id: { space: 's', externalId: 'pid' }, name: 'P&ID.pdf', isUploaded: true };
const MANUAL: FileItem = { id: { space: 's', externalId: 'manual' }, name: 'Manual.pdf', isUploaded: true };

describe(useFilesViewModel.name, () => {
  it('is idle and does not fetch when no asset is selected', () => {
    const deps = makeDeps();

    const { result } = renderHook(() => useFilesViewModel(), { wrapper: makeViewModelWrapper({ deps }) });

    expect(result.current.status).toBe('idle');
    expect(deps.related.listFiles).not.toHaveBeenCalled();
  });

  it("loads the selected asset's files", async () => {
    // Arrange
    const listFiles = vi.fn<RelatedDataService['listFiles']>(() => Promise.resolve(page([PID, MANUAL])));
    const deps = makeDeps({ related: { listFiles } });

    // Act
    const { result } = renderHook(() => useFilesViewModel(), {
      wrapper: makeViewModelWrapper({ deps, initialState: { assetId: ASSET } }),
    });

    // Assert
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.files).toEqual([PID, MANUAL]);
    expect(result.current.selectedFile).toBeUndefined();
    expect(listFiles).toHaveBeenCalledWith(ASSET, undefined);
  });

  it('opens a file, and closes it again', async () => {
    // Arrange
    const deps = makeDeps({ related: { listFiles: () => Promise.resolve(page([PID, MANUAL])) } });
    const { result } = renderHook(() => useFilesViewModel(), {
      wrapper: makeViewModelWrapper({ deps, initialState: { assetId: ASSET } }),
    });
    await waitFor(() => expect(result.current.status).toBe('success'));

    // Act / Assert
    act(() => result.current.selectFile(MANUAL.id));
    expect(result.current.selectedFile).toEqual(MANUAL);
    act(() => result.current.closeFile());
    expect(result.current.selectedFile).toBeUndefined();
  });

  it('restores the open file from the saved state', async () => {
    const deps = makeDeps({ related: { listFiles: () => Promise.resolve(page([PID, MANUAL])) } });

    const { result } = renderHook(() => useFilesViewModel(), {
      wrapper: makeViewModelWrapper({ deps, initialState: { assetId: ASSET, fileId: PID.id } }),
    });

    await waitFor(() => expect(result.current.selectedFile).toEqual(PID));
  });

  it('has no open file when the saved file is not among the asset files', async () => {
    const deps = makeDeps({ related: { listFiles: () => Promise.resolve(page([PID])) } });

    const { result } = renderHook(() => useFilesViewModel(), {
      wrapper: makeViewModelWrapper({ deps, initialState: { assetId: ASSET, fileId: MANUAL.id } }),
    });

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.selectedFile).toBeUndefined();
  });

  it('reports empty when the asset has no files', async () => {
    const deps = makeDeps({ related: { listFiles: () => Promise.resolve(page([])) } });

    const { result } = renderHook(() => useFilesViewModel(), {
      wrapper: makeViewModelWrapper({ deps, initialState: { assetId: ASSET } }),
    });

    await waitFor(() => expect(result.current.status).toBe('empty'));
  });

  it('reports an error, and retry loads again', async () => {
    // Arrange
    const listFiles = vi
      .fn<RelatedDataService['listFiles']>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(page([PID]));
    const { result } = renderHook(() => useFilesViewModel(), {
      wrapper: makeViewModelWrapper({ deps: makeDeps({ related: { listFiles } }), initialState: { assetId: ASSET } }),
    });
    await waitFor(() => expect(result.current.status).toBe('error'));

    // Act
    act(() => result.current.retry());

    // Assert
    await waitFor(() => expect(result.current.status).toBe('success'));
  });

  describe('loading more', () => {
    const NEXT: FileItem = { id: { space: 's', externalId: 'next' }, name: 'Next.pdf', isUploaded: true };

    function renderPaged(listFiles: RelatedDataService['listFiles'], initialState: Record<string, unknown> = {}) {
      return renderHook(() => useFilesViewModel(), {
        wrapper: makeViewModelWrapper({
          deps: makeDeps({ related: { listFiles } }),
          initialState: { assetId: ASSET, ...initialState },
        }),
      });
    }

    it('loads the first page without a cursor', async () => {
      const listFiles = vi.fn<RelatedDataService['listFiles']>(() => Promise.resolve(page([PID])));

      const { result } = renderPaged(listFiles);

      await waitFor(() => expect(result.current.status).toBe('success'));
      expect(listFiles).toHaveBeenCalledWith(ASSET, undefined);
    });

    it('offers more only when the API returned a cursor', async () => {
      const { result } = renderPaged(() => Promise.resolve(page([PID], 'cursor-2')));

      await waitFor(() => expect(result.current.hasMore).toBe(true));
    });

    it('offers nothing more on the last page', async () => {
      const { result } = renderPaged(() => Promise.resolve(page([PID])));

      await waitFor(() => expect(result.current.status).toBe('success'));
      expect(result.current.hasMore).toBe(false);
    });

    it('fetches the next page with the cursor and appends it', async () => {
      // Arrange
      const listFiles = vi
        .fn<RelatedDataService['listFiles']>()
        .mockResolvedValueOnce(page([PID], 'cursor-2'))
        .mockResolvedValueOnce(page([NEXT]));
      const { result } = renderPaged(listFiles);
      await waitFor(() => expect(result.current.hasMore).toBe(true));

      // Act
      act(() => result.current.loadMore());

      // Assert
      await waitFor(() => expect(result.current.files).toEqual([PID, NEXT]));
      expect(listFiles).toHaveBeenLastCalledWith(ASSET, 'cursor-2');
      expect(result.current.hasMore).toBe(false);
    });

    it('finds the open file on a page loaded later', async () => {
      // Arrange
      const listFiles = vi
        .fn<RelatedDataService['listFiles']>()
        .mockResolvedValueOnce(page([PID], 'cursor-2'))
        .mockResolvedValueOnce(page([NEXT]));
      const { result } = renderPaged(listFiles, { fileId: NEXT.id });
      await waitFor(() => expect(result.current.hasMore).toBe(true));
      expect(result.current.selectedFile).toBeUndefined();

      // Act
      act(() => result.current.loadMore());

      // Assert
      await waitFor(() => expect(result.current.selectedFile).toEqual(NEXT));
    });

    it('keeps the rows and reports the failure when loading more fails', async () => {
      // Arrange
      const listFiles = vi
        .fn<RelatedDataService['listFiles']>()
        .mockResolvedValueOnce(page([PID], 'cursor-2'))
        .mockRejectedValueOnce(new Error('boom'));
      const { result } = renderPaged(listFiles);
      await waitFor(() => expect(result.current.hasMore).toBe(true));

      // Act
      act(() => result.current.loadMore());

      // Assert
      await waitFor(() => expect(result.current.loadMoreFailed).toBe(true));
      expect(result.current.status).toBe('success');
      expect(result.current.files).toEqual([PID]);
      expect(result.current.hasMore).toBe(true);
    });

    it('does nothing when asked to load more and there is no more', async () => {
      const listFiles = vi.fn<RelatedDataService['listFiles']>(() => Promise.resolve(page([PID])));
      const { result } = renderPaged(listFiles);
      await waitFor(() => expect(result.current.status).toBe('success'));

      act(() => result.current.loadMore());

      expect(listFiles).toHaveBeenCalledTimes(1);
    });
  });
});

function page(items: FileItem[], nextCursor?: string): FilePage {
  return { items, nextCursor };
}
