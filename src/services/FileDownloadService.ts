import type { CogniteClient } from '@cognite/sdk';

import type { InstanceRef } from '../lib/properties';
import type { TaskRunner } from '../lib/taskRunner';

export interface FileDownloadService {
  /** A short-lived signed URL for the file's content. */
  getDownloadUrl(id: InstanceRef): Promise<string>;
}

/** The subset of the SDK this service needs. */
export type FileDownloadClient = { files: Pick<CogniteClient['files'], 'getDownloadUrls'> };

export class CdmFileDownloadService implements FileDownloadService {
  constructor(
    private readonly client: FileDownloadClient,
    private readonly run: TaskRunner
  ) {}

  async getDownloadUrl(id: InstanceRef): Promise<string> {
    const [link] = await this.run(() => this.client.files.getDownloadUrls([{ instanceId: id }]));
    if (!link) throw new Error(`No download link returned for ${id.space}/${id.externalId}`);
    return link.downloadUrl;
  }
}

/** The only way other modules get the implementation. */
export function createFileDownloadService(client: FileDownloadClient, run: TaskRunner): FileDownloadService {
  return new CdmFileDownloadService(client, run);
}
