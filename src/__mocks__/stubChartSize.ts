import { vi } from 'vitest';

/**
 * Recharts sizes a chart from a ResizeObserver and getBoundingClientRect, and happy-dom reports a 0x0
 * box, so no chart would draw. Call in `beforeEach` and call the returned restore in `afterEach`.
 */
export function stubChartSize(width = 800, height = 288): () => void {
  class ImmediateResizeObserver {
    constructor(private readonly callback: ResizeObserverCallback) {}
    observe(target: Element) {
      const entry: Partial<ResizeObserverEntry> = { target, contentRect: DOMRectReadOnly.fromRect({ width, height }) };
      this.callback([entry as ResizeObserverEntry], this);
    }
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', ImmediateResizeObserver);
  const boxSpy = vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockReturnValue(DOMRectReadOnly.fromRect({ width, height }));
  return () => {
    boxSpy.mockRestore();
    vi.unstubAllGlobals();
  };
}
