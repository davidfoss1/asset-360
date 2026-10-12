import type { NodeDefinition, RawPropertyValueV3 } from '@cognite/sdk';

import type { ViewRef } from '../config/model';

type MakeNodeOptions = {
  externalId?: string;
  space?: string;
  view?: ViewRef;
  properties?: Record<string, RawPropertyValueV3>;
};

/** Builds a node as returned by the instances API, with view properties under the view key. */
export function makeNode({
  externalId = 'node-1',
  space = 'instances-space',
  view,
  properties,
}: MakeNodeOptions): NodeDefinition {
  return {
    instanceType: 'node',
    space,
    externalId,
    version: 1,
    createdTime: 0,
    lastUpdatedTime: 0,
    ...(view && properties
      ? { properties: { [view.space]: { [`${view.externalId}/${view.version}`]: properties } } }
      : {}),
  };
}
