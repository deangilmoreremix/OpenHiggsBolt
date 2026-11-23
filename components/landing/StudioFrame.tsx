'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { gsap, MOTION_OK } from './fx/gsap';

/**
 * Wraps the embedded studio.
 * - GSAP ScrollTrigger: the studio opens out of a rounded "device frame"
 *   (clip-path) as it scrolls in. The clip is cleared when the reveal ends,
 *   so the studio's own popovers and fixed panels are never clipped.
 * - `data-lenis-prevent`: the studio is a real app with its own scroll areas,
 *   canvases and wheel handlers, so Lenis leaves wheel/touch input inside it native.
 */
export default function StudioFrame({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.fromTo(
        el,
        { clipPath: 'inset(6% 8% 6% 8% round 32px)', opacity: 0.4, y: 40 },
        {
          clipPath: 'inset(0% 0% 0% 0% round 0px)',
          opacity: 1,
          y: 0,
          duration: 1.4,
          ease: 'expo.out',
          clearProps: 'clipPath,transform,opacity',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        },
      );
    });
    return () => mm.revert();
  }, []);

  return (
    <div ref={ref} data-lenis-prevent>
      {children}
    </div>
  );
}
