import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { DataGrid } from '@cognite/aura/data-grid';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo, type ComponentType } from 'react';

import { LoadMore } from '../../components/LoadMore';
import { SectionState } from '../../components/SectionState';
import type { InstanceRef } from '../../lib/properties';
import type { FileItem } from '../../services/RelatedDataService';

import { FilePreview } from './FilePreview';
import { useFilesViewModel } from './useFilesViewModel';

type FilesSectionProps = {
  /** Shows the open file. Injectable so tests of the table need not set up file downloads. */
  Preview?: ComponentType<{ file: FileItem }>;
};

export function FilesSection({ Preview = FilePreview }: FilesSectionProps) {
  const { status, files, hasMore, loadMore, isLoadingMore, loadMoreFailed, selectedFile, selectFile, closeFile, retry } =
    useFilesViewModel();
  const columns = useMemo(() => makeColumns(selectFile), [selectFile]);

  return (
    <SectionState label="files" status={status} emptyTitle="No files for this asset" onRetry={retry}>
      <div className="flex flex-col gap-4">
        <div className="h-64">
          <DataGrid
            aria-label="Files"
            data={files}
            columns={columns}
            getRowId={(row) => `${row.id.space}/${row.id.externalId}`}
            enableSorting
          />
        </div>
        <LoadMore label="files" hasMore={hasMore} isLoading={isLoadingMore} failed={loadMoreFailed} onLoadMore={loadMore} />
        {selectedFile ? (
          <section aria-label={`Preview of ${selectedFile.name}`} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-medium">{selectedFile.name}</h3>
              <Button variant="outline" size="sm" onClick={closeFile}>
                Close preview
              </Button>
            </div>
            <div className="min-h-48">
              <Preview file={selectedFile} />
            </div>
          </section>
        ) : null}
      </div>
    </SectionState>
  );
}

function makeColumns(selectFile: (id: InstanceRef) => void): ColumnDef<FileItem>[] {
  return [
    { id: 'name', header: 'Name', accessorFn: (row) => row.name },
    { id: 'directory', header: 'Directory', accessorFn: (row) => row.directory ?? '' },
    { id: 'type', header: 'Type', accessorFn: (row) => row.mimeType ?? '' },
    {
      id: 'status',
      header: 'Status',
      enableSorting: false,
      cell: ({ row }) =>
        row.original.isUploaded ? <Badge variant="success">Uploaded</Badge> : <Badge variant="warning">Not uploaded</Badge>,
    },
    {
      id: 'open',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          aria-label={`Open ${row.original.name}`}
          disabled={!row.original.isUploaded}
          onClick={() => selectFile(row.original.id)}
        >
          Open
        </Button>
      ),
    },
  ];
}
