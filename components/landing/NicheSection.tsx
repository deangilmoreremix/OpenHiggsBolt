'use client';
import DemoCarousel from './DemoCarousel';
import { getDemosForNiche } from '@/data/nicheDemos';
import { type NicheConfig } from '@/data/nicheContent';

type NicheSectionProps = {
  niche: NicheConfig;
  /** Override: pass demos directly instead of looking them up. */
  demos?: import('@/data/types').VideoDemo[];
};

/**
 * One industry: heading and copy, then every demo for that industry on a
 * swipeable carousel row ("View all" opens the grid). Personalization is
 * attached to each demo card.
 */
export default function NicheSection({ niche, demos }: NicheSectionProps) {
  const activeDemos = demos ?? getDemosForNiche(niche.id);

  return (
    <section className="border-y border-white/10 bg-[#030303] py-24" id={`niche-${niche.id}`}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            {niche.label}
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
            {niche.heading}
          </h2>
          <p className="mt-5 text-lg leading-8 text-white/60">{niche.subtext}</p>
        </div>

        <div className="mt-10">
          <DemoCarousel demos={activeDemos} label={`${niche.label} demos`} />
        </div>
      </div>
    </section>
  );
}
