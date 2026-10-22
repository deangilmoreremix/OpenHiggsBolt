'use client';
import { useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion } from 'motion/react';
import { useLenis, scrollToTarget } from './fx/SmoothScroll';
import { type NicheConfig } from '@/data/nicheContent';

/**
 * Sticky "jump to industry" bar above the niche sections.
 * - Embla: free-drag chip row on any screen width.
 * - Motion: a sliding highlight follows the industry currently in view.
 * - Lenis: chips glide to their section (native smooth scroll when Lenis is off).
 */
export default function IndustryNav({ niches }: { niches: NicheConfig[] }) {
  const lenis = useLenis();
  const [viewportRef, embla] = useEmblaCarousel({ dragFree: true, containScroll: 'trimSnaps', align: 'start' });
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id.replace(/^niche-/, ''));
        });
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    niches.forEach((n) => {
      const el = document.getElementById(`niche-${n.id}`);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [niches]);

  // Keep the active chip visible in the row.
  useEffect(() => {
    if (!embla || !active) return;
    const index = niches.findIndex((n) => n.id === active);
    if (index >= 0 && !embla.slidesInView().includes(index)) embla.scrollTo(index);
  }, [embla, active, niches]);

  return (
    <nav
      aria-label="Jump to an industry"
      className="sticky z-30 border-b border-white/10 bg-black/75 backdrop-blur-xl"
      style={{ top: 'var(--landing-header-h, 60px)' }}
    >
      <div className="mx-auto max-w-7xl px-6 py-3">
        <div className="embla-viewport" ref={viewportRef}>
          <ul className="embla-container gap-2">
            {niches.map((n) => {
              const isActive = n.id === active;
              return (
                <li key={n.id} className="shrink-0">
                  <a
                    href={`#niche-${n.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      // Clear both the header and this sticky bar.
                      const bar = e.currentTarget.closest('nav');
                      scrollToTarget(lenis, `#niche-${n.id}`, bar?.offsetHeight ?? 0);
                    }}
                    aria-current={isActive ? 'true' : undefined}
                    className={`relative block whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                      isActive ? 'border-transparent text-black' : 'border-white/15 text-white/65 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="industry-nav-active"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative">{n.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
