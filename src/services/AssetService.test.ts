import type { ByIdsResponse } from '@cognite/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeNode } from '../__mocks__/nodes';
import { makeCountingRunner, runImmediately } from '../__mocks__/taskRunner';
import { VIEWS } from '../config/model';

import { CdmAssetService, type AssetClient } from './AssetService';

describe(CdmAssetService.name, () => {
  let client: AssetClient;

  beforeEach(() => {
    client = {
      instances: {
        search: vi.fn<AssetClient['instances']['search']>(),
        retrieve: vi.fn<AssetClient['instances']['retrieve']>(),
      },
    };
  });

  it('sends every SDK call through the task runner', async () => {
    // Arrange
    const { run, count } = makeCountingRunner();
    vi.mocked(client.instances.search).mockResolvedValue(response([]));
    vi.mocked(client.instances.retrieve).mockResolvedValue(response([assetNode('pump-101', { name: 'PUMP-101' })]));
    const service = new CdmAssetService(client, run);

    // Act
    await service.search('pump');
    await service.get({ space: 'instances-space', externalId: 'pump-101' });

    // Assert
    expect(count()).toBe(2);
  });

  describe('search', () => {
    it('searches the CogniteAsset view and maps results', async () => {
      // Arrange
      vi.mocked(client.instances.search).mockResolvedValue(
        response([assetNode('pump-101', { name: 'PUMP-101', description: 'Feed pump' })])
      );

      // Act
      const { items } = await new CdmAssetService(client, runImmediately).search('pump');

      // Assert
      expect(client.instances.search).toHaveBeenCalledWith(
        expect.objectContaining({ view: VIEWS.asset, query: 'pump', properties: ['name', 'description', 'aliases'] })
      );
      expect(items).toEqual([
        { id: { space: 'instances-space', externalId: 'pump-101' }, name: 'PUMP-101', description: 'Feed pump' },
      ]);
    });

    it('does not call the API for a blank query', async () => {
      const results = await new CdmAssetService(client, runImmediately).search('   ');

      expect(results).toEqual({ items: [], limited: false });
      expect(client.instances.search).not.toHaveBeenCalled();
    });

    it('keeps only assets matching every query token, ignoring case', async () => {
      // Arrange: the API default operator may be OR, so partial matches can come back
      vi.mocked(client.instances.search).mockResolvedValue(
        response([
          assetNode('a', { name: 'Feed Pump 101' }),
          assetNode('b', { name: 'Feed Tank 7' }),
          assetNode('c', { name: 'Booster', description: 'Backup pump for 101', aliases: [] }),
          assetNode('d', { name: 'Other', aliases: ['pump-101'] }),
        ])
      );

      // Act
      const { items } = await new CdmAssetService(client, runImmediately).search('PUMP 101');

      // Assert
      expect(items.map((r) => r.id.externalId)).toEqual(['a', 'c', 'd']);
    });

    it('is not limited when the API returned fewer results than it can', async () => {
      vi.mocked(client.instances.search).mockResolvedValue(response([assetNode('a', { name: 'Pump' })]));

      const result = await new CdmAssetService(client, runImmediately).search('pump');

      expect(result.limited).toBe(false);
    });

    it('is limited when every one of the most results the API can return matches, since there may be more', async () => {
      // Arrange: the API cannot page, and nothing was filtered out, so matches may continue past these
      const full = Array.from({ length: 50 }, (_, i) => assetNode(`a${i}`, { name: `Pump ${i}` }));
      vi.mocked(client.instances.search).mockResolvedValue(response(full));

      // Act
      const result = await new CdmAssetService(client, runImmediately).search('pump');

      // Assert
      expect(result.items).toHaveLength(50);
      expect(result.limited).toBe(true);
    });

    it('is not limited when the API returned its most but some did not match every word', async () => {
      // Arrange: the API ranks by relevance, so once partial matches appear the full matches are used up
      const full = Array.from({ length: 50 }, (_, i) => assetNode(`a${i}`, { name: i < 3 ? `Pump 101 ${i}` : `Tank ${i}` }));
      vi.mocked(client.instances.search).mockResolvedValue(response(full));

      // Act
      const result = await new CdmAssetService(client, runImmediately).search('pump 101');

      // Assert
      expect(result.items).toHaveLength(3);
      expect(result.limited).toBe(false);
    });

    it('is not limited when the API returned its most and none matched every word', async () => {
      const full = Array.from({ length: 50 }, (_, i) => assetNode(`a${i}`, { name: `Tank ${i}` }));
      vi.mocked(client.instances.search).mockResolvedValue(response(full));

      const result = await new CdmAssetService(client, runImmediately).search('pump 101');

      expect(result.items).toEqual([]);
      expect(result.limited).toBe(false);
    });

    it('falls back to the externalId when an asset has no name', async () => {
      vi.mocked(client.instances.search).mockResolvedValue(response([assetNode('x-1', { description: 'tag x-1' })]));

      const { items } = await new CdmAssetService(client, runImmediately).search('x-1');

      expect(items[0]?.name).toBe('x-1');
    });

    it('propagates API errors', async () => {
      vi.mocked(client.instances.search).mockRejectedValue(new Error('boom'));

      await expect(new CdmAssetService(client, runImmediately).search('pump')).rejects.toThrow('boom');
    });
  });

  describe('get', () => {
    const id = { space: 'instances-space', externalId: 'pump-101' };

    it('retrieves the asset and resolves parent, class and type names', async () => {
      // Arrange
      const nodes = new Map([
        [
          'pump-101',
          assetNode('pump-101', {
            name: 'PUMP-101',
            description: 'Feed pump',
            parent: { space: 'instances-space', externalId: 'station' },
            assetClass: { space: 'classes', externalId: 'pump' },
            type: { space: 'types', externalId: 'centrifugal' },
          }),
        ],
        ['station', assetNode('station', { name: 'Pump station' })],
        ['pump', viewNode('pump', 'classes', VIEWS.assetClass, { name: 'Pump' })],
        ['centrifugal', viewNode('centrifugal', 'types', VIEWS.assetType, { name: 'Centrifugal pump' })],
      ]);
      vi.mocked(client.instances.retrieve).mockImplementation(({ items }) => {
        const node = nodes.get(items[0]?.externalId ?? '');
        return Promise.resolve(response(node ? [node] : []));
      });

      // Act
      const asset = await new CdmAssetService(client, runImmediately).get(id);

      // Assert
      expect(asset).toEqual({
        id,
        name: 'PUMP-101',
        description: 'Feed pump',
        parentName: 'Pump station',
        assetClass: 'Pump',
        assetType: 'Centrifugal pump',
      });
    });

    it('returns undefined when the asset does not exist', async () => {
      vi.mocked(client.instances.retrieve).mockResolvedValue(response([]));

      expect(await new CdmAssetService(client, runImmediately).get(id)).toBeUndefined();
    });

    it('skips related lookups for an asset without parent, class or type', async () => {
      vi.mocked(client.instances.retrieve).mockResolvedValue(response([assetNode('pump-101', { name: 'PUMP-101' })]));

      const asset = await new CdmAssetService(client, runImmediately).get(id);

      expect(client.instances.retrieve).toHaveBeenCalledTimes(1);
      expect(asset).toMatchObject({ name: 'PUMP-101', parentName: undefined, assetClass: undefined });
    });

    it('propagates API errors', async () => {
      vi.mocked(client.instances.retrieve).mockRejectedValue(new Error('boom'));

      await expect(new CdmAssetService(client, runImmediately).get(id)).rejects.toThrow('boom');
    });
  });
});

function response(items: ByIdsResponse['items']): ByIdsResponse {
  return { items };
}

function assetNode(externalId: string, properties: Parameters<typeof makeNode>[0]['properties']) {
  return viewNode(externalId, 'instances-space', VIEWS.asset, properties);
}

function viewNode(
  externalId: string,
  space: string,
  view: typeof VIEWS.asset,
  properties: Parameters<typeof makeNode>[0]['properties']
) {
  return makeNode({ externalId, space, view, properties });
}
