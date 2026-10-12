import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LoadMore } from './LoadMore';

function renderLoadMore(props: Partial<Parameters<typeof LoadMore>[0]> = {}) {
  const onLoadMore = vi.fn();
  render(<LoadMore label="files" hasMore isLoading={false} failed={false} onLoadMore={onLoadMore} {...props} />);
  return { onLoadMore };
}

describe(LoadMore.name, () => {
  it('renders nothing when there is nothing more to load', () => {
    const { onLoadMore } = renderLoadMore({ hasMore: false });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('loads more when the button is pressed', async () => {
    const { onLoadMore } = renderLoadMore();

    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('disables the button and says it is loading while loading', () => {
    renderLoadMore({ isLoading: true });

    expect(screen.getByRole('button', { name: 'Loading more…' })).toBeDisabled();
  });

  it('names what could not be loaded when loading failed, and keeps the button', () => {
    renderLoadMore({ failed: true });

    expect(screen.getByText('Could not load more files.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Load more' })).toBeEnabled();
  });

  it('hides the failure message while trying again', () => {
    renderLoadMore({ failed: true, isLoading: true });

    expect(screen.queryByText('Could not load more files.')).not.toBeInTheDocument();
  });
});
