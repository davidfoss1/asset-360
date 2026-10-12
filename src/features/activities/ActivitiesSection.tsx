import { DataGrid } from '@cognite/aura/data-grid';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

import { LoadMore } from '../../components/LoadMore';
import { SectionState } from '../../components/SectionState';
import { formatDateTime } from '../../lib/format';
import { useElementWidth } from '../../lib/useElementWidth';
import type { ActivityItem } from '../../services/RelatedDataService';

import { activityColumnLayout, type ActivityColumnId } from './activityColumns';
import { ActivityDetail } from './ActivityDetail';
import { useActivitiesViewModel } from './useActivitiesViewModel';

// Widths come from `activityColumnLayout`, since the grid gives every column a fixed width and cannot
// shrink on its own. TanStack gives an unsized column 150px, which is why each one is sized there.
const COLUMNS: Record<ActivityColumnId, ColumnDef<ActivityItem>> = {
  name: { id: 'name', header: 'Name', accessorFn: (row) => row.name },
  description: { id: 'description', header: 'Description', accessorFn: (row) => row.description ?? '' },
  scheduled: dateColumn('scheduled', 'Scheduled start', (row) => row.scheduledStartTime),
  start: dateColumn('start', 'Started', (row) => row.startTime),
  end: dateColumn('end', 'Ended', (row) => row.endTime),
};

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

  // Measured on an element that is always there, since the table itself only exists once loaded.
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const columns = useMemo(
    () => activityColumnLayout(width).map(({ id, size }) => ({ ...COLUMNS[id], size })),
    [width]
  );

  return (
    <div ref={ref} className="w-full min-w-0">
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
            columns={columns}
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
    </div>
  );
}