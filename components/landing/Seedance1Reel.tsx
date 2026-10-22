'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import DemoMediaCard from './DemoMediaCard';
import { SEEDANCE_1_DEMOS } from '@/data/seedance1Demos';

/**
 * Same reel and demos, now an Embla carousel: drag/swipe with momentum,
 * snapping, and arrow buttons that dim at either end. A progress bar tracks
 * the position in the reel.
 */
export default function Seedance1Reel() {
  const [viewportRef, embla] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps', skipSnaps: true });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const progressRef = useRef<HTMLDivElement>(null);

  const sync = useCallback(() => {
    if (!embla) return;
    setCanPrev(embla.canScrollPrev());
    setCanNext(embla.canScrollNext());
  }, [embla]);

  // Written straight to the DOM: 'scroll' fires every frame while dragging.
  const syncProgress = useCallback(() => {
    if (!embla || !progressRef.current) return;
    const p = Math.max(0, Math.min(1, embla.scrollProgress()));
    progressRef.current.style.transform = `scaleX(${Math.max(0.08, p)})`;
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    sync();
    syncProgress();
    embla.on('select', sync).on('reInit', sync).on('scroll', syncProgress).on('reInit', syncProgress);
    return () => {
      embla.off('select', sync).off('reInit', sync).off('scroll', syncProgress).off('reInit', syncProgress);
    };
  }, [embla, sync, syncProgress]);

  const scrollBy = (dir: 1 | -1) => {
    if (dir === 1) embla?.scrollNext();
    else embla?.scrollPrev();
  };

  return (
    <section className="border-y border-white/10 bg-[#030303] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
              Seedance 2.0
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
              From a single idea to a finished commercial.
            </h2>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Scroll reel left"
              disabled={!canPrev}
              className="grid h-10 w-10 disabled:opacity-30 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-white/80 transition hover:bg-white/[0.08]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Scroll reel right"
              disabled={!canNext}
              className="grid h-10 w-10 disabled:opacity-30 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-white/80 transition hover:bg-white/[0.08]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="embla-viewport mt-10 pb-2" ref={viewportRef}>
          <div className="embla-container">
            {SEEDANCE_1_DEMOS.map((demo, i) => (
              <div key={demo.slug} className="min-w-0 shrink-0 grow-0 basis-[85%] pr-5 sm:basis-[45%] lg:basis-[31%]">
                <DemoMediaCard demo={demo} index={i} />
              </div>
            ))}
          </div>
        </div>
        <div aria-hidden="true" className="mx-auto mt-6 h-0.5 max-w-xs overflow-hidden rounded-full bg-white/10">
          <div
            ref={progressRef}
            className="h-full origin-left scale-x-[0.08] bg-gradient-to-r from-cyan-400 to-purple-500"
          />
        </div>
      </div>
    </section>
  );
}
