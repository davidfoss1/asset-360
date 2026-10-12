import { describe, expect, it } from 'vitest';

import { DEFAULT_APP_STATE, parseAppState, serializeAppState, type AppState } from './appState';

const ASSET = { space: 'instances-space', externalId: 'pump-101' };
const SERIES = { space: 'instances-space', externalId: 'pump-101-pressure' };
const FILE = { space: 'instances-space', externalId: 'pid.pdf' };

describe(parseAppState.name, () => {
  it('returns the default state when there is no initial state', () => {
    expect(parseAppState(undefined)).toEqual(DEFAULT_APP_STATE);
    expect(parseAppState('')).toEqual(DEFAULT_APP_STATE);
  });

  it('restores a full state', () => {
    // Arrange
    const state: AppState = { query: 'pump', assetId: ASSET, timeSeriesId: SERIES, fileId: FILE, tab: 'files' };

    // Act / Assert
    expect(parseAppState(JSON.stringify(state))).toEqual(state);
  });

  it('returns the default state for malformed JSON', () => {
    expect(parseAppState('{not json')).toEqual(DEFAULT_APP_STATE);
  });

  it('returns the default state when the JSON is not an object', () => {
    expect(parseAppState('42')).toEqual(DEFAULT_APP_STATE);
    expect(parseAppState('null')).toEqual(DEFAULT_APP_STATE);
    expect(parseAppState('[]')).toEqual(DEFAULT_APP_STATE);
  });

  it('keeps valid fields and defaults the invalid ones', () => {
    // Arrange: query has the wrong type, assetId is incomplete, timeSeriesId is valid
    const saved = JSON.stringify({ query: 7, assetId: { space: 'x' }, timeSeriesId: SERIES });

    // Act / Assert
    expect(parseAppState(saved)).toEqual({ query: '', assetId: null, timeSeriesId: SERIES, fileId: null, tab: 'activities' });
  });

  it('defaults an unknown tab', () => {
    expect(parseAppState(JSON.stringify({ tab: 'charts' })).tab).toBe('activities');
  });

  it('ignores unknown fields', () => {
    expect(parseAppState(JSON.stringify({ query: 'a', openStep: 'Plan' }))).toEqual({
      ...DEFAULT_APP_STATE,
      query: 'a',
    });
  });
});

describe(serializeAppState.name, () => {
  it('round-trips through parseAppState', () => {
    const state: AppState = { query: 'pump 101', assetId: ASSET, timeSeriesId: null, fileId: FILE, tab: 'files' };

    expect(parseAppState(serializeAppState(state))).toEqual(state);
  });
});
