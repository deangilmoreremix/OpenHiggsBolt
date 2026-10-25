'use client';
import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, EffectCoverflow, Keyboard } from 'swiper/modules';
import type { Swiper as SwiperInstance } from 'swiper';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import { useReducedMotion } from 'motion/react';
import DemoMediaCard from './DemoMediaCard';
import { MINIMAX_H3_DEMOS } from '@/data/minimaxH3Demos';
import { type VideoDemo } from '@/data/types';

const DEFAULT_REEL_SLUGS = [
  'luxury-perfume-commercial',
  'luxury-skincare-storyboard-commercial',
  'yellow-sunglasses-in-a-black-studio',
  'strawberry-drink-transformation-commercial',
  'emerald-bio-serum-product-film',
  'black-and-gold-perfume-commercial',
];

type MadeWithSmartVideoProps = {
  /** Slugs to feature in the reel. Defaults to the existing 6 Commercial/Fashion demos. */
  slugs?: string[];
  /** Override: pass pre-filtered demos directly instead of using slugs. */
  demos?: VideoDemo[];
};

/**
 * Same reel and demos as before, now a Swiper 3D coverflow: the centred
 * commercial sits forward, its neighbours angle back and dim. Swipe, drag,
 * arrow keys and the existing arrow buttons all move it.
 */
export default function MadeWithSmartVideo({ slugs, demos }: MadeWithSmartVideoProps) {
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null);
  const reduced = useReducedMotion();
  const activeDemos =
    demos ??
    (slugs ?? DEFAULT_REEL_SLUGS)
      .map((s) => MINIMAX_H3_DEMOS.find((d) => d.slug === s))
      .filter(Boolean) as typeof MINIMAX_H3_DEMOS;

  const scrollBy = (dir: 1 | -1) => {
    if (dir === 1) swiper?.slideNext();
    else swiper?.slidePrev();
  };

  return (
    <section className="border-y border-white/10 bg-[#030303] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
              Made with SmartVideo GO AI
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
              From a single idea to a finished commercial.
            </h2>
          </div>
          {/* Reel controls (desktop) */}
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Scroll reel left"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-white/80 transition hover:bg-white/[0.08]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Scroll reel right"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-white/80 transition hover:bg-white/[0.08]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Cinematic coverflow reel. 1-up mobile, 2-up tablet, 3-up+ desktop. */}
        <Swiper
          className="fx-reel mt-10 !overflow-visible"
          modules={[EffectCoverflow, Keyboard, A11y]}
          onSwiper={setSwiper}
          effect={reduced ? 'slide' : 'coverflow'}
          coverflowEffect={{ rotate: 18, stretch: 0, depth: 160, modifier: 1, slideShadows: false }}
          slidesPerView="auto"
          centeredSlides
          initialSlide={Math.min(1, activeDemos.length - 1)}
          spaceBetween={20}
          grabCursor
          keyboard={{ enabled: true, onlyInViewport: true }}
          a11y={{ prevSlideMessage: 'Previous commercial', nextSlideMessage: 'Next commercial' }}
        >
          {activeDemos.map((demo, i) => (
            <SwiperSlide key={demo.slug} className="!w-[85vw] sm:!w-[45%] lg:!w-[31%]">
              <DemoMediaCard demo={demo} index={i} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
