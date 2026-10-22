'use client';
import { useMemo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { motion, useReducedMotion } from 'motion/react';
import { AutoplayToggle, useAutoplayToggle } from './fx/AutoplayToggle';

type Testimonial = { quote: string; name: string; role: string };

function CarouselArrow({ dir, onClick }: { dir: 'prev' | 'next'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === 'prev' ? 'Previous testimonial' : 'Next testimonial'}
      className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-white/70 transition hover:bg-white/[0.08] hover:text-white"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
 * Testimonials on an Embla autoplay loop (swipe/drag-able, pauses on hover).
 * The list is repeated so the loop never runs out of slides on wide screens;
 * the repeats are hidden from assistive tech. A pause button stops autoplay, and
 * previous/next buttons step through the quotes with or without autoplay.
 */
export default function TestimonialCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const reduced = useReducedMotion();
  const plugins = useMemo(
    () => (reduced ? [] : [Autoplay({ delay: 4200, stopOnInteraction: false })]),
    [reduced],
  );
  const [viewportRef, embla] = useEmblaCarousel({ loop: true, align: 'start' }, plugins);
  const { paused, toggle, hoverHandlers } = useAutoplayToggle(embla);
  const slides = [...testimonials, ...testimonials];

  return (
    <div>
      {/* Prev/next stay available without autoplay (reduced motion) so keyboard users can reach every quote. */}
      <div className="mb-4 flex justify-end gap-2">
        <CarouselArrow dir="prev" onClick={() => embla?.scrollPrev()} />
        {!reduced && <AutoplayToggle paused={paused} onToggle={toggle} label="testimonials" />}
        <CarouselArrow dir="next" onClick={() => embla?.scrollNext()} />
      </div>
      <div
        {...hoverHandlers}
        className="embla-viewport [mask-image:linear-gradient(90deg,transparent,black_4%,black_96%,transparent)]"
        ref={viewportRef}
      >
        <div className="embla-container">
          {slides.map((t, i) => (
            <div
              key={`${t.name}-${i}`}
              aria-hidden={i >= testimonials.length || undefined}
              className="min-w-0 shrink-0 grow-0 basis-[88%] pr-5 sm:basis-1/2 md:basis-1/3"
            >
              <motion.figure
                whileHover={reduced ? undefined : { y: -6 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="landing-card h-full rounded-3xl p-7"
              >
                <blockquote className="text-base leading-7 text-white/70">"{t.quote}"</blockquote>
                <figcaption className="mt-6">
                  <div className="font-bold text-white">{t.name}</div>
                  <div className="text-sm text-white/45">{t.role}</div>
                </figcaption>
              </motion.figure>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
