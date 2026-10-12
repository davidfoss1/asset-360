import type { CogniteClient, FilterDefinition, NodeOrEdge } from '@cognite/sdk';

import { VIEWS, getViewProperties, type ViewRef } from '../config/model';
import { readInstanceRef, readString, type InstanceRef } from '../lib/properties';
import type { TaskRunner } from '../lib/taskRunner';

export type TimeSeriesType = 'numeric' | 'string' | 'state';
export type TimeSeriesItem = { id: InstanceRef; name: string; type: TimeSeriesType; unit?: string };

export type ActivityItem = {
  id: InstanceRef;
  name: string;
  description?: string;
  startTime?: number;
  endTime?: number;
  scheduledStartTime?: number;
  scheduledEndTime?: number;
};

export type FileItem = {
  id: InstanceRef;
  name: string;
  mimeType?: string;
  directory?: string;
  isUploaded: boolean;
};

export interface RelatedDataService {
  listTimeSeries(asset: InstanceRef): Promise<TimeSeriesItem[]>;
  listActivities(asset: InstanceRef): Promise<ActivityItem[]>;
  listFiles(asset: InstanceRef): Promise<FileItem[]>;
}

/** The subset of the SDK this service needs. */
export type RelatedDataClient = { instances: Pick<CogniteClient['instances'], 'list' | 'retrieve'> };

const LIST_LIMIT = 100;
const ACTIVITY_LIMIT = 25;

export class CdmRelatedDataService implements RelatedDataService {
  constructor(
    private readonly client: RelatedDataClient,
    private readonly run: TaskRunner
  ) {}

  async listTimeSeries(asset: InstanceRef): Promise<TimeSeriesItem[]> {
    const nodes = await this.listByAsset(VIEWS.timeSeries, asset);
    const unitRefs = uniqueRefs(nodes.map((node) => readInstanceRef(getViewProperties(node, VIEWS.timeSeries), 'unit')));
    const unitSymbols = await this.resolveUnitSymbols(unitRefs);

    return nodes.map((node) => {
      const properties = getViewProperties(node, VIEWS.timeSeries);
      const unitRef = readInstanceRef(properties, 'unit');
      return {
        id: toRef(node),
        name: readString(properties, 'name') ?? node.externalId,
        type: toTimeSeriesType(readString(properties, 'type')),
        unit: (unitRef && unitSymbols.get(refKey(unitRef))) ?? readString(properties, 'sourceUnit'),
      };
    });
  }

  async listActivities(asset: InstanceRef): Promise<ActivityItem[]> {
    const nodes = await this.listByAsset(VIEWS.activity, asset);
    return nodes
      .map((node): ActivityItem => {
        const properties = getViewProperties(node, VIEWS.activity);
        return {
          id: toRef(node),
          name: readString(properties, 'name') ?? node.externalId,
          description: readString(properties, 'description'),
          startTime: readTime(properties, 'startTime'),
          endTime: readTime(properties, 'endTime'),
          scheduledStartTime: readTime(properties, 'scheduledStartTime'),
          scheduledEndTime: readTime(properties, 'scheduledEndTime'),
        };
      })
      .sort((a, b) => sortTime(b) - sortTime(a))
      .slice(0, ACTIVITY_LIMIT);
  }

  async listFiles(asset: InstanceRef): Promise<FileItem[]> {
    const nodes = await this.listByAsset(VIEWS.file, asset);
    return nodes.map((node) => {
      const properties = getViewProperties(node, VIEWS.file);
      return {
        id: toRef(node),
        name: readString(properties, 'name') ?? node.externalId,
        mimeType: readString(properties, 'mimeType'),
        directory: readString(properties, 'directory'),
        isUploaded: properties?.isUploaded === true,
      };
    });
  }

  /** Nodes of `view` whose `assets` direct-relation list contains the asset. */
  private async listByAsset(view: ViewRef, asset: InstanceRef): Promise<NodeOrEdge[]> {
    const filter: FilterDefinition = {
      containsAny: { property: [view.space, `${view.externalId}/${view.version}`, 'assets'], values: [asset] },
    };
    const { items } = await this.run(() =>
      this.client.instances.list({
        instanceType: 'node',
        sources: [{ source: view }],
        filter,
        limit: LIST_LIMIT,
      })
    );
    return items;
  }

  private async resolveUnitSymbols(refs: InstanceRef[]): Promise<Map<string, string>> {
    const symbols = new Map<string, string>();
    if (refs.length === 0) return symbols;

    const { items } = await this.run(() =>
      this.client.instances.retrieve({
        items: refs.map((ref) => ({ instanceType: 'node', ...ref })),
        sources: [{ source: VIEWS.unit }],
      })
    );
    for (const node of items) {
      const properties = getViewProperties(node, VIEWS.unit);
      const symbol = readString(properties, 'symbol') ?? readString(properties, 'name');
      if (symbol) symbols.set(refKey(toRef(node)), symbol);
    }
    return symbols;
  }
}

function toRef(node: NodeOrEdge): InstanceRef {
  return { space: node.space, externalId: node.externalId };
}

function refKey({ space, externalId }: InstanceRef): string {
  return `${space}/${externalId}`;
}

function uniqueRefs(refs: Array<InstanceRef | undefined>): InstanceRef[] {
  const byKey = new Map<string, InstanceRef>();
  for (const ref of refs) {
    if (ref) byKey.set(refKey(ref), ref);
  }
  return [...byKey.values()];
}

function toTimeSeriesType(value: string | undefined): TimeSeriesType {
  return value === 'string' || value === 'state' ? value : 'numeric';
}

function readTime(properties: Parameters<typeof readString>[0], key: string): number | undefined {
  const value = readString(properties, key);
  const time = value === undefined ? NaN : Date.parse(value);
  return Number.isNaN(time) ? undefined : time;
}

/** Most recent first; activities with no dates sort last. */
function sortTime(activity: ActivityItem): number {
  return activity.startTime ?? activity.scheduledStartTime ?? 0;
}

/** The only way other modules get the implementation. */
export function createRelatedDataService(client: RelatedDataClient, run: TaskRunner): RelatedDataService {
  return new CdmRelatedDataService(client, run);
}
