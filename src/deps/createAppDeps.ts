import type { HostAppAPI } from '@cognite/app-sdk';
import type { CogniteClient } from '@cognite/sdk';

import { createTaskRunner } from '../lib/taskRunner';
import { createAssetService } from '../services/AssetService';
import { createDatapointsService } from '../services/DatapointsService';
import { createFileDownloadService } from '../services/FileDownloadService';
import { createRelatedDataService } from '../services/RelatedDataService';

import type { AppDeps } from './AppDepsContext';

/** The part of the host API the app dependencies need. */
export type AppHost = Pick<HostAppAPI, 'navigateExternal'>;

/** How many CDF requests may be in flight at once. A selection fans out to ~8, and several users share the project's limit. */
export const MAX_CONCURRENT_REQUESTS = 4;

/** Wires the real services to the authenticated SDK client and the host. */
export function createAppDeps(client: CogniteClient, host: AppHost): AppDeps {
  // One runner shared by every service, so the cap applies to the app as a whole.
  const run = createTaskRunner(MAX_CONCURRENT_REQUESTS);
  return {
    assets: createAssetService(client, run),
    related: createRelatedDataService(client, run),
    datapoints: createDatapointsService(client, run),
    files: createFileDownloadService(client, run),
    // Hand the browser a signed URL in a new tab; the host only allows https.
    openExternal: async (url) => {
      await host.navigateExternal({ url, openInNewTab: true });
    },
  };
}
