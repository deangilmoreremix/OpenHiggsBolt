'use client';
import { useMemo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { motion, useReducedMotion } from 'motion/react';

type Testimonial = { quote: string; name: string; role: string };

/**
 * Testimonials on an Embla autoplay loop (swipe/drag-able, pauses on hover).
 * The list is repeated so the loop never runs out of slides on wide screens;
 * the repeats are hidden from assistive tech.
 */
export default function TestimonialCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const reduced = useReducedMotion();
  const plugins = useMemo(
    () => (reduced ? [] : [Autoplay({ delay: 4200, stopOnInteraction: false, stopOnMouseEnter: true })]),
    [reduced],
  );
  const [viewportRef] = useEmblaCarousel({ loop: true, align: 'start' }, plugins);
  const slides = [...testimonials, ...testimonials];

  return (
    <div className="embla-viewport [mask-image:linear-gradient(90deg,transparent,black_4%,black_96%,transparent)]" ref={viewportRef}>
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
  );
}
