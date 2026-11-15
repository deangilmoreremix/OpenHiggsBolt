'use client';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap';

const LenisContext = createContext<Lenis | null>(null);

/** The active Lenis instance, or null when smooth scrolling is off (touch, reduced motion). */
export function useLenis() {
  return useContext(LenisContext);
}

/** Current sticky header height, published by LandingNav as --landing-header-h. */
export function headerHeight() {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--landing-header-h'));
  return Number.isFinite(v) ? v : 72;
}

/**
 * Fired before an in-page jump so sections deferred by NearViewport mount
 * first; otherwise they would grow while the page scrolls past them and the
 * jump would land in the wrong place.
 */
export const MOUNT_ALL_EVENT = 'landing:mount-all';

function targetTop(el: HTMLElement, lenis: Lenis | null, extraOffset: number) {
  // Resolve to a number ourselves: given an element, Lenis also subtracts its
  // scroll-margin-top (which main section[id] sets to the header height),
  // which would clear the header twice.
  const base = lenis ? lenis.animatedScroll : window.scrollY;
  return el.getBoundingClientRect().top + base - (headerHeight() + 16 + extraOffset);
}

/** How long after landing a jump keeps the target aligned while sections settle. */
const SETTLE_MS = 2000;

/**
 * After a jump lands, freshly mounted sections above the target can still
 * change height for a moment (media, carousels measuring themselves), which
 * would push the target off its spot. Re-align it until things settle, and
 * stop as soon as the visitor scrolls, touches, clicks or types.
 */
function keepAligned(el: HTMLElement, lenis: Lenis | null, extraOffset: number) {
  const stopEvents = ['wheel', 'touchstart', 'mousedown', 'keydown'] as const;
  let stopped = false;
  const stop = () => {
    stopped = true;
    stopEvents.forEach((ev) => window.removeEventListener(ev, stop));
  };
  stopEvents.forEach((ev) => window.addEventListener(ev, stop, { passive: true }));
  const end = performance.now() + SETTLE_MS;
  const check = () => {
    if (stopped) return;
    if (performance.now() > end) return stop();
    const top = targetTop(el, lenis, extraOffset);
    const current = lenis ? lenis.animatedScroll : window.scrollY;
    if (Math.abs(top - current) > 4) {
      // 'instant', not 'auto': phones have CSS smooth scrolling, which 'auto' would follow.
      if (lenis) lenis.scrollTo(top, { immediate: true });
      else window.scrollTo({ top, behavior: 'instant' });
    }
    window.setTimeout(check, 150);
  };
  check();
}

/**
 * Scroll to an element, smoothly when Lenis is running and natively otherwise.
 * `extraOffset` is added on top of the header height (e.g. for another sticky bar).
 */
export function scrollToTarget(lenis: Lenis | null, target: string | HTMLElement, extraOffset = 0) {
  window.dispatchEvent(new Event(MOUNT_ALL_EVENT));
  // Two frames: React renders the newly mounted sections, then layout settles.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
      if (!el) return;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (lenis) {
        lenis.scrollTo(targetTop(el, lenis, extraOffset), { onComplete: () => keepAligned(el, lenis, extraOffset) });
      } else {
        window.scrollTo({ top: targetTop(el, null, extraOffset), behavior: reduced ? 'instant' : 'smooth' });
        // Where the browser doesn't report scrollend, start after a typical glide.
        let started = false;
        const start = () => {
          if (started) return;
          started = true;
          keepAligned(el, null, extraOffset);
        };
        window.addEventListener('scrollend', start, { once: true });
        window.setTimeout(start, reduced ? 0 : 1200);
      }
    }),
  );
}

/**
 * Lenis smooth scrolling for the landing page, driven by GSAP's ticker so
 * ScrollTrigger and Lenis share one frame clock.
 *
 * - Only runs on precise-pointer devices; touch keeps native scrolling.
 * - Off when the visitor prefers reduced motion, including when they switch
 *   it on while the page is open.
 * - Never smooths wheel events inside dialogs (Personalization Modal, prompt
 *   modal, create picker) or anything marked `data-lenis-prevent`.
 * - Pauses while a modal locks the page (body overflow hidden) and resumes
 *   when the lock is released, so modals keep their existing scroll locking.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: no-preference) and (pointer: fine)');
    let teardown: (() => void) | null = null;
    // Follow the preference live: switching reduced motion on mid-visit
    // destroys Lenis, switching it off starts it again.
    const sync = () => {
      if (mq.matches && !teardown) teardown = start();
      else if (!mq.matches && teardown) {
        teardown();
        teardown = null;
      }
    };
    sync();
    mq.addEventListener('change', sync);
    return () => {
      mq.removeEventListener('change', sync);
      teardown?.();
    };
  }, []);

  // In-page anchors (nav links, CTAs) on every device: land below the sticky
  // header, after deferred sections have mounted. Handled here rather than
  // with Lenis's `anchors` option because the header height isn't fixed.
  const lenisRef = useRef<Lenis | null>(null);
  lenisRef.current = lenis;
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.('a[href^="#"]');
      const hash = link?.getAttribute('href');
      if (!hash || hash === '#' || link?.closest('[role="dialog"], [data-lenis-prevent]')) return;
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (!target) return;
      e.preventDefault();
      scrollToTarget(lenisRef.current, target);
      history.replaceState(null, '', hash);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  function start() {
    const instance = new Lenis({
      autoRaf: false,
      // Lerp (not a fixed duration) so the page follows the wheel closely
      // and settles quickly instead of gliding; a lower multiplier moves a
      // little less per wheel notch than native scrolling.
      lerp: 0.14,
      wheelMultiplier: 0.85,
      allowNestedScroll: true,
      prevent: (node) => Boolean(node.closest?.('[role="dialog"], [aria-modal="true"]')),
    });

    instance.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Modals lock scrolling by setting `overflow: hidden` on <body>. Lenis does
    // not see that, so mirror the lock onto Lenis.
    const syncLock = () => {
      const locked =
        document.body.style.overflow === 'hidden' || document.documentElement.style.overflow === 'hidden';
      if (locked) instance.stop();
      else instance.start();
    };
    const observer = new MutationObserver(syncLock);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    syncLock();

    setLenis(instance);

    return () => {
      observer.disconnect();
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      instance.destroy();
      setLenis(null);
    };
  }

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
