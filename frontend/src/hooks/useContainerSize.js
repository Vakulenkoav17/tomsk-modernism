import { useEffect, useRef, useState } from 'react';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default function useContainerSize({
  step = 100,
  minWidth = 320,
  maxWidth = 1600,
  minHeight = 200,
  maxHeight = 900,
} = {}) {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 800, height: 0 });
  const lastRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current || typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const rawWidth = entry.contentRect.width;
      const rawHeight = entry.contentRect.height;
      if (!rawWidth) return;
      const roundedWidth = Math.round(rawWidth / step) * step;
      const nextWidth = clamp(roundedWidth, minWidth, maxWidth);
      let nextHeight = 0;
      if (rawHeight) {
        const roundedHeight = Math.round(rawHeight / step) * step;
        nextHeight = clamp(roundedHeight, minHeight, maxHeight);
      }

      if (
        lastRef.current.width !== nextWidth ||
        lastRef.current.height !== nextHeight
      ) {
        lastRef.current = { width: nextWidth, height: nextHeight };
        setSize({ width: nextWidth, height: nextHeight });
      }
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [step, minWidth, maxWidth, minHeight, maxHeight]);

  return { ref, ...size };
}
