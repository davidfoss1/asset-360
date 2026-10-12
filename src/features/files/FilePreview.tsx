import { useCogniteSdk } from '@cognite/app-sdk/react';

import { CogniteFileViewer } from '../../cognite-file-viewer';
import type { FileItem } from '../../services/RelatedDataService';

/** Previews a CogniteFile. Loaded lazily by FilesSection because react-pdf is large. */
export function FilePreview({ file }: { file: FileItem }) {
  const client = useCogniteSdk();

  return (
    <CogniteFileViewer
      source={{ type: 'instanceId', space: file.id.space, externalId: file.id.externalId }}
      client={client}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
