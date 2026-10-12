import { DataGrid } from '@cognite/aura/data-grid';
import type { ColumnDef } from '@tanstack/react-table';

import { LoadMore } from '../../components/LoadMore';
import { SectionState } from '../../components/SectionState';
import { formatDateTime } from '../../lib/format';
import type { ActivityItem } from '../../services/RelatedDataService';

import { ActivityDetail } from './ActivityDetail';
import { useActivitiesViewModel } from './useActivitiesViewModel';

// Every column needs a width: TanStack gives an unsized one 150px, which cut names and descriptions
// short and left the last column to take all the slack. Together these fit the app's content width.
const NAME_COLUMN_WIDTH = 200;
const DESCRIPTION_COLUMN_WIDTH = 240;
/** Wide enough for "Sep 13, 2012, 10:26 PM" on one line. */
const DATE_COLUMN_WIDTH = 190;

const COLUMNS: ColumnDef<ActivityItem>[] = [
  { id: 'name', header: 'Name', size: NAME_COLUMN_WIDTH, accessorFn: (row) => row.name },
  { id: 'description', header: 'Description', size: DESCRIPTION_COLUMN_WIDTH, accessorFn: (row) => row.description ?? '' },
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
    size: DATE_COLUMN_WIDTH,
    cell: ({ row }) => formatDateTime(time(row.original)),
    // Activities with no date stay at the bottom whichever way the column is sorted.
    sortUndefined: 'last',
  };
}

export function ActivitiesSection() {
  const {
    status,
    activities,
    selectedActivity,
    selectActivity,
    closeActivity,
    hasMore,
    loadMore,
    isLoadingMore,
    loadMoreFailed,
    retry,
  } = useActivitiesViewModel();

  return (
    <SectionState label="activities" status={status} emptyTitle="No activities for this asset" onRetry={retry}>
      {selectedActivity ? (
        <ActivityDetail activity={selectedActivity} onBack={closeActivity} />
      ) : (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">Select an activity to see its full name and description.</p>
        <div className="h-80">
          <DataGrid
            aria-label="Activities"
            data={activities}
            columns={COLUMNS}
            getRowId={(row) => `${row.id.space}/${row.id.externalId}`}
            enableSorting
            onRowClick={(row) => selectActivity(row.original.id)}
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
      )}
    </SectionState>
  );
}
