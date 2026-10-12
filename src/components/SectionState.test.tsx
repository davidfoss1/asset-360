import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SectionState } from './SectionState';

function renderSection(status: Parameters<typeof SectionState>[0]['status'], onRetry = vi.fn()) {
  render(
    <SectionState label="files" status={status} emptyTitle="No files" onRetry={onRetry}>
      <p>content</p>
    </SectionState>
  );
  return { onRetry };
}

describe(SectionState.name, () => {
  it('renders the content on success', () => {
    renderSection('success');

    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('renders a loading skeleton, not the content, while loading', () => {
    renderSection('loading');

    expect(screen.getByRole('status', { name: 'Loading files' })).toBeInTheDocument();
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('renders the empty state when there is nothing to show', () => {
    renderSection('empty');

    expect(screen.getByText('No files')).toBeInTheDocument();
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('renders an error with a retry action', async () => {
    // Arrange
    const { onRetry } = renderSection('error');

    // Act
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));

    // Assert
    expect(screen.getByText(/could not load files/i)).toBeInTheDocument();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when idle', () => {
    const { container } = render(
      <SectionState label="files" status="idle" emptyTitle="No files" onRetry={vi.fn()}>
        <p>content</p>
      </SectionState>
    );

    expect(container).toBeEmptyDOMElement();
  });
});
