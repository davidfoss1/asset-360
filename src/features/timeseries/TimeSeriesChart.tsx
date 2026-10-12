import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@cognite/aura/chart';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import { formatNumber } from '../../lib/format';
import type { SeriesPoint } from '../../services/DatapointsService';

import { formatTimeTick, niceTimeTicks } from './timeTicks';
import type { TimeWindow } from './useTimeSeriesViewModel';

const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

type TimeSeriesChartProps = { name: string; unit?: string; points: SeriesPoint[]; window: TimeWindow };

export function TimeSeriesChart({ name, unit, points, window }: TimeSeriesChartProps) {
  const config = { value: { label: unit ? `${name} (${unit})` : name, color: 'var(--color-chart-fjord-color-1)' } } satisfies ChartConfig;

  return (
    <ChartContainer config={config} aria-label={`${name} over the 24 hours up to its latest datapoint`} className="h-72 w-full">
      <LineChart data={points}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="timestamp"
          type="number"
          scale="time"
          // The axis covers the whole window, whether or not there are points all through it, and the
          // marks are round clock times rather than whatever numbers Recharts would pick.
          domain={[window.start, window.end]}
          ticks={niceTimeTicks(window.start, window.end)}
          tickFormatter={formatTimeTick}
        />
        <YAxis width={56} tickFormatter={(value: number) => formatNumber(value)} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_label, payload) => {
                const timestamp = payload[0]?.payload?.timestamp;
                return typeof timestamp === 'number' ? dateTimeFormat.format(timestamp) : '';
              }}
            />
          }
        />
        <Line dataKey="value" type="monotone" stroke="var(--color-value)" dot={false} isAnimationActive={false} />
      </LineChart>
    </ChartContainer>
  );
}
