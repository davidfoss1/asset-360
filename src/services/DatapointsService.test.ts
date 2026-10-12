import type { DatapointAggregates } from '@cognite/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CdmDatapointsService, type DatapointsClient } from './DatapointsService';

const ID = { space: 'instances-space', externalId: 'pump-101-pressure' };
const HOUR = 60 * 60 * 1000;

describe(CdmDatapointsService.name, () => {
  let client: DatapointsClient;

  beforeEach(() => {
    client = {
      datapoints: {
        retrieve: vi.fn<DatapointsClient['datapoints']['retrieve']>(),
        retrieveLatest: vi.fn<DatapointsClient['datapoints']['retrieveLatest']>(),
      },
    };
  });

  describe('getSeries', () => {
    it('requests average aggregates by instanceId for the range', async () => {
      // Arrange
      vi.mocked(client.datapoints.retrieve).mockResolvedValue([aggregates([])]);
      const range = { start: 0, end: 24 * HOUR };

      // Act
      await new CdmDatapointsService(client).getSeries(ID, range);

      // Assert
      expect(client.datapoints.retrieve).toHaveBeenCalledWith({
        items: [{ instanceId: ID }],
        start: 0,
        end: 24 * HOUR,
        aggregates: ['average'],
        granularity: '5m',
        limit: 1000,
      });
    });

    it('widens the granularity for longer ranges, capped at 120 minutes', async () => {
      vi.mocked(client.datapoints.retrieve).mockResolvedValue([aggregates([])]);
      const service = new CdmDatapointsService(client);

      await service.getSeries(ID, { start: 0, end: 7 * 24 * HOUR });
      await service.getSeries(ID, { start: 0, end: 365 * 24 * HOUR });

      const granularities = vi.mocked(client.datapoints.retrieve).mock.calls.map(([query]) => query.granularity);
      expect(granularities).toEqual(['34m', '120m']);
    });

    it('maps aggregate points to timestamp and value, skipping empty buckets', async () => {
      // Arrange
      vi.mocked(client.datapoints.retrieve).mockResolvedValue([
        aggregates([
          { timestamp: new Date(1000), average: 1.5 },
          { timestamp: new Date(2000) },
          { timestamp: new Date(3000), average: 2.5 },
        ]),
      ]);

      // Act
      const series = await new CdmDatapointsService(client).getSeries(ID, { start: 0, end: HOUR });

      // Assert
      expect(series).toEqual([
        { timestamp: 1000, value: 1.5 },
        { timestamp: 3000, value: 2.5 },
      ]);
    });

    it('returns an empty series when the API returns no time series', async () => {
      vi.mocked(client.datapoints.retrieve).mockResolvedValue([]);

      expect(await new CdmDatapointsService(client).getSeries(ID, { start: 0, end: HOUR })).toEqual([]);
    });

    it('propagates API errors', async () => {
      vi.mocked(client.datapoints.retrieve).mockRejectedValue(new Error('boom'));

      await expect(new CdmDatapointsService(client).getSeries(ID, { start: 0, end: HOUR })).rejects.toThrow('boom');
    });
  });

  describe('getLatest', () => {
    it('requests the latest datapoint by instanceId', async () => {
      vi.mocked(client.datapoints.retrieveLatest).mockResolvedValue([]);

      await new CdmDatapointsService(client).getLatest(ID);

      expect(client.datapoints.retrieveLatest).toHaveBeenCalledWith([{ instanceId: ID, before: 'now' }]);
    });

    it('maps a numeric latest point', async () => {
      vi.mocked(client.datapoints.retrieveLatest).mockResolvedValue([
        { id: 1, isString: false, datapoints: [{ timestamp: new Date(5000), value: 42 }] },
      ]);

      expect(await new CdmDatapointsService(client).getLatest(ID)).toEqual({ timestamp: 5000, value: 42 });
    });

    it('maps a string latest point', async () => {
      vi.mocked(client.datapoints.retrieveLatest).mockResolvedValue([
        { id: 1, isString: true, datapoints: [{ timestamp: new Date(5000), value: 'RUNNING' }] },
      ]);

      expect(await new CdmDatapointsService(client).getLatest(ID)).toEqual({ timestamp: 5000, value: 'RUNNING' });
    });

    it('returns undefined when the series has no datapoints', async () => {
      vi.mocked(client.datapoints.retrieveLatest).mockResolvedValue([{ id: 1, isString: false, datapoints: [] }]);

      expect(await new CdmDatapointsService(client).getLatest(ID)).toBeUndefined();
    });

    it('propagates API errors', async () => {
      vi.mocked(client.datapoints.retrieveLatest).mockRejectedValue(new Error('boom'));

      await expect(new CdmDatapointsService(client).getLatest(ID)).rejects.toThrow('boom');
    });
  });
});

function aggregates(datapoints: DatapointAggregates['datapoints']): DatapointAggregates {
  return { id: 1, isString: false, isStep: false, datapoints };
}
