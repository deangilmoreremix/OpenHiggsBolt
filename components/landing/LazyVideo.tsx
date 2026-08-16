'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

/* ── Global playback limiter ────────────────────────────────────────────────
 * Caps how many demo videos play at once so a 30-clip gallery doesn't try to
 * decode everything simultaneously. When the cap is hit, the oldest playing
 * video is paused. Keeps the page light and the network calm on mobile.
 */
const MAX_ACTIVE = 2;
const registry = new Set<() => void>();

function requestPlay(stop: () => void) {
  if (registry.size >= MAX_ACTIVE) {
    const oldest = registry.values().next().value as (() => void) | undefined;
    if (oldest) {
      oldest();
      registry.delete(oldest);
    }
  }
  registry.add(stop);
}
function releasePlay(stop: () => void) {
  registry.delete(stop);
}

export type LazyVideoProps = {
  src: string;
  poster: string;
  /** Accessible name for the media (not used when decorative). */
  label: string;
  /** Container classes — usually controls sizing/aspect-ratio. */
  className?: string;
  videoClassName?: string;
  /** Desktop hover starts muted playback. */
  hoverPlay?: boolean;
  /** Play automatically when scrolled into view. Default true. */
  autoPlayInView?: boolean;
  /** Hide from assistive tech and skip labelling (background hero video). */
  decorative?: boolean;
  preload?: 'none' | 'metadata';
  objectFit?: 'cover' | 'contain';
  /** Tap/click toggles playback (used on mobile cards). */
  toggleOnClick?: boolean;
};

/**
 * A performance-conscious <video> that:
 *  - never loads the file until it nears the viewport (poster first),
 *  - plays muted/inline only when visible + not reduced-motion,
 *  - pauses when scrolled away,
 *  - respects a global cap on simultaneously playing videos,
 *  - falls back to the poster under prefers-reduced-motion.
 */
export default function LazyVideo({
  src,
  poster,
  label,
  className = '',
  videoClassName = '',
  hoverPlay = false,
  autoPlayInView = true,
  decorative = false,
  preload = 'none',
  objectFit = 'cover',
  toggleOnClick = false,
}: LazyVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const stopRef = useRef<() => void>(() => {});
  const activeRef = useRef(false);
  const reduced = useReducedMotion();
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);

  stopRef.current = () => {
    ref.current?.pause();
  };

  // Reveal (attach observer) when near viewport.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '300px 0px', threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const shouldPlay = !reduced && (pinned || (inView && autoPlayInView) || (hovered && hoverPlay));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (shouldPlay) {
      // Attach the source lazily — never at page load.
      if (!el.getAttribute('src')) el.setAttribute('src', src);
      if (!activeRef.current) {
        requestPlay(stopRef.current);
        activeRef.current = true;
      }
      const p = el.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } else {
      if (activeRef.current) {
        releasePlay(stopRef.current);
        activeRef.current = false;
      }
      el.pause();
    }
  }, [shouldPlay, src]);

  const handleClick = useCallback(() => {
    if (toggleOnClick) setPinned((p) => !p);
  }, [toggleOnClick]);

  return (
    <div
      className={`relative overflow-hidden bg-black/40 ${className}`}
      onMouseEnter={hoverPlay ? () => setHovered(true) : undefined}
      onMouseLeave={hoverPlay ? () => setHovered(false) : undefined}
      onClick={handleClick}
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={ref}
        poster={poster}
        muted
        playsInline
        loop
        preload={preload}
        aria-hidden={decorative || undefined}
        aria-label={decorative ? undefined : label}
        tabIndex={-1}
        className={`h-full w-full ${objectFit === 'contain' ? 'object-contain' : 'object-cover'} ${videoClassName}`}
      />
    </div>
  );
}
