'use client';
import { useMemo, useState } from 'react';
import DemoMediaCard from './DemoMediaCard';
import { MINIMAX_H3_DEMOS, DEMO_CATEGORIES } from '@/data/minimaxH3Demos';
import { type VideoDemo } from '@/data/types';

const INITIAL_COUNT = 12;
const STEP = 12;

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
  /** Number of cards to render initially. Defaults to 12. Set to a large number to render all cards immediately. */
  initialCount?: number;
};

export default function AIVideoGallery({
  demos,
  label,
  heading,
  subtext,
  sectionId = 'smartvideo-gallery',
  initialCount = INITIAL_COUNT,
}: AIVideoGalleryProps) {
  const allDemos = demos ?? MINIMAX_H3_DEMOS;
  const [category, setCategory] = useState<string>('All');
  const [visible, setVisible] = useState(initialCount);

  const categories = useMemo(() => ['All', ...DEMO_CATEGORIES], []);
  const filtered = useMemo(
    () =>
      category === 'All'
        ? allDemos
        : allDemos.filter((d) => d.category === category),
    [category, allDemos],
  );
  const shown = filtered.slice(0, visible);

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
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {categories.map((cat) => {
            const active = cat === category;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategory(cat);
                  setVisible(initialCount);
                }}
                aria-pressed={active}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? 'border-transparent bg-gradient-to-r from-cyan-400 to-purple-500 text-black'
                    : 'border-white/15 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((demo, i) => (
            <DemoMediaCard key={demo.slug} demo={demo} index={i} />
          ))}
        </div>

        {/* Show more */}
        {visible < filtered.length && (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => setVisible((v) => v + STEP)}
              className="rounded-full border border-white/15 bg-white/[0.04] px-7 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]"
            >
              Show More ({filtered.length - visible} more)
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
