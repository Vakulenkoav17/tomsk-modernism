import { useCallback } from 'react';

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export default function useSmoothScroll() {
  return useCallback((target, offset = 0, duration = 520) => {
    if (target === null || target === undefined) return;
    const targetTop =
      typeof target === 'number'
        ? target - offset
        : target.getBoundingClientRect().top + window.pageYOffset - offset;
    const startTop = window.pageYOffset;
    const delta = Math.max(targetTop, 0) - startTop;
    if (duration <= 0) {
      window.scrollTo(0, startTop + delta);
      return;
    }
    const startTime = performance.now();

    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = easeOutCubic(progress);
      window.scrollTo(0, startTop + delta * eased);
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, []);
}
