import { DataGrid } from '@cognite/aura/data-grid';
import type { ColumnDef } from '@tanstack/react-table';

import { LoadMore } from '../../components/LoadMore';
import { SectionState } from '../../components/SectionState';
import { formatDateTime } from '../../lib/format';
import type { ActivityItem } from '../../services/RelatedDataService';

import { useActivitiesViewModel } from './useActivitiesViewModel';

const COLUMNS: ColumnDef<ActivityItem>[] = [
  { id: 'name', header: 'Name', accessorFn: (row) => row.name },
  { id: 'description', header: 'Description', accessorFn: (row) => row.description ?? '' },
  dateColumn('scheduled', 'Scheduled start', (row) => row.scheduledStartTime),
  dateColumn('start', 'Started', (row) => row.startTime),
  dateColumn('end', 'Ended', (row) => row.endTime),
];

/** Sorts on the time itself, since the formatted text ("Dec 8, 2015") would sort alphabetically. */
function dateColumn(id: string, header: string, time: (row: ActivityItem) => number | undefined): ColumnDef<ActivityItem> {
  return {
    id,
    header,
    accessorFn: time,
    cell: ({ row }) => formatDateTime(time(row.original)),
    // Activities with no date stay at the bottom whichever way the column is sorted.
    sortUndefined: 'last',
  };
}

export function ActivitiesSection() {
  const { status, activities, hasMore, loadMore, isLoadingMore, loadMoreFailed, retry } = useActivitiesViewModel();

  return (
    <SectionState label="activities" status={status} emptyTitle="No activities for this asset" onRetry={retry}>
      <div className="flex flex-col gap-3">
        <div className="h-80">
          <DataGrid
            aria-label="Activities"
            data={activities}
            columns={COLUMNS}
            getRowId={(row) => `${row.id.space}/${row.id.externalId}`}
            enableSorting
          />
        </div>
        <LoadMore
          label="activities"
          hasMore={hasMore}
          isLoading={isLoadingMore}
          failed={loadMoreFailed}
          onLoadMore={loadMore}
        />
      </div>
    </SectionState>
  );
}
