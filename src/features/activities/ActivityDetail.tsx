import { Button } from '@cognite/aura/components/button';
import { IconArrowLeft } from '@tabler/icons-react';

import { formatDateTime } from '../../lib/format';
import type { ActivityItem } from '../../services/RelatedDataService';

type ActivityDetailProps = {
  activity: ActivityItem;
  onBack: () => void;
};

/** Everything known about one activity, with the name and description in full. */
export function ActivityDetail({ activity, onBack }: ActivityDetailProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button variant="outline" size="sm" onClick={onBack}>
          <IconArrowLeft aria-hidden />
          Back to activities
        </Button>
      </div>

      <h3 className="break-words text-lg font-medium">{activity.name}</h3>

      {activity.description ? (
        <p className="whitespace-pre-wrap break-words">{activity.description}</p>
      ) : (
        <p className="text-muted-foreground">No description</p>
      )}

      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        <Time label="Scheduled start" time={activity.scheduledStartTime} />
        <Time label="Scheduled end" time={activity.scheduledEndTime} />
        <Time label="Started" time={activity.startTime} />
        <Time label="Ended" time={activity.endTime} />
      </dl>
    </div>
  );
}

function Time({ label, time }: { label: string; time: number | undefined }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd>{formatDateTime(time)}</dd>
    </div>
  );
}
