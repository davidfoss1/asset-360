import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useElementWidth } from './useElementWidth';

type Callback = ResizeObserverCallback;

describe(useElementWidth.name, () => {
  let callbacks: Callback[];
  let disconnected: number;

  beforeEach(() => {
    callbacks = [];
    disconnected = 0;
    class FakeResizeObserver {
      constructor(callback: Callback) {
        callbacks.push(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {
        disconnected += 1;
      }
    }
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function resizeTo(width: number) {
    act(() => {
      for (const callback of callbacks) {
        const entry: Partial<ResizeObserverEntry> = { contentRect: DOMRectReadOnly.fromRect({ width, height: 100 }) };
        const observer: Partial<ResizeObserver> = {};
        callback([entry as ResizeObserverEntry], observer as ResizeObserver);
      }
    });
  }

  it('does not know the width before the element has been measured', () => {
    render(<Probe />);

    expect(screen.getByTestId('probe')).toHaveTextContent('unknown');
  });

  it('reports the width the element is given, and follows it as it changes', () => {
    render(<Probe />);

    resizeTo(640);
    expect(screen.getByTestId('probe')).toHaveTextContent('640');
    resizeTo(480);
    expect(screen.getByTestId('probe')).toHaveTextContent('480');
  });

  it('treats an element with no width, such as a hidden tab, as not measured', () => {
    render(<Probe />);
    resizeTo(640);

    resizeTo(0);

    expect(screen.getByTestId('probe')).toHaveTextContent('unknown');
  });

  it('stops observing when the element goes away', () => {
    const { unmount } = render(<Probe />);

    unmount();

    expect(disconnected).toBe(1);
  });
});

function Probe() {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  return (
    <div ref={ref} data-testid="probe">
      {width ?? 'unknown'}
    </div>
  );
}
