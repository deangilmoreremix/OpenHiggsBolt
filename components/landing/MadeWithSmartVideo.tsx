'use client';
import { useRef } from 'react';
import DemoMediaCard from './DemoMediaCard';
import { MINIMAX_H3_DEMOS } from '@/data/minimaxH3Demos';
import { type VideoDemo } from '@/data/types';

const DEFAULT_REEL_SLUGS = [
  'luxury-perfume-commercial',
  'luxury-skincare-storyboard-commercial',
  'yellow-sunglasses-in-a-black-studio',
  'strawberry-drink-transformation-commercial',
  'emerald-bio-serum-product-film',
  'black-and-gold-perfume-commercial',
];

type MadeWithSmartVideoProps = {
  /** Slugs to feature in the reel. Defaults to the existing 6 Commercial/Fashion demos. */
  slugs?: string[];
  /** Override: pass pre-filtered demos directly instead of using slugs. */
  demos?: VideoDemo[];
};

export default function MadeWithSmartVideo({ slugs, demos }: MadeWithSmartVideoProps) {
  const reelRef = useRef<HTMLDivElement>(null);
  const activeDemos =
    demos ??
    (slugs ?? DEFAULT_REEL_SLUGS)
      .map((s) => MINIMAX_H3_DEMOS.find((d) => d.slug === s))
      .filter(Boolean) as typeof MINIMAX_H3_DEMOS;

  const scrollBy = (dir: 1 | -1) => {
    reelRef.current?.scrollBy({ left: dir * 380, behavior: 'smooth' });
  };

  return (
    <section className="border-y border-white/10 bg-[#030303] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
              Made with SmartVideo GO AI
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
              From a single idea to a finished commercial.
            </h2>
          </div>
          {/* Reel controls (desktop) */}
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Scroll reel left"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-white/80 transition hover:bg-white/[0.08]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Scroll reel right"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-white/80 transition hover:bg-white/[0.08]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Cinematic horizontal reel (snap). 1-up mobile, 2-up tablet, 3-up+ desktop. */}
        <div
          ref={reelRef}
          className="scrollbar-none mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scroll-padding:0_1.5rem]"
        >
          {activeDemos.map((demo, i) => (
            <div key={demo.slug} className="w-[85vw] shrink-0 snap-start sm:w-[45%] lg:w-[31%]">
              <DemoMediaCard demo={demo} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
