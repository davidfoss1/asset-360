import type { UseQueryResult } from '@tanstack/react-query';

/** What a section should render: a skeleton, an error, an empty state, or its content. */
export type LoadStatus = 'idle' | 'loading' | 'error' | 'empty' | 'success';

/**
 * Maps a react-query result to a LoadStatus. Data wins over errors, so a failed background refetch
 * (auto-refresh) keeps the last good data on screen instead of replacing it with an error.
 * Queries must resolve to a value (use `null` for "not found"); react-query rejects `undefined`.
 */
export function toLoadStatus<T>(
  query: Pick<UseQueryResult<T>, 'data' | 'status' | 'fetchStatus'>,
  isEmpty: (data: T) => boolean
): LoadStatus {
  if (query.data !== undefined) return isEmpty(query.data) ? 'empty' : 'success';
  if (query.status === 'error') return 'error';
  return query.fetchStatus === 'idle' ? 'idle' : 'loading';
}
