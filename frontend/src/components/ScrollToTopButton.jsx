import { useEffect, useState } from 'react';
import useSmoothScroll from '../hooks/useSmoothScroll';

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const smoothScroll = useSmoothScroll();

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = () => {
    smoothScroll(0, 0, 600);
  };

  return (
    <button
      type="button"
      className={`scroll-top ${visible ? 'visible' : ''}`}
      onClick={handleClick}
      aria-label="Наверх"
    >
      <svg
        className="scroll-top-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M6.5 14.5L12 9l5.5 5.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
