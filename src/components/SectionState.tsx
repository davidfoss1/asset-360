import { Alert, AlertActions, AlertButton, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { EmptyState, EmptyStateDescription, EmptyStateTitle } from '@cognite/aura/components/empty-state';
import { Skeleton } from '@cognite/aura/components/skeleton';
import type { ReactNode } from 'react';

import type { LoadStatus } from '../lib/loadStatus';

type SectionStateProps = {
  /** Plural noun for the section, used in the loading and error copy (e.g. "files"). */
  label: string;
  status: LoadStatus;
  emptyTitle: string;
  emptyDescription?: string;
  onRetry: () => void;
  children: ReactNode;
};

/** Gives every section the same loading, error and empty treatment, so each fails on its own. */
export function SectionState({ label, status, emptyTitle, emptyDescription, onRetry, children }: SectionStateProps) {
  switch (status) {
    case 'idle':
      return null;
    case 'loading':
      return (
        <div role="status" aria-label={`Loading ${label}`} className="flex flex-col gap-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-5/6" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      );
    case 'error':
      return (
        <Alert variant="error">
          <AlertTitle>Could not load {label}</AlertTitle>
          <AlertDescription>Something went wrong while fetching this section.</AlertDescription>
          <AlertActions>
            <AlertButton onClick={onRetry}>Retry</AlertButton>
          </AlertActions>
        </Alert>
      );
    case 'empty':
      return (
        <div className="py-6">
          <EmptyState type="no-results">
            <EmptyStateTitle>{emptyTitle}</EmptyStateTitle>
            {emptyDescription ? <EmptyStateDescription>{emptyDescription}</EmptyStateDescription> : null}
          </EmptyState>
        </div>
      );
    case 'success':
      return <>{children}</>;
  }
}
