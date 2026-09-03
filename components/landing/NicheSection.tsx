'use client';
import { useState, useMemo } from 'react';
import DemoMediaCard from './DemoMediaCard';
import { getDemosForNiche } from '@/data/nicheDemos';
import { type NicheConfig } from '@/data/nicheContent';
import { getCreateUrl } from '@/data/types';
import { useDemoPersonalize } from '@/shared/personalization';
import { NICHE_CTA_BY_ID } from './landingData';

const INITIAL_COUNT = 10;
const STEP = 10;

type NicheSectionProps = {
  niche: NicheConfig;
  /** Override: pass demos directly instead of looking them up. */
  demos?: import('@/data/types').VideoDemo[];
};

export default function NicheSection({ niche, demos }: NicheSectionProps) {
  const activeDemos = demos ?? getDemosForNiche(niche.id);
  const [visible, setVisible] = useState(INITIAL_COUNT);
  const shown = activeDemos.slice(0, visible);
  const hasMore = visible < activeDemos.length;

  // Look up the niche-specific personalization CTA copy from the shared
  // landing data. Falls back to the fields baked into the niche config so
  // any unknown niche id still renders sensibly.
  const cta = useMemo(() => NICHE_CTA_BY_ID[niche.id], [niche.id]);
  const ctaHeading = cta?.ctaHeading ?? niche.ctaHeading;
  const ctaBody = cta?.ctaBody ?? niche.ctaBody;
  const ctaButton = cta?.ctaButton ?? niche.ctaButton;

  const { openPersonalize } = useDemoPersonalize();

  // Open the personalization modal with the first demo in this niche as the
  // source. We attach the niche id to the source's metadata so the modal can
  // render the matching heading/body/button when it opens.
  const handlePersonalize = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const firstDemo = activeDemos[0];
    if (!firstDemo) return;
    e.preventDefault();
    openPersonalize({
      source: {
        ...firstDemo,
        sourceMetadata: {
          ...(firstDemo.sourceMetadata || {}),
          nicheId: niche.id,
        },
      },
      trigger: e.currentTarget,
    });
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
        </div>

        {/* Demo grid */}
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((demo, i) => (
            <DemoMediaCard key={demo.slug} demo={demo} index={i} ctaLabel={niche.ctaButton} />
          ))}
        </div>

        {/* Show more */}
        {hasMore && (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => setVisible((v) => Math.min(v + STEP, activeDemos.length))}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-7 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]"
            >
              Show More
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-white/70">
                {activeDemos.length - visible} more
              </span>
            </button>
          </div>
        )}

{/* Personalize CTA */}
        <div className="mt-16 rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <h3 className="text-2xl font-black tracking-tight md:text-3xl">{ctaHeading}</h3>
            <p
              className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/65 md:text-lg"
              dangerouslySetInnerHTML={{ __html: ctaBody }}
            />
            <div className="mt-8">
              {activeDemos[0] ? (
                <a
                  href={getCreateUrl(activeDemos[0])}
                  onClick={handlePersonalize}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 px-8 py-3.5 text-sm font-bold text-black shadow-glow transition hover:scale-[1.01]"
                >
                  {ctaButton}
                </a>
              ) : (
                <span className="inline-flex items-center justify-center rounded-full bg-white/10 px-8 py-3.5 text-sm font-bold text-white/50">
                  {ctaButton}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
