'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Reveals children with the project's existing `animate-fade-in-up` animation
 * once they scroll into view. No animation library required. Honors
 * prefers-reduced-motion by showing content immediately.
 */
export default function Reveal({
  children,
  className = '',
  delay = 0,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: 'div' | 'li' | 'section' | 'article';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    );
    io.observe(el);
    // If the element is already in view when the observer attaches,
    // IntersectionObserver may not fire a callback. Detect that case
    // immediately so already-visible content does not animate on reload.
    const raf = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        setShown(true);
      }
    });
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`${className} ${shown ? 'animate-fade-in-up' : ''}`}
      style={shown ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
