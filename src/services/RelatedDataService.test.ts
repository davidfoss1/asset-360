import type { ByIdsResponse, NodeAndEdgeCollectionResponseWithCursorV3Response } from '@cognite/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeNode } from '../__mocks__/nodes';
import { makeCountingRunner, runImmediately } from '../__mocks__/taskRunner';
import { VIEWS, type ViewRef } from '../config/model';

import { CdmRelatedDataService, type RelatedDataClient } from './RelatedDataService';

const ASSET = { space: 'instances-space', externalId: 'pump-101' };

describe(CdmRelatedDataService.name, () => {
  let client: RelatedDataClient;

  beforeEach(() => {
    client = {
      instances: {
        list: vi.fn<RelatedDataClient['instances']['list']>(),
        retrieve: vi.fn<RelatedDataClient['instances']['retrieve']>(),
      },
    };
  });

  it('sends every SDK call through the task runner', async () => {
    // Arrange
    const { run, count } = makeCountingRunner();
    const unit = { space: 'cdf_cdm', externalId: 'bar' };
    vi.mocked(client.instances.list).mockResolvedValue(
      listResponse([node('ts-1', VIEWS.timeSeries, { name: 'Pressure', type: 'numeric', unit })])
    );
    vi.mocked(client.instances.retrieve).mockResolvedValue(retrieveResponse([]));

    // Act
    await new CdmRelatedDataService(client, run).listTimeSeries(ASSET);

    // Assert: one list, one unit lookup
    expect(count()).toBe(2);
  });

  describe('listTimeSeries', () => {
    it('lists CogniteTimeSeries whose assets contain the asset', async () => {
      // Arrange
      vi.mocked(client.instances.list).mockResolvedValue(listResponse([]));

      // Act
      await new CdmRelatedDataService(client, runImmediately).listTimeSeries(ASSET);

      // Assert
      expect(client.instances.list).toHaveBeenCalledWith(
        expect.objectContaining({
          instanceType: 'node',
          sources: [{ source: VIEWS.timeSeries }],
          filter: { containsAny: { property: ['cdf_cdm', 'CogniteTimeSeries/v1', 'assets'], values: [ASSET] } },
        })
      );
    });

    it('maps type, and resolves the unit symbol in one batched lookup', async () => {
      // Arrange
      const unit = { space: 'cdf_cdm', externalId: 'bar' };
      vi.mocked(client.instances.list).mockResolvedValue(
        listResponse([
          node('ts-1', VIEWS.timeSeries, { name: 'Pressure', type: 'numeric', unit }),
          node('ts-2', VIEWS.timeSeries, { name: 'Outlet pressure', type: 'numeric', unit }),
          node('ts-3', VIEWS.timeSeries, { name: 'Status', type: 'state' }),
        ])
      );
      vi.mocked(client.instances.retrieve).mockResolvedValue(
        retrieveResponse([node('bar', VIEWS.unit, { symbol: 'bar', name: 'Bar' }, 'cdf_cdm')])
      );

      // Act
      const items = await new CdmRelatedDataService(client, runImmediately).listTimeSeries(ASSET);

      // Assert
      expect(client.instances.retrieve).toHaveBeenCalledTimes(1);
      expect(client.instances.retrieve).toHaveBeenCalledWith({
        items: [{ instanceType: 'node', ...unit }],
        sources: [{ source: VIEWS.unit }],
      });
      expect(items.map(({ name, type, unit: u }) => ({ name, type, unit: u }))).toEqual([
        { name: 'Pressure', type: 'numeric', unit: 'bar' },
        { name: 'Outlet pressure', type: 'numeric', unit: 'bar' },
        { name: 'Status', type: 'state', unit: undefined },
      ]);
    });

    it('falls back to sourceUnit when there is no unit relation', async () => {
      vi.mocked(client.instances.list).mockResolvedValue(
        listResponse([node('ts-1', VIEWS.timeSeries, { name: 'Temp', type: 'numeric', sourceUnit: 'degC' })])
      );

      const items = await new CdmRelatedDataService(client, runImmediately).listTimeSeries(ASSET);

      expect(client.instances.retrieve).not.toHaveBeenCalled();
      expect(items[0]?.unit).toBe('degC');
    });

    it('defaults an unknown or missing type to numeric', async () => {
      vi.mocked(client.instances.list).mockResolvedValue(
        listResponse([node('a', VIEWS.timeSeries, { name: 'A' }), node('b', VIEWS.timeSeries, { name: 'B', type: 'weird' })])
      );

      const items = await new CdmRelatedDataService(client, runImmediately).listTimeSeries(ASSET);

      expect(items.map((i) => i.type)).toEqual(['numeric', 'numeric']);
    });

    it('propagates API errors', async () => {
      vi.mocked(client.instances.list).mockRejectedValue(new Error('boom'));

      await expect(new CdmRelatedDataService(client, runImmediately).listTimeSeries(ASSET)).rejects.toThrow('boom');
    });
  });

  describe('listActivities', () => {
    it('lists CogniteActivity whose assets contain the asset', async () => {
      vi.mocked(client.instances.list).mockResolvedValue(listResponse([]));

      await new CdmRelatedDataService(client, runImmediately).listActivities(ASSET, 25);

      expect(client.instances.list).toHaveBeenCalledWith(
        expect.objectContaining({
          sources: [{ source: VIEWS.activity }],
          filter: { containsAny: { property: ['cdf_cdm', 'CogniteActivity/v1', 'assets'], values: [ASSET] } },
        })
      );
    });

    it('asks the API for the most recent first, by start then scheduled start, undated last', async () => {
      vi.mocked(client.instances.list).mockResolvedValue(listResponse([]));

      await new CdmRelatedDataService(client, runImmediately).listActivities(ASSET, 25);

      expect(client.instances.list).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: [
            { property: ['cdf_cdm', 'CogniteActivity/v1', 'startTime'], direction: 'descending', nullsFirst: false },
            { property: ['cdf_cdm', 'CogniteActivity/v1', 'scheduledStartTime'], direction: 'descending', nullsFirst: false },
          ],
        })
      );
    });

    it('asks for one more than the limit, to learn whether there is more', async () => {
      vi.mocked(client.instances.list).mockResolvedValue(listResponse([]));

      await new CdmRelatedDataService(client, runImmediately).listActivities(ASSET, 25);

      expect(client.instances.list).toHaveBeenCalledWith(expect.objectContaining({ limit: 26 }));
    });

    it('keeps the order the API returned and parses timestamps', async () => {
      // Arrange
      vi.mocked(client.instances.list).mockResolvedValue(
        listResponse([
          node('new', VIEWS.activity, {
            name: 'New',
            description: 'Seal change',
            startTime: '2026-09-01T00:00:00.000Z',
            endTime: '2026-09-02T00:00:00.000Z',
          }),
          node('old', VIEWS.activity, { name: 'Old', startTime: '2026-01-01T00:00:00.000Z' }),
          node('planned', VIEWS.activity, { name: 'Planned', scheduledStartTime: '2026-06-01T00:00:00.000Z' }),
        ])
      );

      // Act
      const { items } = await new CdmRelatedDataService(client, runImmediately).listActivities(ASSET, 25);

      // Assert
      expect(items.map((i) => i.name)).toEqual(['New', 'Old', 'Planned']);
      expect(items[0]).toMatchObject({
        description: 'Seal change',
        startTime: Date.parse('2026-09-01T00:00:00.000Z'),
        endTime: Date.parse('2026-09-02T00:00:00.000Z'),
      });
      expect(items[2]).toMatchObject({ scheduledStartTime: Date.parse('2026-06-01T00:00:00.000Z') });
    });

    it('ignores unparseable timestamps', async () => {
      vi.mocked(client.instances.list).mockResolvedValue(
        listResponse([node('a', VIEWS.activity, { name: 'A', startTime: 'not a date' })])
      );

      const { items } = await new CdmRelatedDataService(client, runImmediately).listActivities(ASSET, 25);

      expect(items[0]?.startTime).toBeUndefined();
    });

    it('has no more when the API returns no more than the limit', async () => {
      const exact = Array.from({ length: 25 }, (_, i) => node(`a${i}`, VIEWS.activity, { name: `A${i}` }));
      vi.mocked(client.instances.list).mockResolvedValue(listResponse(exact));

      const result = await new CdmRelatedDataService(client, runImmediately).listActivities(ASSET, 25);

      expect(result.items).toHaveLength(25);
      expect(result.hasMore).toBe(false);
    });

    it('returns only the limit and reports more when the API returned the extra one', async () => {
      const extra = Array.from({ length: 26 }, (_, i) => node(`a${i}`, VIEWS.activity, { name: `A${i}` }));
      vi.mocked(client.instances.list).mockResolvedValue(listResponse(extra));

      const result = await new CdmRelatedDataService(client, runImmediately).listActivities(ASSET, 25);

      expect(result.items).toHaveLength(25);
      expect(result.items[24]?.name).toBe('A24');
      expect(result.hasMore).toBe(true);
    });

    it('propagates API errors', async () => {
      vi.mocked(client.instances.list).mockRejectedValue(new Error('boom'));

      await expect(new CdmRelatedDataService(client, runImmediately).listActivities(ASSET, 25)).rejects.toThrow('boom');
    });
  });

  describe('listFiles', () => {
    it('lists CogniteFile whose assets contain the asset and maps fields', async () => {
      // Arrange
      vi.mocked(client.instances.list).mockResolvedValue(
        listResponse([
          node('f1', VIEWS.file, { name: 'P&ID.pdf', mimeType: 'application/pdf', directory: '/pid', isUploaded: true }),
          node('f2', VIEWS.file, { name: 'pending.pdf' }),
        ])
      );

      // Act
      const items = await new CdmRelatedDataService(client, runImmediately).listFiles(ASSET);

      // Assert
      expect(client.instances.list).toHaveBeenCalledWith(
        expect.objectContaining({
          sources: [{ source: VIEWS.file }],
          filter: { containsAny: { property: ['cdf_cdm', 'CogniteFile/v1', 'assets'], values: [ASSET] } },
        })
      );
      expect(items).toEqual([
        {
          id: { space: 'instances-space', externalId: 'f1' },
          name: 'P&ID.pdf',
          mimeType: 'application/pdf',
          directory: '/pid',
          isUploaded: true,
        },
        {
          id: { space: 'instances-space', externalId: 'f2' },
          name: 'pending.pdf',
          mimeType: undefined,
          directory: undefined,
          isUploaded: false,
        },
      ]);
    });

    it('propagates API errors', async () => {
      vi.mocked(client.instances.list).mockRejectedValue(new Error('boom'));

      await expect(new CdmRelatedDataService(client, runImmediately).listFiles(ASSET)).rejects.toThrow('boom');
    });
  });
});

function node(
  externalId: string,
  view: ViewRef,
  properties: Parameters<typeof makeNode>[0]['properties'],
  space = 'instances-space'
) {
  return makeNode({ externalId, space, view, properties });
}

function listResponse(items: ByIdsResponse['items']): NodeAndEdgeCollectionResponseWithCursorV3Response {
  return { items };
}

function retrieveResponse(items: ByIdsResponse['items']): ByIdsResponse {
  return { items };
}
