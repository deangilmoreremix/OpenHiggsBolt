'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { UseEmblaCarouselType } from 'embla-carousel-react';

type EmblaCarouselType = NonNullable<UseEmblaCarouselType[1]>;

type Autoplay = { play: () => void; stop: () => void };

function autoplayOf(embla: EmblaCarouselType | undefined): Autoplay | undefined {
  return (embla?.plugins() as { autoplay?: Autoplay } | undefined)?.autoplay;
}

/**
 * Persistent pause/play for an Embla autoplay carousel (WCAG 2.2.2: moving
 * content that runs longer than five seconds needs a way to stop it).
 * Hover pausing is handled here rather than with the plugin's
 * stopOnMouseEnter, which would resume on mouse-leave after a manual pause.
 */
export function useAutoplayToggle(embla: EmblaCarouselType | undefined) {
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  pausedRef.current = paused;
  const hoveredRef = useRef(false);

  // The plugin restarts itself after drags, clicks and focus changes
  // (pointerUp, focusout, mouseleave), whatever our pause or hover says.
  // Every restart emits 'autoplay:play', so stop again while paused or
  // hovered. Deferred because the plugin only marks itself active after
  // emitting, so an immediate stop() would be a no-op.
  useEffect(() => {
    if (!embla) return;
    const keepPaused = () => {
      if (pausedRef.current || hoveredRef.current) queueMicrotask(() => autoplayOf(embla)?.stop());
    };
    embla.on('autoplay:play', keepPaused);
    return () => {
      embla.off('autoplay:play', keepPaused);
    };
  }, [embla]);

  const toggle = useCallback(() => {
    const autoplay = autoplayOf(embla);
    if (!autoplay) return;
    pausedRef.current = !paused;
    if (paused) autoplay.play();
    else autoplay.stop();
    setPaused(!paused);
  }, [embla, paused]);

  const hoverHandlers = {
    onMouseEnter: () => {
      hoveredRef.current = true;
      autoplayOf(embla)?.stop();
    },
    onMouseLeave: () => {
      hoveredRef.current = false;
      if (!paused) autoplayOf(embla)?.play();
    },
  };

  return { paused, toggle, hoverHandlers };
}

export function AutoplayToggle({
  paused,
  onToggle,
  label,
  className = '',
}: {
  paused: boolean;
  onToggle: () => void;
  /** What is moving, e.g. "testimonials". */
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={paused}
      aria-label={paused ? `Play ${label}` : `Pause ${label}`}
      className={`grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-white/70 transition hover:bg-white/[0.08] hover:text-white ${className}`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        {paused ? <path d="M8 5v14l11-7z" /> : <path d="M7 5h4v14H7zM13 5h4v14h-4z" />}
      </svg>
    </button>
  );
}
