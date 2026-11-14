'use client';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import DemoMediaCard from './DemoMediaCard';
import { useReducedMotion } from './useReducedMotion';
import { gsap, Flip } from './fx/gsap';
import { type VideoDemo } from '@/data/types';

/** Cards mounted on each side of the visible range; the rest are placeholders. */
const BUFFER = 3;
/** Grid ("View all") cards shown at first and added per "Show more". */
const GRID_STEP = 12;

type DemoCarouselProps = {
  demos: VideoDemo[];
  /** Names the carousel for assistive tech, e.g. "E-commerce demos". */
  label: string;
  /** Slide widths; one card on phones, about three on desktop by default. */
  slideClassName?: string;
  /** Column layout for the "View all" grid. */
  gridClassName?: string;
};

function Arrow({ dir, disabled, onClick, label }: { dir: 'prev' | 'next'; disabled: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${dir === 'prev' ? 'Previous' : 'Next'} ${label}`}
      className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-white/80 transition hover:bg-white/[0.08] disabled:opacity-30 sm:h-10 sm:w-10"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d={dir === 'prev' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

/**
 * A row of demo cards on an Embla carousel: drag/swipe with momentum, arrow
 * buttons that dim at either end, Left/Right keys, and a progress bar. Only
 * the cards near the visible range are mounted (the rest are empty
 * placeholders), so a long row stays light. "View all" swaps the row for a
 * grid with "Show more"; when the list changes there (a gallery filter), the
 * cards glide to their new places with GSAP Flip.
 */
export default function DemoCarousel({
  demos,
  label,
  slideClassName = 'basis-[85%] sm:basis-[45%] lg:basis-[31%]',
  gridClassName = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
}: DemoCarouselProps) {
  const reduced = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [viewportRef, embla] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    skipSnaps: true,
    ...(reduced ? { duration: 0 } : {}),
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(demos.length > 1);
  const [mountedUpTo, setMountedUpTo] = useState(BUFFER * 2);
  const progressRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const emblaRef = useRef(embla);
  emblaRef.current = embla;

  const sync = useCallback(() => {
    if (!embla) return;
    setCanPrev(embla.canScrollPrev());
    setCanNext(embla.canScrollNext());
    const inView = embla.slidesInView();
    const last = inView.length ? Math.max(...inView) : 0;
    // Mounted cards stay mounted: unmounting would restart their videos.
    setMountedUpTo((m) => Math.max(m, last + BUFFER));
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
    embla
      .on('select', sync)
      .on('slidesInView', sync)
      .on('reInit', sync)
      .on('scroll', syncProgress)
      .on('reInit', syncProgress);
    return () => {
      embla
        .off('select', sync)
        .off('slidesInView', sync)
        .off('reInit', sync)
        .off('scroll', syncProgress)
        .off('reInit', syncProgress);
    };
  }, [embla, sync, syncProgress]);

  // A new list (a gallery filter). Reset during render, so the grid's old
  // card positions can still be read for Flip before React replaces them.
  const [gridCount, setGridCount] = useState(GRID_STEP);
  const [listFor, setListFor] = useState(demos);
  const gridRef = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  if (listFor !== demos) {
    if (expanded && !reduced && gridRef.current) {
      flipState.current = Flip.getState(gridRef.current.querySelectorAll('[data-flip-id]'));
    }
    setListFor(demos);
    setGridCount(GRID_STEP);
    setMountedUpTo(BUFFER * 2);
  }

  // After a new list renders: the grid glides cards that stay to their new
  // places and fades in new ones; the row jumps back to the start and
  // crossfades.
  const firstList = useRef(true);
  useLayoutEffect(() => {
    if (firstList.current) {
      firstList.current = false;
      return;
    }
    const state = flipState.current;
    flipState.current = null;
    if (state && gridRef.current) {
      Flip.from(state, {
        targets: gridRef.current.querySelectorAll('[data-flip-id]'),
        duration: 0.6,
        ease: 'power3.inOut',
        stagger: 0.02,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.45, delay: 0.15 }),
      });
    }
    if (trackRef.current) {
      emblaRef.current?.scrollTo(0, true);
      if (!reduced) gsap.fromTo(trackRef.current, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power2.out' });
    }
    // Only a new list should trigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demos]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (expanded || (e.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      embla?.scrollNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      embla?.scrollPrev();
    }
  };

  if (!demos.length) return null;

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label} onKeyDown={onKeyDown}>
      <div className="mb-4 flex items-center justify-between gap-3">
        {demos.length > 1 ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]"
          >
            {expanded ? 'Show as carousel' : `View all ${demos.length}`}
          </button>
        ) : (
          <span />
        )}
        {!expanded && demos.length > 1 && (
          <div className="flex gap-2">
            <Arrow dir="prev" label={label} disabled={!canPrev} onClick={() => embla?.scrollPrev()} />
            <Arrow dir="next" label={label} disabled={!canNext} onClick={() => embla?.scrollNext()} />
          </div>
        )}
      </div>

      {expanded ? (
        <>
          <div ref={gridRef} className={`grid gap-5 ${gridClassName}`}>
            {demos.slice(0, gridCount).map((demo, i) => (
              <div key={demo.slug} data-flip-id={demo.slug}>
                <DemoMediaCard demo={demo} index={i} />
              </div>
            ))}
          </div>
          {gridCount < demos.length && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setGridCount((c) => c + GRID_STEP)}
                className="rounded-full border border-white/15 bg-white/[0.04] px-7 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]"
              >
                Show More ({demos.length - gridCount} more)
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="embla-viewport pb-2" ref={viewportRef}>
            <div ref={trackRef} className="embla-container">
              {demos.map((demo, i) => (
                <div
                  key={demo.slug}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${demos.length}`}
                  className={`min-w-0 shrink-0 grow-0 pr-5 ${slideClassName}`}
                >
                  {i <= mountedUpTo ? (
                    <DemoMediaCard demo={demo} index={Math.min(i, 3)} />
                  ) : (
                    <div aria-hidden="true" className="aspect-video rounded-3xl border border-white/10 bg-white/[0.02]" />
                  )}
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
        </>
      )}
    </div>
  );
}
