import { Button } from '@cognite/aura/components/button';

type LoadMoreProps = {
  /** Plural noun for what is loaded, used in the failure copy (e.g. "files"). */
  label: string;
  hasMore: boolean;
  isLoading: boolean;
  /** The last attempt failed. The rows already shown stay, and pressing the button tries again. */
  failed: boolean;
  onLoadMore: () => void;
};

/** The footer under a list that can grow: a Load more button, and what went wrong if it failed. */
export function LoadMore({ label, hasMore, isLoading, failed, onLoadMore }: LoadMoreProps) {
  if (!hasMore) return null;

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="sm" disabled={isLoading} onClick={onLoadMore}>
        {isLoading ? 'Loading more…' : 'Load more'}
      </Button>
      {failed && !isLoading ? <p className="text-sm text-destructive">Could not load more {label}.</p> : null}
    </div>
  );
}
