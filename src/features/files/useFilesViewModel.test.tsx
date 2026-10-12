import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { makeDeps, makeViewModelWrapper } from '../../__mocks__/viewModelWrapper';
import type { FileItem, RelatedDataService } from '../../services/RelatedDataService';

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
    const listFiles = vi.fn<RelatedDataService['listFiles']>(() => Promise.resolve([PID, MANUAL]));
    const deps = makeDeps({ related: { listFiles } });

    // Act
    const { result } = renderHook(() => useFilesViewModel(), {
      wrapper: makeViewModelWrapper({ deps, initialState: { assetId: ASSET } }),
    });

    // Assert
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.files).toEqual([PID, MANUAL]);
    expect(result.current.selectedFile).toBeUndefined();
    expect(listFiles).toHaveBeenCalledWith(ASSET);
  });

  it('opens a file, and closes it again', async () => {
    // Arrange
    const deps = makeDeps({ related: { listFiles: () => Promise.resolve([PID, MANUAL]) } });
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
    const deps = makeDeps({ related: { listFiles: () => Promise.resolve([PID, MANUAL]) } });

    const { result } = renderHook(() => useFilesViewModel(), {
      wrapper: makeViewModelWrapper({ deps, initialState: { assetId: ASSET, fileId: PID.id } }),
    });

    await waitFor(() => expect(result.current.selectedFile).toEqual(PID));
  });

  it('has no open file when the saved file is not among the asset files', async () => {
    const deps = makeDeps({ related: { listFiles: () => Promise.resolve([PID]) } });

    const { result } = renderHook(() => useFilesViewModel(), {
      wrapper: makeViewModelWrapper({ deps, initialState: { assetId: ASSET, fileId: MANUAL.id } }),
    });

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.selectedFile).toBeUndefined();
  });

  it('reports empty when the asset has no files', async () => {
    const deps = makeDeps({ related: { listFiles: () => Promise.resolve([]) } });

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
      .mockResolvedValueOnce([PID]);
    const { result } = renderHook(() => useFilesViewModel(), {
      wrapper: makeViewModelWrapper({ deps: makeDeps({ related: { listFiles } }), initialState: { assetId: ASSET } }),
    });
    await waitFor(() => expect(result.current.status).toBe('error'));

    // Act
    act(() => result.current.retry());

    // Assert
    await waitFor(() => expect(result.current.status).toBe('success'));
  });
});
