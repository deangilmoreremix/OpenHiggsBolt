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

/** The element id in a #fragment, or null for a malformed one such as "#%". */
function fragmentId(hash: string) {
  try {
    return decodeURIComponent(hash.slice(1));
  } catch {
    return null;
  }
}

function targetTop(el: HTMLElement, lenis: Lenis | null, extraOffset: number) {
  // Resolve to a number ourselves: given an element, Lenis also subtracts its
  // scroll-margin-top (which main section[id] sets to the header height),
  // which would clear the header twice.
  const base = lenis ? lenis.animatedScroll : window.scrollY;
  // A section pinned by ScrollTrigger (the Workflow story) stays put on screen
  // while the page scrolls through its pin, so measure the pin-spacer that
  // holds its place in the layout instead.
  const anchor = el.parentElement?.classList.contains('pin-spacer') ? el.parentElement : el;
  return anchor.getBoundingClientRect().top + base - (headerHeight() + 16 + extraOffset);
}

/**
 * How long after landing a jump keeps the target aligned: until the layout
 * has been still for SETTLE_MS, and again after any later height change,
 * until SETTLE_MAX_MS.
 */
const SETTLE_MS = 1500;
const SETTLE_MAX_MS = 8000;
/** Native (phone) jumps: how often a glide cut short is retried, and how long the glide may take in all. */
const GLIDE_RETRIES = 3;
const GLIDE_MAX_MS = 6000;

// Jump state is module-level on purpose: there is one page scroll and one
// SmoothScroll (the landing page's root), so jumps from anywhere (nav links,
// IndustryNav, the #fragment on load) must cancel each other.
/** Cancels the jump in progress, if any (its glide wait, alignment and listeners). */
let cancelActiveJump: (() => void) | null = null;
/** Counts jumps, so a pending one (the #fragment on load) can tell a newer one started. */
let jumpCount = 0;

/**
 * Scroll to an element, smoothly when Lenis is running and natively otherwise.
 * `extraOffset` is added on top of the header height (e.g. for another sticky bar).
 *
 * After landing, freshly mounted sections above the target can still change
 * height for a moment (media, carousels measuring themselves), which would
 * push the target off its spot, so it is kept aligned until things settle.
 * The jump is cancelled as soon as the visitor scrolls, touches, clicks or
 * types, or another jump starts, so it never pulls the page back.
 */
