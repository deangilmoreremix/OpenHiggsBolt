'use client';
import DemoCarousel from './DemoCarousel';
import { SEEDANCE_1_DEMOS } from '@/data/seedance1Demos';

/**
 * Same reel and demos, on the shared DemoCarousel: drag/swipe with momentum,
 * snapping, arrow buttons that dim at either end, a progress bar, and
 * "View all" for the full grid.
 */
export default function Seedance1Reel() {
  return (
    <section className="border-y border-white/10 bg-[#030303] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Seedance 2.0
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
            From a single idea to a finished commercial.
          </h2>
        </div>
        <div className="mt-10">
          <DemoCarousel demos={SEEDANCE_1_DEMOS} label="Seedance reel demos" />
        </div>
      </div>
    </section>
  );
}
