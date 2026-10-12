import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { makeDeps, makeViewModelWrapper } from '../../__mocks__/viewModelWrapper';
import type { DatapointsService, SeriesPoint } from '../../services/DatapointsService';
import type { RelatedDataService, TimeSeriesItem } from '../../services/RelatedDataService';

import { TimeSeriesSection } from './TimeSeriesSection';

const ASSET = { space: 's', externalId: 'pump-101' };
const PRESSURE: TimeSeriesItem = { id: { space: 's', externalId: 'pressure' }, name: 'Pressure', type: 'numeric', unit: 'bar' };
const TEMPERATURE: TimeSeriesItem = { id: { space: 's', externalId: 'temperature' }, name: 'Temperature', type: 'numeric', unit: 'degC' };
const STATUS: TimeSeriesItem = { id: { space: 's', externalId: 'status' }, name: 'Status', type: 'state' };
const POINTS: SeriesPoint[] = [
  { timestamp: 1000, value: 2 },
  { timestamp: 2000, value: 8 },
  { timestamp: 3000, value: 5 },
];

function renderSection(options: {
  listTimeSeries?: RelatedDataService['listTimeSeries'];
  getSeries?: DatapointsService['getSeries'];
  getLatest?: DatapointsService['getLatest'];
}) {
  const deps = makeDeps({
    related: { listTimeSeries: options.listTimeSeries ?? (() => Promise.resolve([PRESSURE, STATUS])) },
    datapoints: {
      getSeries: options.getSeries ?? (() => Promise.resolve(POINTS)),
      getLatest: options.getLatest ?? (() => Promise.resolve({ timestamp: 5000, value: 'RUNNING' })),
    },
  });
  render(<TimeSeriesSection />, { wrapper: makeViewModelWrapper({ deps, initialState: { assetId: ASSET } }) });
}

