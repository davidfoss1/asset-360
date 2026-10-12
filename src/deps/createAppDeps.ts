import type { HostAppAPI } from '@cognite/app-sdk';
import type { CogniteClient } from '@cognite/sdk';

import { createAssetService } from '../services/AssetService';
import { createDatapointsService } from '../services/DatapointsService';
import { createFileDownloadService } from '../services/FileDownloadService';
import { createRelatedDataService } from '../services/RelatedDataService';

import type { AppDeps } from './AppDepsContext';

/** The part of the host API the app dependencies need. */
export type AppHost = Pick<HostAppAPI, 'navigateExternal'>;

/** Wires the real services to the authenticated SDK client and the host. */
export function createAppDeps(client: CogniteClient, host: AppHost): AppDeps {
  return {
    assets: createAssetService(client),
    related: createRelatedDataService(client),
    datapoints: createDatapointsService(client),
    files: createFileDownloadService(client),
    // Hand the browser a signed URL in a new tab; the host only allows https.
    openExternal: async (url) => {
      await host.navigateExternal({ url, openInNewTab: true });
    },
  };
}
