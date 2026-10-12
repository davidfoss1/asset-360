import type { HostAppAPI } from '@cognite/app-sdk';
import { CogniteClient } from '@cognite/sdk';
import { describe, expect, it, vi } from 'vitest';

import { MAX_CONCURRENT_REQUESTS, createAppDeps, type AppHost } from './createAppDeps';

function makeClient(): CogniteClient {
  return new CogniteClient({
    appId: 'test',
    project: 'test-project',
    baseUrl: 'https://cognite.test',
    getToken: () => Promise.resolve('token'),
  });
}

function makeHost(): AppHost {
  return { navigateExternal: vi.fn<HostAppAPI['navigateExternal']>(() => Promise.resolve(true)) };
}

describe(createAppDeps.name, () => {
  it('builds every service the view models use', () => {
    const deps = createAppDeps(makeClient(), makeHost());

    expect(deps.assets.search).toBeTypeOf('function');
    expect(deps.related.listFiles).toBeTypeOf('function');
    expect(deps.datapoints.getSeries).toBeTypeOf('function');
    expect(deps.files.getDownloadUrl).toBeTypeOf('function');
  });

  it('opens urls in a new tab through the host', async () => {
    // Arrange
    const host = makeHost();
    const deps = createAppDeps(makeClient(), host);

    // Act
    await deps.openExternal('https://files.test/a.pdf');

    // Assert
    expect(host.navigateExternal).toHaveBeenCalledWith({ url: 'https://files.test/a.pdf', openInNewTab: true });
  });

  it('caps the requests in flight across all services', async () => {
    // Arrange
    const client = makeClient();
    let inFlight = 0;
    let peak = 0;
    const releases: Array<() => void> = [];
    vi.spyOn(client.files, 'getDownloadUrls').mockImplementation(() => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      return new Promise((resolve) => {
        releases.push(() => {
          inFlight -= 1;
          resolve([{ instanceId: { space: 's', externalId: 'f' }, downloadUrl: 'https://files.test/f' }]);
        });
      });
    });
    const deps = createAppDeps(client, makeHost());

    // Act
    const downloads = Array.from({ length: MAX_CONCURRENT_REQUESTS * 2 }, () =>
      deps.files.getDownloadUrl({ space: 's', externalId: 'f' })
    );
    let completed = 0;
    while (completed < downloads.length) {
      await vi.waitFor(() => expect(releases.length).toBeGreaterThan(0));
      const batch = releases.splice(0);
      completed += batch.length;
      batch.forEach((release) => release());
    }
    await Promise.all(downloads);

    // Assert
    expect(peak).toBe(MAX_CONCURRENT_REQUESTS);
  });
});
