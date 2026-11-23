'use client';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion, useReducedMotion } from 'motion/react';
import DemoMediaCard from './DemoMediaCard';
import { MINIMAX_H3_DEMOS } from '@/data/minimaxH3Demos';
import { type VideoDemo } from '@/data/types';

// Four UGC concepts presented as social-style cards.
const DEFAULT_UGC = [
  { slug: 'ramen-bowl-ugc-taste-test', badge: 'Restaurant' },
  { slug: 'gourmet-burger-ugc-taste-test', badge: 'Local Business' },
  { slug: 'blackberry-vanilla-soda-ugc-vlog', badge: 'Beverage' },
  { slug: 'morning-lip-oil-ugc-testimonial', badge: 'Beauty' },
];

type UGCDemoShowcaseProps = {
  /** Override: pass pre-filtered demos directly. */
  demos?: VideoDemo[];
};

/**
 * Same four UGC demos. Phones/tablets: an Embla swipe carousel with progress
 * dots. Desktop: the original four-up grid (Embla switches itself off).
 * Motion adds a hover lift.
 */
export default function UGCDemoShowcase({ demos }: UGCDemoShowcaseProps) {
  const reduced = useReducedMotion();
  const [viewportRef, embla] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    breakpoints: { '(min-width: 1024px)': { active: false } },
  });
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);
  const onSelect = useCallback(() => {
    if (!embla) return;
    setSelected(embla.selectedScrollSnap());
    setSnaps(embla.scrollSnapList());
  }, [embla]);
  useEffect(() => {
    if (!embla) return;
    onSelect();
    embla.on('select', onSelect).on('reInit', onSelect);
    return () => {
      embla.off('select', onSelect).off('reInit', onSelect);
    };
  }, [embla, onSelect]);

  const activeDemos = demos ?? DEFAULT_UGC
    .map((u) => {
      const d = MINIMAX_H3_DEMOS.find((d) => d.slug === u.slug);
      return d ? { demo: d, badge: u.badge } : null;
    })
    .filter(Boolean) as { demo: VideoDemo; badge: string }[];

  return (
    <section className="border-y border-white/10 bg-[#030303] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            UGC at scale
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
            Create UGC Ads Without Hiring Creators
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/60">
            Turn products, ideas and scripts into social-ready ads in minutes.
          </p>
        </div>

        <div className="embla-viewport mt-12 lg:overflow-visible" ref={viewportRef}>
          <div className="embla-container lg:grid lg:grid-cols-4 lg:gap-5">
            {activeDemos.map((item, i) => (
              <motion.div
                key={item.demo.slug}
                whileHover={reduced ? undefined : { y: -6 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="min-w-0 shrink-0 grow-0 basis-[85%] pr-5 sm:basis-1/2 lg:basis-auto lg:pr-0"
              >
                <DemoMediaCard
                  demo={item.demo}
                  index={i}
                  badge={item.badge}
                />
              </motion.div>
            ))}
          </div>
        </div>
        {snaps.length > 1 && (
          <div className="mt-6 flex justify-center gap-2 lg:hidden">
            {snaps.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to UGC demo ${i + 1}`}
                aria-current={i === selected || undefined}
                onClick={() => embla?.scrollTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === selected ? 'w-6 bg-gradient-to-r from-cyan-400 to-purple-500' : 'w-2 bg-white/25'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
