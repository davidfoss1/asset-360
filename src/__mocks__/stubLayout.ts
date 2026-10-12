import { vi } from 'vitest';

/**
 * happy-dom has no layout, so every element is 0x0 and a virtualized list renders no rows.
 * Call in `beforeEach` and `vi.restoreAllMocks()` (or call the returned restore) in `afterEach`.
 */
export function stubLayoutSize(width = 800, height = 400): () => void {
  const widthSpy = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(width);
  const heightSpy = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(height);
  return () => {
    widthSpy.mockRestore();
    heightSpy.mockRestore();
  };
}
