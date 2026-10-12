import { describe, expect, it } from 'vitest';

import { toLoadStatus } from './loadStatus';

const isEmpty = (data: string[]) => data.length === 0;

describe(toLoadStatus.name, () => {
  it('is idle when the query is disabled and has no data', () => {
    expect(toLoadStatus({ data: undefined, status: 'pending', fetchStatus: 'idle' }, isEmpty)).toBe('idle');
  });

  it('is loading while the first fetch is in flight', () => {
    expect(toLoadStatus({ data: undefined, status: 'pending', fetchStatus: 'fetching' }, isEmpty)).toBe('loading');
  });

  it('is success when data is present', () => {
    expect(toLoadStatus({ data: ['a'], status: 'success', fetchStatus: 'idle' }, isEmpty)).toBe('success');
  });

  it('is empty when data is present but empty', () => {
    expect(toLoadStatus({ data: [], status: 'success', fetchStatus: 'idle' }, isEmpty)).toBe('empty');
  });

  it('is error when the fetch failed and there is no data', () => {
    expect(toLoadStatus({ data: undefined, status: 'error', fetchStatus: 'idle' }, isEmpty)).toBe('error');
  });

  it('keeps showing stale data when a background refetch fails', () => {
    expect(toLoadStatus({ data: ['a'], status: 'error', fetchStatus: 'idle' }, isEmpty)).toBe('success');
  });
});
