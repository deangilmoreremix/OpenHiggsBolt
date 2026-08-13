'use client';
import { useMemo, useState } from 'react';
import DemoMediaCard from './DemoMediaCard';
import { MINIMAX_H3_DEMOS, DEMO_CATEGORIES } from '@/data/minimaxH3Demos';

const INITIAL_COUNT = 12;
const STEP = 12;

export default function AIVideoGallery() {
  const [category, setCategory] = useState<string>('All');
  const [visible, setVisible] = useState(INITIAL_COUNT);

  const categories = useMemo(() => ['All', ...DEMO_CATEGORIES], []);
  const filtered = useMemo(
    () =>
      category === 'All'
        ? MINIMAX_H3_DEMOS
        : MINIMAX_H3_DEMOS.filter((d) => d.category === category),
    [category],
  );
  const shown = filtered.slice(0, visible);

  return (
    <section id="minimax-gallery" className="border-y border-white/10 bg-[#030303] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Full showcase
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
            Every MiniMax H3 Demo, On Demand
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/60">
            Browse the full library. Open any prompt or jump straight into the matching studio.
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
                  setVisible(INITIAL_COUNT);
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