describe(TimeSeriesSection.name, () => {
  it('shows a loading skeleton first', () => {
    renderSection({ listTimeSeries: () => new Promise<TimeSeriesItem[]>(() => undefined) });

    expect(screen.getByRole('status', { name: 'Loading time series' })).toBeInTheDocument();
  });

  it('charts the first numeric series with a text summary of its key values', async () => {
    renderSection({});

    expect(await screen.findByRole('img', { name: /Pressure.*24 hours up to its latest datapoint/i })).toBeInTheDocument();
    expect(await screen.findByText(/Latest: 5 bar/)).toBeInTheDocument();
    expect(screen.getByText(/Min: 2 bar/)).toBeInTheDocument();
    expect(screen.getByText(/Max: 8 bar/)).toBeInTheDocument();
  });

  it('shows the selected series name on the picker', async () => {
    renderSection({});

    expect(await screen.findByRole('combobox', { name: 'Time series' })).toHaveTextContent('Pressure');
  });

  it('shows only the latest value for a state series', async () => {
    // Arrange
    renderSection({ listTimeSeries: () => Promise.resolve([STATUS]) });

    // Assert
    expect(await screen.findByText('RUNNING')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /24 hours up to/i })).not.toBeInTheDocument();
  });

  it('shows an empty state naming what is missing when there are no series', async () => {
    renderSection({ listTimeSeries: () => Promise.resolve([]) });

    expect(await screen.findByText('No time series for this asset')).toBeInTheDocument();
  });

  it('shows a data error on its own, keeping the picker, and refresh loads again', async () => {
    // Arrange
    const getSeries = vi
      .fn<DatapointsService['getSeries']>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(POINTS);
    renderSection({ getSeries });

    // Act
    await userEvent.click(await screen.findByRole('button', { name: /retry/i }));

    // Assert
    expect(await screen.findByText(/Latest: 5 bar/)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Time series' })).toBeInTheDocument();
  });

  it('states that the window ends at the latest datapoint, not at the current time', async () => {
    renderSection({});

    expect(await screen.findByText(/Showing the 24 hours up to/)).toBeInTheDocument();
  });

  it('does not show a window for a state series', async () => {
    renderSection({ listTimeSeries: () => Promise.resolve([STATUS]) });

    await screen.findByText('RUNNING');
    expect(screen.queryByText(/Showing the 24 hours up to/)).not.toBeInTheDocument();
  });

  it('shows an empty chart message when the series has no datapoints', async () => {
    renderSection({ getSeries: () => Promise.resolve([]) });

    expect(await screen.findByText('No datapoints for this series')).toBeInTheDocument();
  });

  it('shows the same empty message when a numeric series has no latest datapoint', async () => {
    renderSection({ getLatest: () => Promise.resolve(undefined) });

    expect(await screen.findByText('No datapoints for this series')).toBeInTheDocument();
  });

  it('has a manual refresh button that fetches again', async () => {
    // Arrange
    const getSeries = vi.fn<DatapointsService['getSeries']>(() => Promise.resolve(POINTS));
    renderSection({ getSeries });
    await screen.findByText(/Latest: 5 bar/);

    // Act
    await userEvent.click(screen.getByRole('button', { name: /refresh/i }));

    // Assert
    expect(getSeries).toHaveBeenCalledTimes(2);
  });

  describe('picking a series', () => {
    it('charts the series the user picks', async () => {
      // Arrange
      const getSeries = vi.fn<DatapointsService['getSeries']>(() => Promise.resolve(POINTS));
      renderSection({ listTimeSeries: () => Promise.resolve([PRESSURE, TEMPERATURE]), getSeries });
      await screen.findByText(/Latest: 5 bar/);

      // Act
      await userEvent.click(screen.getByRole('combobox', { name: 'Time series' }));
      await userEvent.click(await screen.findByRole('option', { name: 'Temperature' }));

      // Assert
      expect(await screen.findByText(/Latest: 5 degC/)).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Time series' })).toHaveTextContent('Temperature');
      expect(getSeries).toHaveBeenLastCalledWith(TEMPERATURE.id, expect.anything());
    });

    it('keeps the current series when the user picks it again', async () => {
      // Arrange
      const getSeries = vi.fn<DatapointsService['getSeries']>(() => Promise.resolve(POINTS));
      renderSection({ listTimeSeries: () => Promise.resolve([PRESSURE, TEMPERATURE]), getSeries });
      await screen.findByText(/Latest: 5 bar/);

      // Act
      await userEvent.click(screen.getByRole('combobox', { name: 'Time series' }));
      await userEvent.click(await screen.findByRole('option', { name: 'Pressure' }));

      // Assert
      expect(screen.getByRole('combobox', { name: 'Time series' })).toHaveTextContent('Pressure');
      expect(screen.getByText(/Latest: 5 bar/)).toBeInTheDocument();
      expect(getSeries).toHaveBeenCalledTimes(1);
    });
  });

  describe('refresh feedback', () => {
    it('says when the data was fetched', async () => {
      renderSection({});

      expect(await screen.findByText(/^Updated /)).toBeInTheDocument();
    });

    it('shows that it is refreshing, disables the button meanwhile, and keeps the chart', async () => {
      // Arrange
      const getSeries = vi
        .fn<DatapointsService['getSeries']>()
        .mockResolvedValueOnce(POINTS)
        .mockReturnValueOnce(new Promise<SeriesPoint[]>(() => undefined));
      renderSection({ getSeries });
      await screen.findByText(/Latest: 5 bar/);

      // Act
      await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));

      // Assert
      expect(await screen.findByRole('button', { name: 'Refreshing…' })).toBeDisabled();
      expect(screen.getByText(/Latest: 5 bar/)).toBeInTheDocument();
    });

    it('goes back to Refresh when it is done', async () => {
      renderSection({});
      await screen.findByText(/Latest: 5 bar/);

      await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));

      expect(await screen.findByRole('button', { name: 'Refresh' })).toBeEnabled();
    });

    it('says so when a refresh fails, and that the chart is older data', async () => {
      // Arrange
      const getSeries = vi
        .fn<DatapointsService['getSeries']>()
        .mockResolvedValueOnce(POINTS)
        .mockRejectedValueOnce(new Error('boom'));
      renderSection({ getSeries });
      await screen.findByText(/Latest: 5 bar/);

      // Act
      await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));

      // Assert
      expect(await screen.findByText(/Could not refresh\. Showing data from /)).toBeInTheDocument();
      expect(screen.getByText(/Latest: 5 bar/)).toBeInTheDocument();
      expect(screen.queryByText(/^Updated /)).not.toBeInTheDocument();
    });

    it('drops the failure message once a refresh works', async () => {
      // Arrange
      const getSeries = vi
        .fn<DatapointsService['getSeries']>()
        .mockResolvedValueOnce(POINTS)
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce(POINTS);
      renderSection({ getSeries });
      await screen.findByText(/Latest: 5 bar/);
      await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));
      await screen.findByText(/Could not refresh/);

      // Act
      await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));

      // Assert
      expect(await screen.findByText(/^Updated /)).toBeInTheDocument();
      expect(screen.queryByText(/Could not refresh/)).not.toBeInTheDocument();
    });
  });
});
