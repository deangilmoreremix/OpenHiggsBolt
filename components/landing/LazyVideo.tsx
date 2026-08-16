'use client';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

/* ── Global playback limiter ────────────────────────────────────────────────
 * Caps how many demo videos play at once so a 30-clip gallery doesn't try to
 * decode everything simultaneously. When the cap is hit, the oldest non-pinned
 * (autoplay-only) video is paused first; if they're all pinned, the oldest
 * entry is evicted anyway. Keeps the page light and the network calm on mobile.
 */
const MAX_ACTIVE = 6;
type RegistryEntry = { stop: () => void; pinned: boolean };
const registry = new Map<() => void, RegistryEntry>();

function requestPlay(stop: () => void, pinned: boolean) {
  if (registry.size >= MAX_ACTIVE) {
    // Prefer evicting the oldest non-pinned entry so user-initiated
    // (pinned) videos win over autoplay-only ones.
    let victim: (() => void) | undefined;
    for (const [s, entry] of registry) {
      if (!entry.pinned) {
        victim = s;
        break;
      }
    }
    if (!victim) {
      victim = registry.keys().next().value as (() => void) | undefined;
    }
    if (victim) {
      victim();
      registry.delete(victim);
    }
  }
  registry.set(stop, { stop, pinned });
}
function releasePlay(stop: () => void) {
  registry.delete(stop);
}

export type LazyVideoHandle = {
  play: () => void;
  pause: () => void;
  toggle: () => void;
};

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
const LazyVideo = forwardRef<LazyVideoHandle, LazyVideoProps>(function LazyVideo(
  {
    src,
    poster,
    label,
    className = '',
    videoClassName = '',
    hoverPlay = false,
    autoPlayInView = true,
    decorative = false,
    preload = 'metadata',
    objectFit = 'cover',
    toggleOnClick = false,
  },
  handleRef,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeRef = useRef(false);
  const reduced = useReducedMotion();
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [srcSet, setSrcSet] = useState(false);

  // Stable stop function — must NOT be recreated per render, otherwise the
  // playback registry keys become inconsistent and the cap leaks/behaves wrong.
  const stop = useCallback(() => {
    videoRef.current?.pause();
  }, []);

  // Ensure the muted property is set imperatively — React does not reliably set
  // the `muted` DOM *property* from the JSX attribute, and autoplay policies
  // check the property, not the attribute.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    el.defaultMuted = true;
  }, []);

  // Reveal (attach observer) when near viewport.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '300px 0px', threshold: 0.01 },
    );
    io.observe(el);

    // IntersectionObserver may not fire for elements already in view at
    // mount time. Check after paint so layout is complete.
    const raf = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        setInView(true);
      }
    });

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  // Assign the video source once the element is near the viewport OR when the
  // video has been user-pinned (so click-to-play works even for cards that
  // haven't scrolled into view yet).
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !src || srcSet) return;
    if (inView || pinned) {
      el.muted = true;
      el.defaultMuted = true;
      el.src = src;
      setSrcSet(true);
    }
  }, [inView, pinned, src, srcSet]);

  const logPlayBlock = (p: Promise<void> | undefined) => {
    if (p && typeof p.catch === 'function') {
      p.catch((e) => console.warn('[LazyVideo] play blocked:', (e as { name?: string })?.name));
    }
  };

  // Auto / hover / pinned playback driven by reactive state.
  const shouldPlay = !reduced && (pinned || (inView && autoPlayInView) || (hovered && hoverPlay));

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !srcSet) return;
    if (shouldPlay) {
      el.muted = true;
      el.defaultMuted = true;
      if (activeRef.current) {
        // Already active: just keep the pinned flag in the registry accurate.
        const entry = registry.get(stop);
        if (entry) entry.pinned = pinned;
      } else {
        requestPlay(stop, pinned);
        activeRef.current = true;
      }
      logPlayBlock(el.play());
    } else {
      if (activeRef.current) {
        releasePlay(stop);
        activeRef.current = false;
      }
      el.pause();
    }
  }, [shouldPlay, srcSet, pinned, stop]);

  // ── Imperative handle (runs inside the user gesture) ──────────────────────
  const play = useCallback(() => {
    const el = videoRef.current;
    if (!el || !src) return;
    if (!el.src) {
      el.muted = true;
      el.defaultMuted = true;
      el.src = src;
      setSrcSet(true);
    }
    el.muted = true;
    el.defaultMuted = true;
    if (activeRef.current) {
      const entry = registry.get(stop);
      if (entry) entry.pinned = true;
    } else {
      requestPlay(stop, true);
      activeRef.current = true;
    }
    setPinned(true);
    logPlayBlock(el.play());
  }, [src, stop]);

  const pause = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.pause();
    if (activeRef.current) {
      releasePlay(stop);
      activeRef.current = false;
    }
    setPinned(false);
  }, [stop]);

  const toggle = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      play();
    } else {
      el.pause();
      if (activeRef.current) {
        releasePlay(stop);
        activeRef.current = false;
      }
      setPinned(false);
    }
  }, [play, stop]);

  useImperativeHandle(
    handleRef,
    () => ({ play, pause, toggle }),
    [play, pause, toggle],
  );

  const handleClick = useCallback(() => {
    if (toggleOnClick) toggle();
  }, [toggleOnClick, toggle]);

  return (
    <div
      className={`relative overflow-hidden bg-black/40 ${className}`}
      onMouseEnter={hoverPlay ? () => setHovered(true) : undefined}
      onMouseLeave={hoverPlay ? () => setHovered(false) : undefined}
      onClick={handleClick}
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
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
});

export default LazyVideo;
