import type { CogniteClient, NodeOrEdge } from '@cognite/sdk';

import { VIEWS, getViewProperties, type ViewRef } from '../config/model';
import {
  readInstanceRef,
  readString,
  readStringList,
  type InstanceRef,
} from '../lib/properties';
import type { TaskRunner } from '../lib/taskRunner';

export type AssetSummary = { id: InstanceRef; name: string; description?: string };

/** `limited`: the API returned as many results as it can and cannot page, so there may be more matches. */
export type AssetSearchResult = { items: AssetSummary[]; limited: boolean };

export type AssetDetail = AssetSummary & {
  parentName?: string;
  assetClass?: string;
  assetType?: string;
};

export interface AssetService {
  search(query: string): Promise<AssetSearchResult>;
  get(id: InstanceRef): Promise<AssetDetail | undefined>;
}

/** The subset of the SDK this service needs. */
export type AssetClient = { instances: Pick<CogniteClient['instances'], 'search' | 'retrieve'> };

const SEARCH_PROPERTIES = ['name', 'description', 'aliases'];
const SEARCH_LIMIT = 50;

export class CdmAssetService implements AssetService {
  constructor(
    private readonly client: AssetClient,
    private readonly run: TaskRunner
  ) {}

  async search(query: string): Promise<AssetSearchResult> {
    const tokens = tokenize(query);
    if (tokens.length === 0) return { items: [], limited: false };

    const { items } = await this.run(() =>
      this.client.instances.search({
        view: VIEWS.asset,
        query,
        properties: SEARCH_PROPERTIES,
        limit: SEARCH_LIMIT,
      })
    );

    // The SDK search request has no `operator`, and the API default is changing from OR to AND
    // (Nov 2026). Enforce AND here so behaviour is the same either side of the change.
    return {
      items: items.filter((node) => matchesAllTokens(node, tokens)).map(toSummary),
      // The SDK's search has no cursor, so a full response is the only sign of more.
      limited: items.length >= SEARCH_LIMIT,
    };
  }

  async get(id: InstanceRef): Promise<AssetDetail | undefined> {
    const node = await this.retrieveOne(id, VIEWS.asset);
    if (!node) return undefined;

    const properties = getViewProperties(node, VIEWS.asset);
    const [parent, assetClass, assetType] = await Promise.all([
      this.resolveName(readInstanceRef(properties, 'parent'), VIEWS.asset),
      this.resolveName(readInstanceRef(properties, 'assetClass'), VIEWS.assetClass),
      this.resolveName(readInstanceRef(properties, 'type'), VIEWS.assetType),
    ]);

    return { ...toSummary(node), parentName: parent, assetClass, assetType };
  }

  private async retrieveOne(id: InstanceRef, view: ViewRef): Promise<NodeOrEdge | undefined> {
    const { items } = await this.run(() =>
      this.client.instances.retrieve({
        items: [{ instanceType: 'node', ...id }],
        sources: [{ source: view }],
      })
    );
    return items[0];
  }

  private async resolveName(ref: InstanceRef | undefined, view: ViewRef): Promise<string | undefined> {
    if (!ref) return undefined;
    const node = await this.retrieveOne(ref, view);
    return node ? readString(getViewProperties(node, view), 'name') : undefined;
  }
}

function tokenize(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

function matchesAllTokens(node: NodeOrEdge, tokens: string[]): boolean {
  if (node.instanceType !== 'node') return false;
  const properties = getViewProperties(node, VIEWS.asset);
  const haystack = [
    readString(properties, 'name'),
    readString(properties, 'description'),
    ...readStringList(properties, 'aliases'),
  ]
    .join(' ')
    .toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

function toSummary(node: NodeOrEdge): AssetSummary {
  const properties = getViewProperties(node, VIEWS.asset);
  return {
    id: { space: node.space, externalId: node.externalId },
    name: readString(properties, 'name') ?? node.externalId,
    description: readString(properties, 'description'),
  };
}

/** The only way other modules get the implementation. */
export function createAssetService(client: AssetClient, run: TaskRunner): AssetService {
  return new CdmAssetService(client, run);
}
