'use client';

import Link from 'next/link';
import AnimatedHeadline from './AnimatedHeadline';
import AnimatedLine from './AnimatedLine';
import {
  HERO_ANIMATED_CREATION_TYPES,
  HERO_AUDIENCE_PHRASES,
  HERO_BUSINESS_TYPE_PHRASES,
  HERO_WORKFLOW_STEPS,
  HERO_CREATION_PHRASE_INTERVAL_MS,
  HERO_AUDIENCE_PHRASE_INTERVAL_MS,
  HERO_BUSINESS_TYPE_PHRASE_INTERVAL_MS,
  HERO_PHRASE_TRANSITION_MS,
} from './heroConstants';

export default function HeroSection() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 pb-20 pt-20 md:pb-32 md:pt-28">
      <div className="landing-orb" style={{ left: '-6rem', top: '6rem', height: '18rem', width: '18rem', background: '#22d3ee' }} aria-hidden="true" />
      <div className="landing-orb" style={{ right: 0, top: '10rem', height: '24rem', width: '24rem', background: '#a855f7' }} aria-hidden="true" />

      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-5 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-cyan-200">
          Every output is personalized to your brand and style
        </p>

        <h1 className="mx-auto max-w-4xl text-5xl font-black tracking-tight md:text-7xl lg:text-8xl">
          <span className="landing-gradient-text" style={{ textWrap: 'balance' }}>Turn Any Local Business Into</span>
          <br className="hidden sm:inline" />
          <span className="mt-2 inline-block">
            <AnimatedHeadline
              phrases={HERO_ANIMATED_CREATION_TYPES}
              interval={HERO_CREATION_PHRASE_INTERVAL_MS}
              transition={HERO_PHRASE_TRANSITION_MS}
              className="text-5xl md:text-7xl lg:text-8xl"
            />
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/65 md:text-xl" style={{ textWrap: 'balance' }}>
          Find the business. Find their photos. Fix their assets. Personalize viral campaigns. Create content built specifically for them.
        </p>

        <div className="mt-4">
          <AnimatedLine
            text="SmartVideo GO gives [ANIMATED] an entire AI content production system for serving [ANIMATED]."
            words={[
              { phrases: HERO_AUDIENCE_PHRASES, interval: HERO_AUDIENCE_PHRASE_INTERVAL_MS },
              { phrases: HERO_BUSINESS_TYPE_PHRASES, interval: HERO_BUSINESS_TYPE_PHRASE_INTERVAL_MS },
            ]}
            interval={3000}
            transition={HERO_PHRASE_TRANSITION_MS}
            className="text-lg font-semibold text-white md:text-xl"
          />
        </div>

        <div className="mx-auto mt-6 max-w-2xl space-y-3 text-center text-base leading-7 text-white/60">
          <p>Enter a website — or discover a business.</p>
          <p>
            SmartVideo GO can find the business&apos;s:{' '}
            <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-cyan-200">
              <span>Branding</span>
              <span aria-hidden="true" className="text-white/25">•</span>
              <span>Photos</span>
              <span aria-hidden="true" className="text-white/25">•</span>
              <span>Products</span>
              <span aria-hidden="true" className="text-white/25">•</span>
              <span>Services</span>
              <span aria-hidden="true" className="text-white/25">•</span>
              <span>People</span>
              <span aria-hidden="true" className="text-white/25">•</span>
              <span>Offers</span>
            </span>
          </p>
          <p>Clean up their assets, personalize their content, and turn everything into videos, ads, graphics and social media content using 20+ AI Studios.</p>
        </div>

        <div className="mx-auto mt-8 max-w-2xl rounded-3xl border border-cyan-500/20 bg-cyan-500/[0.04] p-6 text-center">
          <p className="text-lg font-semibold text-white md:text-xl">
            Plus, with GO AI Viral, you can take viral video and image campaign concepts and personalize them for a specific business, product, service or niche.
          </p>
          <p className="mt-2 text-white/60">
            Turn what&apos;s already getting attention into branded campaigns built around the actual business you&apos;re promoting.
          </p>
          <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/studio/go-ai-viral"
              className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 px-6 py-3 text-sm font-bold text-black shadow-lg transition hover:scale-[1.02] sm:w-auto"
            >
              Personalize a Business
            </Link>
            <Link
              href="/studio/go-ai-viral"
              className="w-full rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/[0.08] sm:w-auto"
            >
              Explore GO AI Viral
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/35">Workflow</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm font-semibold text-white/75">
            {HERO_WORKFLOW_STEPS.map((step, i) => (
              <span key={step} className="flex items-center gap-3">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">{step}</span>
                {i < HERO_WORKFLOW_STEPS.length - 1 && (
                  <span aria-hidden="true" className="hidden text-white/25 sm:inline">
                    →
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
