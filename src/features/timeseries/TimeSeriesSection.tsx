import { Button } from '@cognite/aura/components/button';
import { Combobox } from '@cognite/aura/components/combobox';
import { IconRefresh } from '@tabler/icons-react';

import { SectionState } from '../../components/SectionState';
import { formatDateTime, formatNumber } from '../../lib/format';
import type { InstanceRef } from '../../lib/properties';

import { summarize } from './summarize';
import { TimeSeriesChart } from './TimeSeriesChart';
import { useTimeSeriesViewModel } from './useTimeSeriesViewModel';

export function TimeSeriesSection() {
  const { listStatus, timeSeries, selected, selectSeries, retryList, dataStatus, points, windowEnd, latest, refresh } =
    useTimeSeriesViewModel();

  const options = timeSeries.map((item) => ({ value: keyOf(item.id), label: item.name }));
  const unit = selected?.unit ? ` ${selected.unit}` : '';
  const summary = summarize(points);

  return (
    <SectionState label="time series" status={listStatus} emptyTitle="No time series for this asset" onRetry={retryList}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Combobox
            aria-label="Time series"
            className="w-72"
            options={options}
            value={selected ? keyOf(selected.id) : undefined}
            onValueChange={(value) => {
              // Combobox reports '' when the current option is picked again; keep the selection.
              const next = timeSeries.find((item) => keyOf(item.id) === value);
              if (next) selectSeries(next.id);
            }}
            placeholder="Select time series"
            searchPlaceholder="Search time series"
            emptyText="No time series found."
          />
          <Button variant="outline" size="sm" onClick={refresh}>
            <IconRefresh aria-hidden />
            Refresh
          </Button>
        </div>

        <SectionState label="datapoints" status={dataStatus} emptyTitle="No datapoints for this series" onRetry={refresh}>
          {selected?.type === 'numeric' && summary ? (
            <div className="flex flex-col gap-3">
              {windowEnd !== undefined ? (
                <p className="text-sm text-muted-foreground">Showing the 24 hours up to {formatDateTime(windowEnd)}</p>
              ) : null}
              <p className="text-sm">
                <span>Latest: {formatNumber(summary.latest.value)}{unit}</span>
                {' · '}
                <span>Min: {formatNumber(summary.min)}{unit}</span>
                {' · '}
                <span>Max: {formatNumber(summary.max)}{unit}</span>
                {' · '}
                <span>{formatDateTime(summary.latest.timestamp)}</span>
              </p>
              <TimeSeriesChart name={selected.name} unit={selected.unit} points={points} />
            </div>
          ) : null}
          {selected && selected.type !== 'numeric' && latest ? (
            <div className="flex flex-col gap-1">
              <p className="text-2xl font-medium">{String(latest.value)}</p>
              <p className="text-sm text-muted-foreground">Latest value, {formatDateTime(latest.timestamp)}</p>
            </div>
          ) : null}
        </SectionState>
      </div>
    </SectionState>
  );
}

function keyOf({ space, externalId }: InstanceRef): string {
  return `${space}/${externalId}`;
}
