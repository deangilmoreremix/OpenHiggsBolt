'use client';
import { useState } from 'react';
import Link from 'next/link';
import DemoModal from './DemoModal';

export default function FeatureDemos({ features }) {
  const [activeFeature, setActiveFeature] = useState(null);

  return (
    <section id="demos" className="mx-auto max-w-7xl px-6 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Interactive demos</p>
        <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">Try every studio capability without a login.</h2>
        <p className="mt-5 text-lg leading-8 text-white/60">
          Each demo mirrors the full studio interaction pattern: choose a mode, enter a prompt, generate a local preview, then open the full tool.
        </p>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <article key={feature.id} className="landing-card rounded-3xl p-5 transition hover:-translate-y-1 hover:border-cyan-300/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">{feature.eyebrow}</p>
                <h3 className="mt-3 text-xl font-black text-white">{feature.label}</h3>
              </div>
              <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/50">{feature.eta}</span>
            </div>
            <p className="mt-4 min-h-[72px] text-sm leading-6 text-white/55">{feature.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {feature.stats.map((stat) => (
                <span key={stat} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/55">{stat}</span>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setActiveFeature(feature)}
                className="flex-1 rounded-full bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-white/90"
              >
                Use demo
              </button>
              <Link href={feature.ctaPath} className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/70 transition hover:bg-white/[0.08] hover:text-white">
                Open
              </Link>
            </div>
          </article>
        ))}
      </div>

      {activeFeature && (
        <DemoModal feature={activeFeature} onClose={() => setActiveFeature(null)} />
      )}
    </section>
  );
}
