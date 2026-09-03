'use client';
import { useRef } from 'react';
import LazyVideo, { type LazyVideoHandle } from './LazyVideo';
import Reveal from './Reveal';
import { useDemoPrompt } from './DemoPromptModal';
import { getCreateUrl, type MinimaxDemo } from '@/data/minimaxH3Demos';

type DemoMediaCardProps = {
  demo: MinimaxDemo;
  ctaLabel?: string;
  showUseCase?: boolean;
  showViewPrompt?: boolean;
  /** Badge text shown top-left (defaults to the demo category). */
  badge?: string;
  aspectClassName?: string;
  objectFit?: 'cover' | 'contain';
  /** Stagger the reveal animation. */
  index?: number;
};

export default function DemoMediaCard({
  demo,
  ctaLabel = 'Create This Style',
  showUseCase = true,
  showViewPrompt = true,
  badge,
  aspectClassName = 'aspect-video',
  objectFit = 'cover',
  index = 0,
}: DemoMediaCardProps) {
  const { openPrompt } = useDemoPrompt();
  const videoRef = useRef<LazyVideoHandle>(null);

  return (
    <Reveal
      as="article"
      delay={Math.min(index, 8) * 60}
      className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] transition duration-300 hover:border-white/20 hover:bg-white/[0.04]"
    >
      {/* Media */}
      <div className="relative">
        {/* Image fallback guarantees the poster renders immediately even if
            the video element suppresses the poster attribute under preload=none
            or other browser quirks. The <video> sits on top and covers it once
            it loads. */}
        <img
          src={demo.posterSrc}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 ${aspectClassName} w-full ${objectFit === 'contain' ? 'object-contain' : 'object-cover'}`}
        />
        <LazyVideo
          ref={videoRef}
          src={demo.videoSrc}
          poster={demo.posterSrc}
          label={`${demo.title} — video preview`}
          hoverPlay
          toggleOnClick
          preload="metadata"
          className={`${aspectClassName} w-full`}
          objectFit={objectFit}
        />
        <span className="glass-panel absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90">
          {badge ?? demo.category}
        </span>
        {/* Real, deterministic play control (clickable, not pointer-events-none) */}
        <button
          type="button"
          aria-label={`Play ${demo.title} preview`}
          onClick={(e) => {
            e.stopPropagation();
            videoRef.current?.toggle();
          }}
          className="absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 focus:outline-none"
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-white/15 backdrop-blur transition group-hover:scale-105">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-snug text-white">{demo.title}</h3>
        {showUseCase && <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-white/55">{demo.useCase}</p>}

        <div className="mt-auto flex flex-col gap-2 pt-5">
          {showViewPrompt && (
            <button
              type="button"
              onClick={(e) => openPrompt(demo, e.currentTarget)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              View Prompt
            </button>
          )}
          <a
            href={getCreateUrl(demo)}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 px-4 py-2.5 text-sm font-bold text-black shadow-glow transition hover:scale-[1.01]"
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    </Reveal>
  );
}
