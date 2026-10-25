'use client';
import { useEffect, useRef, useState, type ComponentType } from 'react';
import Link from 'next/link';
import { motion, useMotionValueEvent, useScroll } from 'motion/react';
import { gsap, ScrollTrigger } from './fx/gsap';
import { PRODUCT_NAME, NAV_ITEMS } from './landingData';

/**
 * Landing header. Same links and auth controls as before, plus:
 * - Motion: compacts and darkens once the page scrolls.
 * - Motion: a sliding underline marks the section in view.
 * - GSAP ScrollTrigger: a thin gradient bar shows page progress.
 * - A compact row of the same links on small screens (they were desktop-only).
 */
export default function LandingNav({ AuthControls }: { AuthControls?: ComponentType | null }) {
  const headerRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24));

  // Publish the live header height so sticky bars and anchor offsets can sit
  // right under it (it changes with scroll compaction and screen width).
  useEffect(() => {
    const header = headerRef.current;
    if (!header || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      document.documentElement.style.setProperty('--landing-header-h', `${header.offsetHeight}px`);
    });
    ro.observe(header);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty('--landing-header-h');
    };
  }, []);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => gsap.set(bar, { scaleX: self.progress }),
    });
    return () => st.kill();
  }, []);

  useEffect(() => {
    const targets = NAV_ITEMS.map((item) => document.querySelector(item.href)).filter(Boolean) as Element[];
    if (!targets.length || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  return (
    <motion.header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl"
      animate={{ backgroundColor: scrolled ? 'rgba(0,0,0,0.82)' : 'rgba(0,0,0,0.55)' }}
      transition={{ duration: 0.3 }}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between px-6 transition-[padding] duration-300 ${
          scrolled ? 'py-2.5' : 'py-4'
        }`}
      >
        <Link href="/" className="flex items-center gap-3">
          <motion.span
            className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 text-sm font-black text-black"
            whileHover={{ rotate: -8, scale: 1.06 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            OG
          </motion.span>
          <span className="font-semibold tracking-tight">{PRODUCT_NAME}</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-white/60 md:flex" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`relative py-1 transition hover:text-white ${active === item.href ? 'text-white' : ''}`}
              aria-current={active === item.href ? 'true' : undefined}
            >
              {item.label}
              {active === item.href && (
                <motion.span
                  layoutId="landing-nav-underline"
                  className="absolute inset-x-0 -bottom-0.5 h-px bg-gradient-to-r from-cyan-400 to-purple-500"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {AuthControls && <AuthControls />}
        </div>
      </div>

      <nav aria-label="Section navigation" className="border-t border-white/10 md:hidden">
        <ul className="flex items-center justify-center gap-6 px-6 py-2 text-sm text-white/60">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className={`relative block py-1 transition hover:text-white ${active === item.href ? 'text-white' : ''}`}
                aria-current={active === item.href ? 'true' : undefined}
              >
                {item.label}
                {active === item.href && (
                  <motion.span
                    layoutId="landing-nav-underline-mobile"
                    className="absolute inset-x-0 -bottom-0.5 h-px bg-gradient-to-r from-cyan-400 to-purple-500"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div
        ref={barRef}
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-500"
      />
    </motion.header>
  );
}
