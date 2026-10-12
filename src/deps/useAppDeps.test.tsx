import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeDeps } from '../__mocks__/viewModelWrapper';

import { AppDepsContext } from './AppDepsContext';
import { useAppDeps } from './useAppDeps';

describe(useAppDeps.name, () => {
  beforeEach(() => {
    // React logs the error a hook throws while rendering; keep the test output readable.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the dependencies from the provider', () => {
    const deps = makeDeps();

    const { result } = renderHook(() => useAppDeps(), {
      wrapper: ({ children }: { children: ReactNode }) => <AppDepsContext.Provider value={deps}>{children}</AppDepsContext.Provider>,
    });

    expect(result.current).toBe(deps);
  });

  it('fails clearly when used outside a provider', () => {
    expect(() => renderHook(() => useAppDeps())).toThrow('useAppDeps must be used inside an AppDepsProvider');
  });
});
