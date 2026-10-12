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
  // Recharts measures text in a hidden span to decide which axis labels overlap. Give that span a
  // realistic size; at the chart's size every label would look as wide as the chart and all but one
  // would be dropped.
  const boxSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return this.id === 'recharts_measurement_span'
      ? DOMRectReadOnly.fromRect({ width: 40, height: 14 })
      : DOMRectReadOnly.fromRect({ width, height });
  });
  return () => {
    boxSpy.mockRestore();
    vi.unstubAllGlobals();
  };
}
