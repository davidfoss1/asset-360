import type { HostAppAPI } from '@cognite/app-sdk';
import { CogniteClient } from '@cognite/sdk';
import { describe, expect, it, vi } from 'vitest';

import { createAppDeps, type AppHost } from './createAppDeps';

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
});
