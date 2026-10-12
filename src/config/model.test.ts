import { describe, expect, it } from 'vitest';

import { makeNode } from '../__mocks__/nodes';

import { CDM_SPACE, VIEWS, getViewProperties } from './model';

describe('VIEWS', () => {
  it('points every view at the cdf_cdm core data model space', () => {
    // Arrange / Act
    const spaces = Object.values(VIEWS).map((view) => view.space);

    // Assert
    expect(spaces.every((space) => space === CDM_SPACE)).toBe(true);
  });

  it('defines the views the app reads', () => {
    expect(Object.values(VIEWS).map((view) => view.externalId)).toEqual([
      'CogniteAsset',
      'CogniteAssetClass',
      'CogniteAssetType',
      'CogniteTimeSeries',
      'CogniteUnit',
      'CogniteFile',
      'CogniteActivity',
    ]);
  });
});

describe(getViewProperties.name, () => {
  it('returns the properties stored under the view key', () => {
    // Arrange
    const node = makeNode({ view: VIEWS.asset, properties: { name: 'PUMP-101' } });

    // Act
    const properties = getViewProperties(node, VIEWS.asset);

    // Assert
    expect(properties).toEqual({ name: 'PUMP-101' });
  });

  it('returns undefined when the node has no data for the view', () => {
    // Arrange
    const node = makeNode({ view: VIEWS.file, properties: { name: 'manual.pdf' } });

    // Act / Assert
    expect(getViewProperties(node, VIEWS.asset)).toBeUndefined();
  });

  it('returns undefined when the node has no properties at all', () => {
    // Arrange
    const node = makeNode({});

    // Act / Assert
    expect(getViewProperties(node, VIEWS.asset)).toBeUndefined();
  });
});
