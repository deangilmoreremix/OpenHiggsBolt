'use client';
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

export default function UGCDemoShowcase({ demos }: UGCDemoShowcaseProps) {
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

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {activeDemos.map((item, i) => (
            <DemoMediaCard
              key={item.demo.slug}
              demo={item.demo}
              index={i}
              badge={item.badge}
              ctaLabel="Create This Type of Video"
              showViewPrompt={false}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
