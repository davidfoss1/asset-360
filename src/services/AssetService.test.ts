import type { ByIdsResponse } from '@cognite/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeNode } from '../__mocks__/nodes';
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

  describe('search', () => {
    it('searches the CogniteAsset view and maps results', async () => {
      // Arrange
      vi.mocked(client.instances.search).mockResolvedValue(
        response([assetNode('pump-101', { name: 'PUMP-101', description: 'Feed pump' })])
      );

      // Act
      const results = await new CdmAssetService(client).search('pump');

      // Assert
      expect(client.instances.search).toHaveBeenCalledWith(
        expect.objectContaining({ view: VIEWS.asset, query: 'pump', properties: ['name', 'description', 'aliases'] })
      );
      expect(results).toEqual([
        { id: { space: 'instances-space', externalId: 'pump-101' }, name: 'PUMP-101', description: 'Feed pump' },
      ]);
    });

    it('does not call the API for a blank query', async () => {
      const results = await new CdmAssetService(client).search('   ');

      expect(results).toEqual([]);
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
      const results = await new CdmAssetService(client).search('PUMP 101');

      // Assert
      expect(results.map((r) => r.id.externalId)).toEqual(['a', 'c', 'd']);
    });

    it('falls back to the externalId when an asset has no name', async () => {
      vi.mocked(client.instances.search).mockResolvedValue(response([assetNode('x-1', { description: 'tag x-1' })]));

      const results = await new CdmAssetService(client).search('x-1');

      expect(results[0]?.name).toBe('x-1');
    });

    it('propagates API errors', async () => {
      vi.mocked(client.instances.search).mockRejectedValue(new Error('boom'));

      await expect(new CdmAssetService(client).search('pump')).rejects.toThrow('boom');
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
      const asset = await new CdmAssetService(client).get(id);

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

      expect(await new CdmAssetService(client).get(id)).toBeUndefined();
    });

    it('skips related lookups for an asset without parent, class or type', async () => {
      vi.mocked(client.instances.retrieve).mockResolvedValue(response([assetNode('pump-101', { name: 'PUMP-101' })]));

      const asset = await new CdmAssetService(client).get(id);

      expect(client.instances.retrieve).toHaveBeenCalledTimes(1);
      expect(asset).toMatchObject({ name: 'PUMP-101', parentName: undefined, assetClass: undefined });
    });

    it('propagates API errors', async () => {
      vi.mocked(client.instances.retrieve).mockRejectedValue(new Error('boom'));

      await expect(new CdmAssetService(client).get(id)).rejects.toThrow('boom');
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
