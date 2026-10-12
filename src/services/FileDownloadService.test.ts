import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CdmFileDownloadService, type FileDownloadClient } from './FileDownloadService';

const ID = { space: 'instances-space', externalId: 'pid' };

describe(CdmFileDownloadService.name, () => {
  let client: FileDownloadClient;

  beforeEach(() => {
    client = { files: { getDownloadUrls: vi.fn<FileDownloadClient['files']['getDownloadUrls']>() } };
  });

  it('requests the download link by instance id', async () => {
    vi.mocked(client.files.getDownloadUrls).mockResolvedValue([{ instanceId: ID, downloadUrl: 'https://files.test/a' }]);

    await new CdmFileDownloadService(client).getDownloadUrl(ID);

    expect(client.files.getDownloadUrls).toHaveBeenCalledWith([{ instanceId: ID }]);
  });

  it('returns the download url', async () => {
    vi.mocked(client.files.getDownloadUrls).mockResolvedValue([{ instanceId: ID, downloadUrl: 'https://files.test/a' }]);

    expect(await new CdmFileDownloadService(client).getDownloadUrl(ID)).toBe('https://files.test/a');
  });

  it('throws when the API returns no link for the file', async () => {
    vi.mocked(client.files.getDownloadUrls).mockResolvedValue([]);

    await expect(new CdmFileDownloadService(client).getDownloadUrl(ID)).rejects.toThrow(/no download link/i);
  });

  it('propagates API errors', async () => {
    vi.mocked(client.files.getDownloadUrls).mockRejectedValue(new Error('boom'));

    await expect(new CdmFileDownloadService(client).getDownloadUrl(ID)).rejects.toThrow('boom');
  });
});
