'use client';
import DemoMediaCard from './DemoMediaCard';
import { MINIMAX_H3_DEMOS } from '@/data/minimaxH3Demos';

// Four UGC concepts presented as social-style cards.
const UGC = [
  { slug: 'ramen-bowl-ugc-taste-test', badge: 'Restaurant' },
  { slug: 'gourmet-burger-ugc-taste-test', badge: 'Local Business' },
  { slug: 'blackberry-vanilla-soda-ugc-vlog', badge: 'Beverage' },
  { slug: 'morning-lip-oil-ugc-testimonial', badge: 'Beauty' },
];

export default function UGCDemoShowcase() {
  const demos = UGC.map((u) => MINIMAX_H3_DEMOS.find((d) => d.slug === u.slug)).filter(
    Boolean,
  ) as typeof MINIMAX_H3_DEMOS;

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

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {demos.map((demo, i) => {
            const badge = UGC.find((u) => u.slug === demo.slug)?.badge;
            return (
              <DemoMediaCard
                key={demo.slug}
                demo={demo}
                index={i}
                badge={badge}
                ctaLabel="Create This Type of Video"
                showViewPrompt={false}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
