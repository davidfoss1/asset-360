import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeCountingRunner, runImmediately } from '../__mocks__/taskRunner';

import { CdmFileDownloadService, type FileDownloadClient } from './FileDownloadService';

const ID = { space: 'instances-space', externalId: 'pid' };

describe(CdmFileDownloadService.name, () => {
  let client: FileDownloadClient;

  beforeEach(() => {
    client = { files: { getDownloadUrls: vi.fn<FileDownloadClient['files']['getDownloadUrls']>() } };
  });

  it('sends the SDK call through the task runner', async () => {
    const { run, count } = makeCountingRunner();
    vi.mocked(client.files.getDownloadUrls).mockResolvedValue([{ instanceId: ID, downloadUrl: 'https://files.test/a' }]);

    await new CdmFileDownloadService(client, run).getDownloadUrl(ID);

    expect(count()).toBe(1);
  });

  it('requests the download link by instance id', async () => {
    vi.mocked(client.files.getDownloadUrls).mockResolvedValue([{ instanceId: ID, downloadUrl: 'https://files.test/a' }]);

    await new CdmFileDownloadService(client, runImmediately).getDownloadUrl(ID);

    expect(client.files.getDownloadUrls).toHaveBeenCalledWith([{ instanceId: ID }]);
  });

  it('returns the download url', async () => {
    vi.mocked(client.files.getDownloadUrls).mockResolvedValue([{ instanceId: ID, downloadUrl: 'https://files.test/a' }]);

    expect(await new CdmFileDownloadService(client, runImmediately).getDownloadUrl(ID)).toBe('https://files.test/a');
  });

  it('throws when the API returns no link for the file', async () => {
    vi.mocked(client.files.getDownloadUrls).mockResolvedValue([]);

    await expect(new CdmFileDownloadService(client, runImmediately).getDownloadUrl(ID)).rejects.toThrow(/no download link/i);
  });

  it('propagates API errors', async () => {
    vi.mocked(client.files.getDownloadUrls).mockRejectedValue(new Error('boom'));

    await expect(new CdmFileDownloadService(client, runImmediately).getDownloadUrl(ID)).rejects.toThrow('boom');
  });
});
