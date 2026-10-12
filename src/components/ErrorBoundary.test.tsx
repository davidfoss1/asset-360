import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrorBoundary } from './ErrorBoundary';

describe(ErrorBoundary.name, () => {
  beforeEach(() => {
    // React logs every caught render error; keep the test output readable.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders its children when nothing fails', () => {
    render(
      <ErrorBoundary label="time series">
        <p>chart</p>
      </ErrorBoundary>
    );

    expect(screen.getByText('chart')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('replaces a crashing child with an error that names the section', () => {
    render(
      <ErrorBoundary label="time series">
        <Crash shouldCrash />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong in time series');
    expect(screen.queryByText('recovered')).not.toBeInTheDocument();
  });

  it('leaves everything outside the boundary working', () => {
    render(
      <>
        <p>outside</p>
        <ErrorBoundary label="files">
          <Crash shouldCrash />
        </ErrorBoundary>
      </>
    );

    expect(screen.getByText('outside')).toBeInTheDocument();
  });

  it('tries the children again when the user presses Try again', async () => {
    // Arrange
    const fault = { active: true };
    render(
      <ErrorBoundary label="files">
        <Flaky fault={fault} />
      </ErrorBoundary>
    );
    fault.active = false;

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    // Assert
    expect(screen.getByText('recovered')).toBeInTheDocument();
  });

  it('shows the error again if the retry fails too', async () => {
    render(
      <ErrorBoundary label="files">
        <Crash shouldCrash />
      </ErrorBoundary>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('clears the error when the reset key changes', () => {
    // Arrange
    const { rerender } = render(
      <ErrorBoundary label="files" resetKey="pump-101">
        <Crash shouldCrash />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Act
    rerender(
      <ErrorBoundary label="files" resetKey="tank-7">
        <Crash shouldCrash={false} />
      </ErrorBoundary>
    );

    // Assert
    expect(screen.getByText('recovered')).toBeInTheDocument();
  });

  it('keeps showing the error when the reset key stays the same', () => {
    const { rerender } = render(
      <ErrorBoundary label="files" resetKey="pump-101">
        <Crash shouldCrash />
      </ErrorBoundary>
    );

    rerender(
      <ErrorBoundary label="files" resetKey="pump-101">
        <Crash shouldCrash={false} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

function Crash({ shouldCrash }: { shouldCrash: boolean }) {
  if (shouldCrash) throw new Error('render failed');
  return <p>recovered</p>;
}

/** Crashes for as long as the fault is active, which a test can switch off between renders. */
function Flaky({ fault }: { fault: { active: boolean } }) {
  return <Crash shouldCrash={fault.active} />;
}
