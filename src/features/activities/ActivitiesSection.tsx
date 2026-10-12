import { DataGrid } from '@cognite/aura/data-grid';
import type { ColumnDef } from '@tanstack/react-table';

import { SectionState } from '../../components/SectionState';
import { formatDateTime } from '../../lib/format';
import type { ActivityItem } from '../../services/RelatedDataService';

import { useActivitiesViewModel } from './useActivitiesViewModel';

const COLUMNS: ColumnDef<ActivityItem>[] = [
  { id: 'name', header: 'Name', accessorFn: (row) => row.name },
  { id: 'description', header: 'Description', accessorFn: (row) => row.description ?? '' },
  { id: 'scheduled', header: 'Scheduled start', accessorFn: (row) => formatDateTime(row.scheduledStartTime) },
  { id: 'start', header: 'Started', accessorFn: (row) => formatDateTime(row.startTime) },
  { id: 'end', header: 'Ended', accessorFn: (row) => formatDateTime(row.endTime) },
];

export function ActivitiesSection() {
  const { status, activities, retry } = useActivitiesViewModel();

  return (
    <SectionState label="activities" status={status} emptyTitle="No activities for this asset" onRetry={retry}>
      <div className="h-80">
        <DataGrid
          aria-label="Activities"
          data={activities}
          columns={COLUMNS}
          getRowId={(row) => `${row.id.space}/${row.id.externalId}`}
          enableSorting
        />
      </div>
    </SectionState>
  );
}
