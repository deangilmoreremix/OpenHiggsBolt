'use client';
import { useEffect, type RefObject } from 'react';
import { gsap, MOTION_OK } from './gsap';

/**
 * Cinematic full-bleed video section:
 * - the background media drifts with scroll (parallax) and settles from a
 *   slight zoom as the section enters;
 * - the copy column's direct children stagger up when it comes into view
 *   (the heading and its eyebrow are left to the page-wide reveal in ScrollFx).
 */
export function useCinematicHero(
  root: RefObject<HTMLElement | null>,
  media: RefObject<HTMLElement | null>,
  copy: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const section = root.current;
    if (!section) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      if (media.current) {
        gsap.fromTo(
          media.current,
          { yPercent: -5, scale: 1.2 },
          {
            // Stays scaled past 1.1 so the 5% drift never uncovers an edge.
            yPercent: 5,
            scale: 1.12,
            ease: 'none',
            scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      }
      if (copy.current) {
        // Skip the heading and its eyebrow label: ScrollFx already animates
        // those, and two from() tweens on one element leave it hidden.
        const items = Array.from(copy.current.children).filter(
          (el) => el.tagName !== 'H2' && el.nextElementSibling?.tagName !== 'H2',
        );
        gsap.from(items, {
          y: 40,
          opacity: 0,
          duration: 1.1,
          ease: 'expo.out',
          stagger: 0.12,
          scrollTrigger: { trigger: copy.current, start: 'top 80%', once: true },
        });
      }
    });
    return () => mm.revert();
  }, [root, media, copy]);
}
