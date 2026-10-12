import { isInstanceRef, type InstanceRef } from '../lib/properties';

export type AssetTab = 'activities' | 'files';

export function isAssetTab(value: unknown): value is AssetTab {
  return value === 'activities' || value === 'files';
}

/** UI state that survives reload and shared links; synced to the host URL. */
export type AppState = {
  query: string;
  assetId: InstanceRef | null;
  timeSeriesId: InstanceRef | null;
  fileId: InstanceRef | null;
  tab: AssetTab;
};

export const DEFAULT_APP_STATE: AppState = { query: '', assetId: null, timeSeriesId: null, fileId: null, tab: 'activities' };

/**
 * Restores state from the host-provided `initialState` string. The host never validates it, so
 * anything malformed falls back field by field to the default.
 */
export function parseAppState(initialState: string | undefined): AppState {
  if (!initialState) return DEFAULT_APP_STATE;

  let parsed: unknown;
  try {
    parsed = JSON.parse(initialState);
  } catch {
    return DEFAULT_APP_STATE;
  }
  if (typeof parsed !== 'object' || parsed === null) return DEFAULT_APP_STATE;

  return {
    query: 'query' in parsed && typeof parsed.query === 'string' ? parsed.query : DEFAULT_APP_STATE.query,
    assetId: 'assetId' in parsed && isInstanceRef(parsed.assetId) ? toRef(parsed.assetId) : null,
    timeSeriesId: 'timeSeriesId' in parsed && isInstanceRef(parsed.timeSeriesId) ? toRef(parsed.timeSeriesId) : null,
    fileId: 'fileId' in parsed && isInstanceRef(parsed.fileId) ? toRef(parsed.fileId) : null,
    tab: 'tab' in parsed && isAssetTab(parsed.tab) ? parsed.tab : DEFAULT_APP_STATE.tab,
  };
}

export function serializeAppState(state: AppState): string {
  return JSON.stringify(state);
}

function toRef({ space, externalId }: InstanceRef): InstanceRef {
  return { space, externalId };
}
