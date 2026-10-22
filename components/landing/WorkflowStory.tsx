'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'motion/react';
import { gsap, ScrollTrigger, DESKTOP_MOTION } from './fx/gsap';

const LottieIcon = dynamic(() => import('./fx/LottieIcon'), { ssr: false });

const STEPS = [
  ['1', 'Brief', 'Enter a product, script, or campaign goal.'],
  ['2', 'Generate', 'Use image, video, UGC, VFX, audio, or agent tools.'],
  ['3', 'Refine', 'Review outputs, adjust prompts, and rerun in seconds.'],
  ['4', 'Launch', 'Export assets, embed videos, and track campaign performance.'],
] as const;

/**
 * Workflow section, told as a scroll story.
 * - Desktop: GSAP ScrollTrigger pins the section while the four steps light
 *   up in turn and a progress rail fills.
 * - Phones: no pinning; each step lights up as it passes the middle of the screen.
 * - dotLottie: the active step's badge gets an animated ring.
 * - Motion: the active step slides forward and its copy brightens.
 */
export default function WorkflowStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false);
  const [near, setNear] = useState(false);

  // Only load the Lottie runtime once the section is close.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setNear(true);
        io.disconnect();
      }
    }, { rootMargin: '400px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const mm = gsap.matchMedia();

    mm.add(DESKTOP_MOTION, () => {
      setPinned(true);
      const st = ScrollTrigger.create({
        trigger: section,
        start: 'top top+=72',
        end: '+=1400',
        pin: true,
        onUpdate: (self) => {
          setActive(Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length)));
          if (railRef.current) gsap.set(railRef.current, { scaleY: self.progress });
        },
      });
      return () => {
        st.kill();
        setPinned(false);
      };
    });

    mm.add('(max-width: 1023px), (pointer: coarse)', () => {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
          });
        },
        { rootMargin: '-45% 0px -45% 0px' },
      );
      stepRefs.current.forEach((el) => el && io.observe(el));
      return () => io.disconnect();
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} id="workflow" className="mx-auto max-w-7xl px-6 py-24">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Workflow</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">From idea to shipped campaign in one loop.</h2>
          <p className="mt-5 text-lg leading-8 text-white/60">Plan the concept, generate the assets, refine the edit, publish the campaign, and learn from analytics without switching tools.</p>
          {pinned && (
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-white/35" aria-hidden="true">
              Step {active + 1} / {STEPS.length}
            </p>
          )}
        </div>
        <div className="landing-card relative rounded-3xl p-6">
          {/* Progress rail behind the badges */}
          <div aria-hidden="true" className="absolute bottom-11 left-[2.75rem] top-11 w-px bg-white/10">
            <div
              ref={railRef}
              className="h-full w-full origin-top bg-gradient-to-b from-cyan-400 to-purple-500"
              style={{ transform: pinned ? 'scaleY(0)' : undefined }}
            />
          </div>
          {STEPS.map(([step, title, copy], i) => {
            const isActive = i === active;
            const lit = !pinned || i <= active;
            return (
              <motion.div
                key={step}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                data-index={i}
                animate={{ x: isActive ? 8 : 0, opacity: lit ? 1 : 0.45 }}
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                className="relative flex gap-4 border-b border-white/10 py-5 last:border-0"
              >
                <span className="relative grid h-10 w-10 shrink-0 place-items-center">
                  {near && (
                    <LottieIcon
                      src="/lottie/pulse-ring.json"
                      playing={isActive}
                      className={`pointer-events-none absolute -inset-3 transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}
                    />
                  )}
                  <span className="relative grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 text-sm font-black text-black">
                    {step}
                  </span>
                </span>
                <div>
                  <h3 className="font-bold text-white">{title}</h3>
                  <p className={`mt-1 text-sm leading-6 transition-colors duration-500 ${isActive ? 'text-white/80' : 'text-white/55'}`}>{copy}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
