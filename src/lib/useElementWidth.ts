import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * The width of an element, kept up to date as it is resized. Undefined until it has been measured, and
 * while it has no width (for instance in a hidden tab). A view concern, so it keeps its own state.
 */
export function useElementWidth<T extends HTMLElement>(): { ref: RefObject<T>; width: number | undefined } {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width > 0 ? entry.contentRect.width : undefined);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}
