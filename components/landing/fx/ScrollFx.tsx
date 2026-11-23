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
      const reveals = new Map<Element, gsap.core.Timeline>();

      // Play each reveal when its heading is actually on screen. Measured
      // live rather than with ScrollTrigger start positions, which are taken
      // while the showcase is still loading (the page grows tenfold) and
      // would fire long before the heading is reached.
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            io.unobserve(entry.target);
            reveals.get(entry.target)?.play();
            reveals.delete(entry.target);
          });
        },
        { rootMargin: '0px 0px -20% 0px' },
      );

      /** Wires up any headings not seen yet; returns how many were new. */
      const setup = () => {
        let added = 0;
        main.querySelectorAll<HTMLElement>('h2').forEach((heading) => {
          if (seen.has(heading) || heading.closest(SKIP)) return;
          seen.add(heading);
          added += 1;

          const split = SplitText.create(heading, { type: 'lines', mask: 'lines' });
          const tl = gsap.timeline({ paused: true });
          tl.from(split.lines, {
            yPercent: 105,
            rotate: 2,
            opacity: 0,
            duration: 1.3,
            ease: 'power3.out',
            stagger: 0.14,
            onComplete: () => split.revert(),
          });

          const eyebrow = heading.previousElementSibling;
          if (eyebrow instanceof HTMLElement && eyebrow.tagName === 'P') {
            tl.from(
              eyebrow,
              { opacity: 0, y: 10, letterSpacing: '0.6em', duration: 1.1, ease: 'power3.out' },
              0,
            );
          }
          reveals.set(heading, tl);
          io.observe(heading);
        });
        return added;
      };

      setup();
      // Throttled, not debounced: count-ups and the rotating hero words
      // mutate the page continuously, which would keep postponing setup.
      let queued: ReturnType<typeof setTimeout> | undefined;
      const onMutate = () => {
        if (queued) return;
        queued = setTimeout(() => {
          queued = undefined;
          let added = 0;
          context.add(() => {
            added = setup();
          });
          if (added) refresh();
        }, 150);
      };
      const mutationObserver = new MutationObserver(onMutate);
      mutationObserver.observe(main, { childList: true, subtree: true });

      return () => {
        mutationObserver.disconnect();
        clearTimeout(queued);
        io.disconnect();
      };
    });

    return () => {
      resizeObserver.disconnect();
      mm.revert();
    };
  }, []);

  return null;
}
