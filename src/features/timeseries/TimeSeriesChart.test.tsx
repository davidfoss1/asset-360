import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { stubChartSize } from '../../__mocks__/stubChartSize';
import type { SeriesPoint } from '../../services/DatapointsService';

import { TimeSeriesChart } from './TimeSeriesChart';

const HOUR = 60 * 60 * 1000;
const START = Date.UTC(2026, 8, 1, 12, 0);
const POINTS: SeriesPoint[] = [
  { timestamp: START, value: 1200 },
  { timestamp: START + HOUR, value: 2500 },
  { timestamp: START + 2 * HOUR, value: 1800 },
];

describe(TimeSeriesChart.name, () => {
  let restoreLayout: () => void;

  beforeEach(() => {
    restoreLayout = stubChartSize();
  });

  afterEach(() => {
    restoreLayout();
  });

  it('describes the chart for assistive technology, naming the series and its window', () => {
    render(<TimeSeriesChart name="Pressure" unit="bar" points={POINTS} />);

    expect(screen.getByRole('img', { name: 'Pressure over the 24 hours up to its latest datapoint' })).toBeInTheDocument();
  });

  it('draws the series as a line', () => {
    const { container } = render(<TimeSeriesChart name="Pressure" points={POINTS} />);

    expect(container.querySelector('.recharts-line')).toBeInTheDocument();
  });

  it('labels the value axis with grouped digits', () => {
    const { container } = render(<TimeSeriesChart name="Pressure" points={POINTS} />);

    const ticks = tickLabels(container, 'yAxis');
    expect(ticks.length).toBeGreaterThan(0);
    // The raw value would be "2600"; the formatter groups the thousands for the locale.
    expect(ticks.every((tick) => /^\d{1,3}\D\d{3}$|^\d{1,3}$/.test(tick))).toBe(true);
    expect(ticks.some((tick) => tick.length > 3 && !/^\d+$/.test(tick))).toBe(true);
  });

  it('labels the time axis with clock times', () => {
    const { container } = render(<TimeSeriesChart name="Pressure" points={POINTS} />);

    const ticks = tickLabels(container, 'xAxis');
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks.every((tick) => /\d{1,2}[:.]\d{2}/.test(tick))).toBe(true);
  });

  it('shows the full date and time of the hovered point in the tooltip', async () => {
    // Arrange
    const { container } = render(<TimeSeriesChart name="Pressure" points={POINTS} />);
    const wrapper = container.querySelector('.recharts-wrapper');

    // Act
    if (wrapper) fireEvent.mouseMove(wrapper, { clientX: 400, clientY: 100 });

    // Assert
    // Only the tooltip title prints the year; the axis ticks show clock times.
    expect(await screen.findByText(/2026/)).toBeInTheDocument();
  });
});

function tickLabels(container: HTMLElement, axis: 'xAxis' | 'yAxis'): string[] {
  return [...container.querySelectorAll(`.recharts-${axis}-tick-labels .recharts-cartesian-axis-tick-value`)].map(
    (tick) => tick.textContent ?? ''
  );
}
