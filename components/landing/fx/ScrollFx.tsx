'use client';
import { useEffect } from 'react';
import { gsap, ScrollTrigger, SplitText, MOTION_OK } from './gsap';

/** Elements whose headings are left alone (embedded studio, dialogs). */
const SKIP = '[data-lenis-prevent], [role="dialog"], [data-fx-skip]';

function debounce(fn: () => void, ms: number) {
  let t: ReturnType<typeof setTimeout> | undefined;
  return () => {
    clearTimeout(t);
    t = setTimeout(fn, ms);
  };
}

/**
 * Page-wide scroll effects that apply to every landing section without
 * touching their markup:
 *
 * - Section headings (`h2`) reveal line by line with SplitText as they enter.
 *   The split is reverted once the reveal finishes so React keeps owning the
 *   original DOM.
 * - The eyebrow label above each heading fades and tracks in.
 * - ScrollTrigger positions are refreshed when the page height changes
 *   noticeably (lazy sections, "Show more", images loading).
 *
 * Sections mounted later (the showcase loads client-side) are picked up by a
 * MutationObserver.
 */
export default function ScrollFx() {
  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;

    // Refresh only on meaningful height changes. Small reflows (the rotating
    // hero words re-wrapping) would otherwise refresh every few seconds, and a
    // refresh mid-scroll is visible as a jump.
    let lastHeight = document.body.scrollHeight;
    const refresh = debounce(() => {
      lastHeight = document.body.scrollHeight;
      ScrollTrigger.refresh();
    }, 250);
    const resizeObserver = new ResizeObserver(() => {
      if (Math.abs(document.body.scrollHeight - lastHeight) > 120) refresh();
    });
    resizeObserver.observe(document.body);

    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, (context) => {
      const seen = new WeakSet<Element>();

      /** Wires up any headings not seen yet; returns how many were new. */
      const setup = () => {
        let added = 0;
        main.querySelectorAll<HTMLElement>('h2').forEach((heading) => {
          if (seen.has(heading) || heading.closest(SKIP)) return;
          seen.add(heading);
          added += 1;

          const split = SplitText.create(heading, { type: 'lines', mask: 'lines' });
          gsap.from(split.lines, {
            yPercent: 110,
            opacity: 0,
            duration: 1.1,
            ease: 'expo.out',
            stagger: 0.09,
            scrollTrigger: { trigger: heading, start: 'top 88%', once: true },
            onComplete: () => split.revert(),
          });

          const eyebrow = heading.previousElementSibling;
          if (eyebrow instanceof HTMLElement && eyebrow.tagName === 'P') {
            gsap.from(eyebrow, {
              opacity: 0,
              y: 10,
              letterSpacing: '0.6em',
              duration: 1.1,
              ease: 'power3.out',
              scrollTrigger: { trigger: heading, start: 'top 92%', once: true },
            });
          }
        });
        return added;
      };

      setup();
      const onMutate = debounce(() => {
        let added = 0;
        context.add(() => {
          added = setup();
        });
        if (added) refresh();
      }, 200);
      const mutationObserver = new MutationObserver(onMutate);
      mutationObserver.observe(main, { childList: true, subtree: true });

      return () => mutationObserver.disconnect();
    });

    return () => {
      resizeObserver.disconnect();
      mm.revert();
    };
  }, []);

  return null;
}
