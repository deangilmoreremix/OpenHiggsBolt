'use client';
import Link from 'next/link';
import LazyVideo from './LazyVideo';
import { HERO_DEMO } from '@/data/minimaxH3Demos';
import { getCreateUrl } from '@/data/types';

export default function CinematicVideoHero() {
  const hero = HERO_DEMO;
  const videoSrc = hero?.videoSrc ?? '/media/minimax-h3/videos/golden-guardian-web-hero-loop.webm';
  const posterSrc =
    hero?.posterSrc ?? '/media/minimax-h3/previews/golden-guardian-web-hero-loop.svg';

  return (
    <section className="relative isolate min-h-[88vh] w-full overflow-hidden bg-black">
      {/* Full-bleed cinematic background video (right-weighted visibility). */}
      <LazyVideo
        src={videoSrc}
        poster={posterSrc}
        label="Porto Francesinha comedy recipe hero loop"
        decorative
        preload="metadata"
        className="absolute inset-0 h-full w-full"
        videoClassName="scale-105"
      />

      {/* Left-to-right scrim keeps the headline readable while the video stays
          visible on the right. */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-transparent"
        aria-hidden="true"
      />
      {/* Vignette. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 120% at 50% 50%, transparent 55%, rgba(0,0,0,0.65) 100%)',
        }}
        aria-hidden="true"
      />
      {/* Bottom gradient into the next section. */}
      <div
        className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050505] to-transparent"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-[88vh] max-w-7xl items-center px-6">
        {/* LEFT 40–45%: headline + CTA */}
        <div className="w-full max-w-2xl py-24 md:w-[45%]">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-4 py-1.5 text-xs font-medium uppercase tracking-[0.25em] text-cyan-200 backdrop-blur">
            Powered by SmartVideo GO AI
          </p>
          <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-white md:text-7xl lg:text-8xl">
            Create Anything.
            <br />
            <span className="landing-gradient-text">Sell Everything.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/70 md:text-xl">
            Create professional images, videos, ads, characters, commercials and social content
            with AI.
          </p>

          <div className="mt-7 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 font-semibold text-white/80">
              200+ AI Models
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 font-semibold text-white/80">
              20 Professional Studios
            </span>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              href={getCreateUrl(hero ?? ({ slug: 'golden-guardian-web-hero-loop' } as any))}
              className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 px-7 py-3.5 text-sm font-bold text-black shadow-glow transition hover:scale-[1.02] sm:w-auto"
            >
              Start Creating
            </a>
            <Link
              href="#smartvideo-showcase"
              className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-7 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/[0.08] sm:w-auto"
            >
              Watch What You Can Make
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
