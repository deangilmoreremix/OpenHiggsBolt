'use client';
import Link from 'next/link';
import LazyVideo from './LazyVideo';
import { HERO_DEMO_PF } from '@/data/promptFeedDemos';
import { getCreateUrl } from '@/data/types';

export default function PromptFeedHero() {
  const hero = HERO_DEMO_PF;
  const videoSrc = hero?.videoSrc ?? '/media/promptfeed/videos/placeholder.mp4';
  const posterSrc =
    hero?.posterSrc ?? '/media/promptfeed/previews/placeholder.jpg';

  return (
    <section className="relative isolate min-h-[88vh] w-full overflow-hidden bg-black">
      <LazyVideo
        src={videoSrc}
        poster={posterSrc}
        label={hero?.title ?? 'Prompt feed hero'}
        decorative
        preload="metadata"
        className="absolute inset-0 h-full w-full"
        videoClassName="scale-105"
      />

      <div
        className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-transparent"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 120% at 50% 50%, transparent 55%, rgba(0,0,0,0.65) 100%)',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-[88vh] max-w-7xl items-center px-6">
        <div className="w-full max-w-2xl py-24 md:w-[45%]">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-4 py-1.5 text-xs font-medium uppercase tracking-[0.25em] text-cyan-200 backdrop-blur">
            AI-Powered
          </p>
          <h2 className="text-5xl font-black leading-[0.95] tracking-tight text-white md:text-6xl lg:text-7xl">
            {hero?.title ?? 'AI Video Showcase'}
          </h2>
          {hero?.useCase && (
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/70 md:text-xl">
              {hero.useCase}
            </p>
          )}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              href={getCreateUrl(hero ?? ({ slug: 'placeholder', sourceRepo: 'promptfeed' } as any))}
              className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 px-7 py-3.5 text-sm font-bold text-black shadow-glow transition hover:scale-[1.02] sm:w-auto"
            >
              Start Creating
            </a>
            <Link
              href="#smartvideo-gallery-pf"
              className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-7 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/[0.08] sm:w-auto"
            >
              Watch More
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
