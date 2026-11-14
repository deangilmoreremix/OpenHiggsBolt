'use client';
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import DemoCarousel from './DemoCarousel';
import { MINIMAX_H3_DEMOS, DEMO_CATEGORIES } from '@/data/minimaxH3Demos';
import { type VideoDemo } from '@/data/types';

type AIVideoGalleryProps = {
  /** Demos to display. Defaults to MINIMAX_H3_DEMOS. */
  demos?: VideoDemo[];
  /** Section label (defaults to "Full showcase"). */
  label?: string;
  /** Heading (defaults to "Every SmartVideo GO AI Demo, On Demand"). */
  heading?: string;
  /** Subtext (defaults to the existing description). */
  subtext?: string;
  /** Section id for anchor linking. */
  sectionId?: string;
};

/**
 * A demo library: category filters, then the filtered demos on a carousel
 * row ("View all" opens the grid, where filtering glides cards with Flip).
 * Only categories this library actually has are offered, with counts.
 * Renders nothing for an empty library.
 */
export default function AIVideoGallery({
  demos,
  label,
  heading,
  subtext,
  sectionId = 'smartvideo-gallery',
}: AIVideoGalleryProps) {
  const allDemos = demos ?? MINIMAX_H3_DEMOS;
  const [category, setCategory] = useState<string>('All');

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    allDemos.forEach((d) => counts.set(d.category, (counts.get(d.category) ?? 0) + 1));
    return [
      { name: 'All', count: allDemos.length },
      ...DEMO_CATEGORIES.filter((c) => counts.has(c)).map((c) => ({ name: c, count: counts.get(c)! })),
    ];
  }, [allDemos]);
  const filtered = useMemo(
    () => (category === 'All' ? allDemos : allDemos.filter((d) => d.category === category)),
    [category, allDemos],
  );

  if (!allDemos.length) return null;

  return (
    <section id={sectionId} className="border-y border-white/10 bg-[#030303] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            {label ?? 'Full showcase'}
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
            {heading ?? 'Every SmartVideo GO AI Demo, On Demand'}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/60">
            {subtext ?? 'Browse the full library. Open any prompt or jump straight into the matching studio.'}
          </p>
        </div>

        {/* Category filter */}
        {categories.length > 2 && (
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {categories.map(({ name, count }) => {
              const active = name === category;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCategory(name)}
                  aria-pressed={active}
                  className={`relative rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? 'border-transparent text-black'
                      : 'border-white/15 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]'
                  }`}
                >
                  {/* Motion: the active highlight slides between filters */}
                  {active && (
                    <motion.span
                      layoutId={`${sectionId}-filter`}
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500"
                      transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                    />
                  )}
                  <span className="relative">
                    {name} <span className={active ? 'text-black/60' : 'text-white/40'}>{count}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-10">
          <DemoCarousel
            demos={filtered}
            label={`${label ?? 'Showcase'} demos`}
            gridClassName="grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          />
        </div>
      </div>
    </section>
  );
}
