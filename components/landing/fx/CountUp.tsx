'use client';
import { useEffect, useRef } from 'react';
import { gsap, MOTION_OK } from './gsap';

/**
 * Renders `prefix + value + suffix` and counts up from 0 the first time it
 * scrolls into view. The final value is in the server-rendered markup, so it
 * reads correctly without JavaScript or with reduced motion.
 */
export default function CountUp({
  value,
  prefix = '',
  suffix = '',
  duration = 1.6,
  className = '',
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const state = { n: 0 };
      el.textContent = `${prefix}0${suffix}`;
      gsap.to(state, {
        n: value,
        duration,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: () => {
          el.textContent = `${prefix}${Math.round(state.n)}${suffix}`;
        },
      });
      return () => {
        el.textContent = `${prefix}${value}${suffix}`;
      };
    });
    return () => mm.revert();
  }, [value, prefix, suffix, duration]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {`${prefix}${value}${suffix}`}
    </span>
  );
}
