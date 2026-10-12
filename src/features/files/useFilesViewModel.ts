import { useInfiniteQuery } from '@tanstack/react-query';

import { useAppDeps } from '../../deps/useAppDeps';
import { toLoadStatus, type LoadStatus } from '../../lib/loadStatus';
import type { InstanceRef } from '../../lib/properties';
import type { FileItem } from '../../services/RelatedDataService';
import { useAppState } from '../../state/useAppState';

export type FilesViewModel = {
  status: LoadStatus;
  /** Every file loaded so far. */
  files: FileItem[];
  hasMore: boolean;
  loadMore: () => void;
  isLoadingMore: boolean;
  /** Loading more failed. The rows already shown stay, and `loadMore` tries again. */
  loadMoreFailed: boolean;
  /** The open file. Undefined if none is open or the saved one is not among the files loaded so far. */
  selectedFile: FileItem | undefined;
  selectFile: (fileId: InstanceRef) => void;
  closeFile: () => void;
  retry: () => void;
};

export function useFilesViewModel(): FilesViewModel {
  const { related } = useAppDeps();
  const { state, selectFile } = useAppState();
  const assetId = state.assetId;

  const files = useInfiniteQuery({
    queryKey: ['files', assetId?.space, assetId?.externalId],
    queryFn: ({ pageParam }) =>
      assetId ? related.listFiles(assetId, pageParam ?? undefined) : Promise.resolve(NO_FILES),
    initialPageParam: FIRST_PAGE,
    getNextPageParam: (last) => last.nextCursor,
    select: (data) => data.pages.flatMap((page) => page.items),
    enabled: assetId !== null,
  });

  const fileId = state.fileId;
  return {
    status: toLoadStatus(files, (items) => items.length === 0),
    files: files.data ?? [],
    hasMore: files.hasNextPage,
    loadMore: () => {
      if (files.hasNextPage && !files.isFetchingNextPage) void files.fetchNextPage();
    },
    isLoadingMore: files.isFetchingNextPage,
    loadMoreFailed: files.isFetchNextPageError,
    selectedFile: fileId
      ? files.data?.find((file) => file.id.space === fileId.space && file.id.externalId === fileId.externalId)
      : undefined,
    selectFile,
    closeFile: () => selectFile(null),
    retry: () => void files.refetch(),
  };
}

const NO_FILES = { items: [] };
/** The cursor of the first page: none. */
const FIRST_PAGE: string | null = null;
