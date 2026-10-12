import type { NodeOrEdge, RawPropertyValueV3 } from '@cognite/sdk';

// The only place view ids and property keys live. The app reads standard Cognite
// Core Data Model views in `cdf_cdm` only.

export const CDM_SPACE = 'cdf_cdm';
const CDM_VERSION = 'v1';

export type ViewRef = { type: 'view'; space: string; externalId: string; version: string };

function cdmView(externalId: string): ViewRef {
  return { type: 'view', space: CDM_SPACE, externalId, version: CDM_VERSION };
}

export const VIEWS = {
  asset: cdmView('CogniteAsset'),
  assetClass: cdmView('CogniteAssetClass'),
  assetType: cdmView('CogniteAssetType'),
  timeSeries: cdmView('CogniteTimeSeries'),
  unit: cdmView('CogniteUnit'),
  file: cdmView('CogniteFile'),
  activity: cdmView('CogniteActivity'),
};

/** Properties a node holds for one view, or undefined if it has no data for that view. */
export function getViewProperties(node: NodeOrEdge, view: ViewRef): Record<string, RawPropertyValueV3> | undefined {
  return node.properties?.[view.space]?.[`${view.externalId}/${view.version}`];
}
