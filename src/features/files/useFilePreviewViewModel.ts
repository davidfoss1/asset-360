import { useQuery } from '@tanstack/react-query';

import { useAppDeps } from '../../deps/useAppDeps';
import { toLoadStatus, type LoadStatus } from '../../lib/loadStatus';
import type { FileItem } from '../../services/RelatedDataService';

import { previewKind, type PreviewKind } from './previewKind';

// Signed download URLs expire, so do not reuse one for long.
const URL_STALE_MS = 10 * 60 * 1000;

export type FilePreviewViewModel = {
  status: LoadStatus;
  kind: PreviewKind;
  url: string | undefined;
  openInNewTab: () => void;
  retry: () => void;
};

export function useFilePreviewViewModel(file: FileItem): FilePreviewViewModel {
  const { files, openExternal } = useAppDeps();

  const download = useQuery({
    queryKey: ['fileUrl', file.id.space, file.id.externalId],
    queryFn: () => files.getDownloadUrl(file.id),
    staleTime: URL_STALE_MS,
  });

  const url = download.data;
  return {
    status: toLoadStatus(download, () => false),
    kind: previewKind(file),
    url,
    openInNewTab: () => {
      if (!url) return;
      // The host only fails if it has gone away; the preview itself is unaffected, so do not surface it.
      openExternal(url).catch(() => undefined);
    },
    retry: () => void download.refetch(),
  };
}
