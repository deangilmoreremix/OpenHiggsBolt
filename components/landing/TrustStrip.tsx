'use client';
import { useMemo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
// SSR-safe (false until mounted): markup below depends on it, and motion's
// hook reads the real value on the first client render, breaking hydration.
import { useReducedMotion } from './useReducedMotion';
import CountUp from './fx/CountUp';
import { AutoplayToggle, useAutoplayToggle } from './fx/AutoplayToggle';
import { LOGOS } from './landingData';

// Figures already stated elsewhere on the page (hero, studio feature data).
const STATS = [
  { value: 230, suffix: '+', label: 'Video models' },
  { value: 74, suffix: '+', label: 'Image models' },
  { value: 20, suffix: '+', label: 'AI studios' },
  { value: 14, suffix: '', label: 'Lip-sync models' },
];

/**
 * "Built for teams creating" strip. The same audience tiles as before, now on
 * an Embla autoplay loop (drag/swipe-able, pauses on hover, pause button),
 * plus count-up stats (GSAP ScrollTrigger). With reduced motion the tiles stay
 * in the original static grid so all of them are visible without interaction.
 */
export default function TrustStrip() {
  const reduced = useReducedMotion();
  const plugins = useMemo(
    () => (reduced ? [] : [Autoplay({ delay: 1800, stopOnInteraction: false })]),
    [reduced],
  );
  const [viewportRef, embla] = useEmblaCarousel({ loop: true, align: 'start', dragFree: true }, plugins);
  const { paused, toggle, hoverHandlers } = useAutoplayToggle(embla);
  // Two copies so the loop always has more slides than fit on screen.
  const slides = [...LOGOS, ...LOGOS];

  return (
    <section className="border-y border-white/10 bg-white/[0.02]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex items-center justify-center gap-3">
          <p className="text-center text-sm uppercase tracking-[0.35em] text-white/35">Built for teams creating</p>
          {!reduced && <AutoplayToggle paused={paused} onToggle={toggle} label="audience carousel" />}
        </div>
        {reduced ? (
          // Reduced motion: no autoplay, so show every tile in the original static grid.
          <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-6">
            {LOGOS.map((logo) => (
              <li
                key={logo}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-5 text-center text-sm font-semibold text-white/50"
              >
                {logo}
              </li>
            ))}
          </ul>
        ) : (
          <div
            {...hoverHandlers}
            className="embla-viewport mt-6 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]"
            ref={viewportRef}
          >
            <ul className="embla-container">
              {slides.map((logo, i) => (
                <li
                  key={`${logo}-${i}`}
                  aria-hidden={i >= LOGOS.length || undefined}
                  className="min-w-0 shrink-0 grow-0 basis-1/2 pr-3 md:basis-1/4 lg:basis-1/6"
                >
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-5 text-center text-sm font-semibold text-white/50 transition hover:border-cyan-400/40 hover:text-white/80">
                    {logo}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <dl className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <CountUp
                  value={s.value}
                  suffix={s.suffix}
                  className="landing-gradient-text text-4xl font-black tracking-tight md:text-5xl"
                />
                <div className="mt-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/40">{s.label}</div>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
