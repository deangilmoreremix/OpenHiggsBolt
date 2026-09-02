'use client';
import { useRef } from 'react';
import Link from 'next/link';
import DemoMediaCard from './DemoMediaCard';
import { getDemosForNiche } from '@/data/nicheDemos';
import { type NicheConfig } from '@/data/nicheContent';
import { getCreateUrl } from '@/data/types';

type NicheSectionProps = {
  niche: NicheConfig;
  /** Override: pass demos directly instead of looking them up. */
  demos?: import('@/data/types').VideoDemo[];
};

export default function NicheSection({ niche, demos }: NicheSectionProps) {
  const activeDemos = demos ?? getDemosForNiche(niche.id);
  const reelRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    reelRef.current?.scrollBy({ left: dir * 380, behavior: 'smooth' });
  };

  return (
    <section className="border-y border-white/10 bg-[#030303] py-24" id={`niche-${niche.id}`}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
              {niche.label}
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
              {niche.heading}
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/60">{niche.subtext}</p>
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

        {/* Demo reel */}
        <div
          ref={reelRef}
          className="scrollbar-none mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scroll-padding:0_1.5rem]"
        >
          {activeDemos.map((demo, i) => (
            <div key={demo.slug} className="w-[85vw] shrink-0 snap-start sm:w-[45%] lg:w-[31%]">
              <DemoMediaCard demo={demo} index={i} ctaLabel={niche.ctaButton} />
            </div>
          ))}
        </div>

        {/* Personalize CTA */}
        <div className="mt-16 rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <h3 className="text-2xl font-black tracking-tight md:text-3xl">{niche.ctaHeading}</h3>
            <p
              className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/65 md:text-lg"
              dangerouslySetInnerHTML={{ __html: niche.ctaBody }}
            />
            <div className="mt-8">
              {activeDemos[0] ? (
                <Link
                  href={getCreateUrl(activeDemos[0])}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 px-8 py-3.5 text-sm font-bold text-black shadow-glow transition hover:scale-[1.01]"
                >
                  {niche.ctaButton}
                </Link>
              ) : (
                <span className="inline-flex items-center justify-center rounded-full bg-white/10 px-8 py-3.5 text-sm font-bold text-white/50">
                  {niche.ctaButton}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