export function scrollToTarget(lenis: Lenis | null, target: string | HTMLElement, extraOffset = 0) {
  jumpCount += 1;
  cancelActiveJump?.();
  const stopEvents = ['wheel', 'touchstart', 'mousedown', 'keydown'] as const;
  const timers: number[] = [];
  let cancelled = false;
  const cancel = () => {
    if (cancelled) return;
    cancelled = true;
    stopEvents.forEach((ev) => window.removeEventListener(ev, cancel));
    timers.forEach((t) => window.clearTimeout(t));
    if (cancelActiveJump === cancel) cancelActiveJump = null;
  };
  cancelActiveJump = cancel;
  stopEvents.forEach((ev) => window.addEventListener(ev, cancel, { passive: true }));

  const keepAligned = (el: HTMLElement) => {
    const hardEnd = performance.now() + SETTLE_MAX_MS;
    let end = performance.now() + SETTLE_MS;
    let lastHeight = document.body.scrollHeight;
    const check = () => {
      if (cancelled) return;
      const now = performance.now();
      if (now > hardEnd) return cancel();
      // Content changing height (or a ScrollTrigger refresh moving the page):
      // align until it has been still for SETTLE_MS. After that, keep
      // watching until SETTLE_MAX_MS, but only a later height change (a row
      // that measures itself late) brings alignment back; with the layout
      // still, nothing here moves the page.
      const height = document.body.scrollHeight;
      if (height !== lastHeight) {
        lastHeight = height;
        end = now + SETTLE_MS;
      }
      const top = targetTop(el, lenis, extraOffset);
      const current = lenis ? lenis.animatedScroll : window.scrollY;
      if (now <= end && Math.abs(top - current) > 4) {
        end = now + SETTLE_MS;
        // 'instant', not 'auto': phones have CSS smooth scrolling, which 'auto' would follow.
        if (lenis) lenis.scrollTo(top, { immediate: true });
        else window.scrollTo({ top, behavior: 'instant' });
      }
      timers.push(window.setTimeout(check, 150));
    };
    check();
  };

  window.dispatchEvent(new Event(MOUNT_ALL_EVENT));
  // Two frames: React renders the newly mounted sections, then layout settles.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      if (cancelled) return;
      const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
      if (!el) return cancel();
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (lenis) {
        lenis.scrollTo(targetTop(el, lenis, extraOffset), { onComplete: () => keepAligned(el) });
      } else {
        // Where the page can actually scroll to: a target near the bottom
        // stops at the page end.
        const reachable = () =>
          Math.min(
            Math.max(targetTop(el, null, extraOffset), 0),
            document.documentElement.scrollHeight - window.innerHeight,
          );
        const glide = () =>
          window.scrollTo({ top: targetTop(el, null, extraOffset), behavior: reduced ? 'instant' : 'smooth' });
        let started = false;
        const start = () => {
          if (started || cancelled) return;
          started = true;
          keepAligned(el);
        };
        const alreadyThere = Math.abs(reachable() - window.scrollY) < 1;
        glide();
        if (reduced || alreadyThere) return start();

        // Watch the glide instead of waiting for scrollend. Sections that
        // mount for the jump grow the page, and the ScrollTrigger refresh
        // that follows resets the scroll position, which cuts a native
        // smooth scroll off mid-way without any scrollend. So: once the page
        // is where it should be, align; if the glide has stopped short, glide
        // again to the target's current position, up to GLIDE_RETRIES times.
        const deadline = performance.now() + GLIDE_MAX_MS;
        let retries = 0;
        let still = 0;
        let lastY = window.scrollY;
        const watch = () => {
          if (started || cancelled) return;
          const y = window.scrollY;
          if (Math.abs(reachable() - y) < 2 || performance.now() > deadline) return start();
          still = Math.abs(y - lastY) < 1 ? still + 1 : 0;
          lastY = y;
          if (still >= 2) {
            // keepAligned snaps the rest of the way if the glides keep failing.
            if (retries >= GLIDE_RETRIES) return start();
            retries += 1;
            still = 0;
            glide();
          }
          timers.push(window.setTimeout(watch, 150));
        };
        timers.push(window.setTimeout(watch, 150));
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

  // Opening the page with a #fragment: the browser lands on the section while
  // the deferred sections above it are still placeholders (or the section has
  // not loaded at all), so align once the page, Lenis where it runs, and the
  // target are ready.
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || hash === '#') return;
    const id = fragmentId(hash);
    if (!id) return;
    const startCount = jumpCount;
    const lenisExpected = window.matchMedia('(prefers-reduced-motion: no-preference) and (pointer: fine)').matches;
    // Give up if the visitor starts scrolling or jumping elsewhere first.
    const stopEvents = ['wheel', 'touchstart', 'mousedown', 'keydown'] as const;
    let timer = 0;
    let tries = 0;
    const stop = () => {
      window.clearTimeout(timer);
      stopEvents.forEach((ev) => window.removeEventListener(ev, stop));
    };
    stopEvents.forEach((ev) => window.addEventListener(ev, stop, { passive: true }));
    // The demo showcase loads after the page, so its sections may not exist
    // yet, and Lenis (where it runs) starts after the first render: wait up
    // to 10s for both.
    const find = () => {
      if (jumpCount !== startCount) return stop();
      const target = document.getElementById(id);
      const ready = target && (!lenisExpected || lenisRef.current);
      if (ready) {
        stop();
        scrollToTarget(lenisRef.current, target);
      } else if (++tries < 50) timer = window.setTimeout(find, 200);
      else stop();
    };
    timer = window.setTimeout(find, 300);
    return stop;
  }, []);

  // Stop a jump in progress when the landing page unmounts.
  useEffect(() => () => cancelActiveJump?.(), []);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.('a[href^="#"]');
      const hash = link?.getAttribute('href');
      if (!hash || hash === '#' || link?.closest('[role="dialog"], [data-lenis-prevent]')) return;
      const id = fragmentId(hash);
      const target = id ? document.getElementById(id) : null;
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
