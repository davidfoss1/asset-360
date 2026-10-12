import { Alert, AlertDescription } from '@cognite/aura/components/alert';
import { Button } from '@cognite/aura/components/button';
import { IconExternalLink } from '@tabler/icons-react';
import { useState } from 'react';

import { SectionState } from '../../components/SectionState';
import type { FileItem } from '../../services/RelatedDataService';

import { useFilePreviewViewModel } from './useFilePreviewViewModel';

/**
 * Shows images inline. PDFs and other types open in a new browser tab, because the app CSP
 * (`frame-src 'self'`, `object-src 'none'`) does not allow framing them.
 */
export function FilePreview({ file }: { file: FileItem }) {
  const { status, kind, url, openInNewTab, retry } = useFilePreviewViewModel(file);
  // Whether the browser managed to draw the image is a view concern, so it stays local.
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = kind === 'image' && url !== undefined && !imageFailed;

  return (
    <SectionState label="preview" status={status} emptyTitle="" onRetry={retry}>
      <div className="flex h-full flex-col items-start gap-3">
        {showImage ? (
          <img src={url} alt={file.name} onError={() => setImageFailed(true)} className="max-h-full max-w-full object-contain" />
        ) : (
          <Alert variant="info">
            <AlertDescription>
              {imageFailed
                ? 'This image could not be displayed here.'
                : 'This file type opens in a new browser tab.'}
            </AlertDescription>
          </Alert>
        )}
        <Button variant="outline" size="sm" onClick={openInNewTab}>
          <IconExternalLink aria-hidden />
          Open in new tab
        </Button>
      </div>
    </SectionState>
  );
}
