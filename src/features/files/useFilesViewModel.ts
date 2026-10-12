import { useQuery } from '@tanstack/react-query';

import { useAppDeps } from '../../deps/useAppDeps';
import { toLoadStatus, type LoadStatus } from '../../lib/loadStatus';
import type { InstanceRef } from '../../lib/properties';
import type { FileItem } from '../../services/RelatedDataService';
import { useAppState } from '../../state/useAppState';

export type FilesViewModel = {
  status: LoadStatus;
  files: FileItem[];
  /** The open file. Undefined if none is open or the saved one is not among this asset's files. */
  selectedFile: FileItem | undefined;
  selectFile: (fileId: InstanceRef) => void;
  closeFile: () => void;
  retry: () => void;
};

export function useFilesViewModel(): FilesViewModel {
  const { related } = useAppDeps();
  const { state, selectFile } = useAppState();
  const assetId = state.assetId;

  const files = useQuery({
    queryKey: ['files', assetId?.space, assetId?.externalId],
    queryFn: () => (assetId ? related.listFiles(assetId) : Promise.resolve([])),
    enabled: assetId !== null,
  });

  const fileId = state.fileId;
  return {
    status: toLoadStatus(files, (items) => items.length === 0),
    files: files.data ?? [],
    selectedFile: fileId
      ? files.data?.find((file) => file.id.space === fileId.space && file.id.externalId === fileId.externalId)
      : undefined,
    selectFile,
    closeFile: () => selectFile(null),
    retry: () => void files.refetch(),
  };
}
