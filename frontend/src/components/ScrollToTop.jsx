import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useSmoothScroll from '../hooks/useSmoothScroll';

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const smoothScroll = useSmoothScroll();

  useEffect(() => {
    smoothScroll(0, 0, 0);
  }, [pathname, smoothScroll]);

  return null;
}
