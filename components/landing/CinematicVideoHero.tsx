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
      {/* Dragon video removed per request */}

      <div className="relative mx-auto flex min-h-[88vh] max-w-7xl items-center px-6">
        {/* LEFT 40–45%: headline + CTA */}
        <div className="w-full max-w-2xl py-24 md:w-[45%]">
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
        </div>
      </div>
    </section>
  );
}
