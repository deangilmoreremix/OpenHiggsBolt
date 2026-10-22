'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
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
 * Scroll to an element, smoothly when Lenis is running and natively otherwise.
 * `extraOffset` is added on top of the header height (e.g. for another sticky bar).
 */
export function scrollToTarget(lenis: Lenis | null, target: string | HTMLElement, extraOffset = 0) {
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
  if (!el) return;
  const offset = -(headerHeight() + 16 + extraOffset);
  if (lenis) {
    lenis.scrollTo(el, { offset });
  } else {
    const top = el.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}

/**
 * Lenis smooth scrolling for the landing page, driven by GSAP's ticker so
 * ScrollTrigger and Lenis share one frame clock.
 *
 * - Only runs on precise-pointer devices; touch keeps native scrolling.
 * - Off when the visitor prefers reduced motion.
 * - Never smooths wheel events inside dialogs (Personalization Modal, prompt
 *   modal, create picker) or anything marked `data-lenis-prevent`.
 * - Pauses while a modal locks the page (body overflow hidden) and resumes
 *   when the lock is released, so modals keep their existing scroll locking.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: no-preference) and (pointer: fine)');
    if (!mq.matches) return;

    const instance = new Lenis({
      autoRaf: false,
      duration: 1.15,
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

    // In-page anchors (nav links, CTAs): glide there and land below the
    // sticky header. Handled here rather than with Lenis's `anchors` option
    // because the header height isn't fixed.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.('a[href^="#"]');
      const hash = link?.getAttribute('href');
      if (!hash || hash === '#' || link?.closest('[role="dialog"], [data-lenis-prevent]')) return;
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (!target) return;
      e.preventDefault();
      scrollToTarget(instance, target);
      history.replaceState(null, '', hash);
    };
    document.addEventListener('click', onClick);

    setLenis(instance);

    return () => {
      document.removeEventListener('click', onClick);
      observer.disconnect();
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
