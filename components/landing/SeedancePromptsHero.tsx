'use client';
import { useRef } from 'react';
import Link from 'next/link';
import LazyVideo from './LazyVideo';
import Magnetic from './fx/Magnetic';
import { useCinematicHero } from './fx/useCinematicHero';
import { HERO_DEMO_SP } from '@/data/seedancePromptsDemos';
import { getCreateUrl } from '@/data/types';

export default function SeedancePromptsHero() {
  const hero = HERO_DEMO_SP;
  // The Seedance prompt clips under /media/seedance-prompts were never
  // shipped (placeholder.mp4 is missing and the other .mp4 files there are
  // "Not Found" text), so fall back to the cinematic hero loop that is.
  const videoSrc = hero?.videoSrc ?? '/media/minimax-h3/videos/golden-guardian-web-hero-loop.webm';
  const posterSrc =
    hero?.posterSrc ?? '/media/minimax-h3/previews/golden-guardian-web-hero-loop.svg';

  const rootRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  // GSAP ScrollTrigger: video parallax + staggered copy reveal.
  useCinematicHero(rootRef, mediaRef, copyRef);

  return (
    <section ref={rootRef} className="relative isolate min-h-[88vh] w-full overflow-hidden bg-black">
      <div ref={mediaRef} className="absolute inset-0 will-change-transform">
        <LazyVideo
          src={videoSrc}
          poster={posterSrc}
          label={hero?.title ?? 'Seedance prompts hero'}
          decorative
          preload="metadata"
          className="h-full w-full"
          videoClassName="scale-105"
        />
      </div>

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
        <div ref={copyRef} className="w-full max-w-2xl py-24 md:w-[45%]">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-4 py-1.5 text-xs font-medium uppercase tracking-[0.25em] text-cyan-200 backdrop-blur">
            Community Curated
          </p>
          <h2 className="text-5xl font-black leading-[0.95] tracking-tight text-white md:text-6xl lg:text-7xl">
            {hero?.title ?? 'Community Seedance Prompts'}
          </h2>
          {hero?.useCase && (
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/70 md:text-xl">
              {hero.useCase}
            </p>
          )}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Magnetic className="w-full sm:w-auto">
              <a
                href={getCreateUrl(hero ?? ({ slug: 'placeholder', sourceRepo: 'seedance2prompt' } as any))}
                className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 px-7 py-3.5 text-sm font-bold text-black shadow-glow transition sm:w-auto fx-shine"
              >
                Start Creating
              </a>
            </Magnetic>
            <Magnetic className="w-full sm:w-auto">
              <Link
                href="#smartvideo-gallery-prompts"
                className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-7 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/[0.08] sm:w-auto"
              >
                Watch More
              </Link>
            </Magnetic>
          </div>
        </div>
      </div>
    </section>
  );
}
