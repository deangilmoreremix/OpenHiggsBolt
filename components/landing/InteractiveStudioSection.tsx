'use client';
import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import LazyVideo from './LazyVideo';
import Reveal from './Reveal';
import TiltCard from './fx/TiltCard';
import { gsap, MOTION_OK } from './fx/gsap';
import { INTERACTIVE_DEMO } from '@/data/minimaxH3Demos';

// Interaction verbs the platform exposes, presented as product-UI chips that
// appear to drive the looping video. (We do NOT literally bind the video to the
// page — these are synchronized visual labels.)
const INTERACTIONS = [
  { label: 'Loading', hint: 'Streaming the first frame' },
  { label: 'Hover', hint: 'Preview a variant' },
  { label: 'Click', hint: 'Open the studio' },
  { label: 'Scroll', hint: 'Step through the timeline' },
  { label: 'Drag', hint: 'Reposition keyframes' },
  { label: 'Carousel', hint: 'Swap camera angles' },
];

const WORKFLOW = [
  { label: 'Generate', hint: 'Prompt to a finished clip' },
  { label: 'Animate', hint: 'Add motion to stills' },
  { label: 'Edit', hint: 'Trim, mask, restyle' },
  { label: 'Upscale', hint: '4K without the wait' },
  { label: 'Publish', hint: 'Ship to every channel' },
];

function IconDot() {
  return (
    <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 text-[10px] font-black text-black">
      ✓
    </span>
  );
}

/**
 * Enhancements (content unchanged):
 * - GSAP timeline: a virtual cursor glides between the interaction chips and
 *   "presses" each one in turn, so the frame reads like a live product demo.
 *   It only runs while the section is on screen.
 * - GSAP ScrollTrigger: the media frame scales up with a little parallax.
 * - Motion: the frame tilts toward the cursor; workflow cards lift on hover.
 */
export default function InteractiveStudioSection() {
  const demo = INTERACTIVE_DEMO;
  const frameRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const cursor = cursorRef.current;
    if (!frame || !cursor) return;
    const mm = gsap.matchMedia();

    mm.add(MOTION_OK, () => {
      const chips = Array.from(frame.querySelectorAll<HTMLElement>('[data-chip]'));
      // Layout offsets (not bounding rects) so the frame's own scale/tilt
      // transforms don't skew where the cursor lands.
      const centre = (el: HTMLElement) => {
        let x = el.offsetWidth / 2;
        let y = el.offsetHeight / 2;
        for (let n: HTMLElement | null = el; n && n !== frame; n = n.offsetParent as HTMLElement | null) {
          x += n.offsetLeft;
          y += n.offsetTop;
        }
        return { x, y };
      };

      const tl = gsap.timeline({ repeat: -1, paused: true, defaults: { ease: 'power3.inOut' } });
      gsap.set(cursor, { x: frame.clientWidth / 2, y: frame.clientHeight / 2, opacity: 0 });
      tl.to(cursor, { opacity: 1, duration: 0.3 });
      [...chips, frame.querySelector<HTMLElement>('[data-generate]')].forEach((chip) => {
        if (!chip) return;
        tl.to(cursor, { x: () => centre(chip).x, y: () => centre(chip).y, duration: 0.9 })
          .to(cursor, { scale: 0.8, duration: 0.12, yoyo: true, repeat: 1 })
          .to(
            chip,
            {
              scale: 1.12,
              boxShadow: '0 0 0 1px rgba(34,211,238,0.7), 0 0 24px rgba(34,211,238,0.45)',
              duration: 0.25,
              yoyo: true,
              repeat: 1,
              repeatDelay: 0.35,
            },
            '<',
          );
      });
      tl.to(cursor, { opacity: 0, duration: 0.4 }, '+=0.3');

      const play = gsap.to({}, {
        scrollTrigger: {
          trigger: frame,
          start: 'top 80%',
          end: 'bottom 20%',
          onToggle: (self) => (self.isActive ? tl.play() : tl.pause()),
          invalidateOnRefresh: true,
          onRefresh: () => tl.invalidate(),
        },
      });

      gsap.fromTo(
        frame,
        { scale: 0.92, y: 40 },
        { scale: 1, y: 0, ease: 'none', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'center center', scrub: 0.6 } },
      );

      return () => {
        tl.kill();
        play.kill();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <section className="relative border-y border-white/10 bg-[#030303] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            One platform
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
            One Creative Platform.
            <br />
            <span className="landing-gradient-text">Every AI Workflow.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/60">
            Every interaction you expect from a modern creative tool — loading, hover, click,
            scroll, drag, carousel, generate, edit, and publish — wired into a single studio.
          </p>
        </div>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          {/* Media frame with synchronized product-UI chips */}
          <Reveal className="relative">
            <TiltCard max={5}>
            <div ref={frameRef} className="demo-stage relative overflow-hidden p-3">
              <LazyVideo
                src={demo?.videoSrc ?? '/media/minimax-h3/videos/ice-gunslinger-interactive-web-loop.webm'}
                poster={demo?.posterSrc ?? '/media/minimax-h3/previews/ice-gunslinger-interactive-web-loop.svg'}
                label="Ice Gunslinger interactive web loop"
                hoverPlay
                toggleOnClick
                className="aspect-video w-full rounded-2xl"
                videoClassName="rounded-2xl"
              />

              {/* Floating interaction chips around the media */}
              <div className="pointer-events-none absolute left-5 top-5 flex flex-wrap gap-2">
                {INTERACTIONS.slice(0, 3).map((it) => (
                  <span
                    key={it.label}
                    data-chip
                    className="glass-panel rounded-full px-3 py-1.5 text-xs font-semibold text-white/90"
                  >
                    {it.label}
                  </span>
                ))}
              </div>
              <div className="pointer-events-none absolute right-5 top-5 flex flex-wrap justify-end gap-2">
                {INTERACTIONS.slice(3).map((it) => (
                  <span
                    key={it.label}
                    data-chip
                    className="glass-panel rounded-full px-3 py-1.5 text-xs font-semibold text-white/90"
                  >
                    {it.label}
                  </span>
                ))}
              </div>

              {/* Faux product bar */}
              <div className="pointer-events-none absolute inset-x-5 bottom-5 flex items-center justify-between rounded-2xl border border-white/10 bg-black/55 px-4 py-3 backdrop-blur">
                <span className="text-xs text-white/60">ice-gunslinger · web loop</span>
                <span data-generate className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 px-3 py-1.5 text-xs font-bold text-black">
                  Generate ▸
                </span>
              </div>

              {/* Virtual cursor driven by the GSAP timeline */}
              <span
                ref={cursorRef}
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-0 z-10 -ml-1 -mt-1 opacity-0 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M4 3l7.5 18 2.4-7.1L21 11.5 4 3z" fill="white" stroke="black" strokeWidth="1.2" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
            </TiltCard>
          </Reveal>

          {/* Workflow capability list */}
          <div className="grid gap-3 sm:grid-cols-2">
            {WORKFLOW.map((w, i) => (
              <Reveal key={w.label} delay={i * 80}>
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="glass-panel flex h-full items-start gap-3 rounded-2xl p-4 transition-colors hover:border-cyan-400/30"
                >
                  <IconDot />
                  <div>
                    <div className="font-bold text-white">{w.label}</div>
                    <div className="mt-0.5 text-sm text-white/55">{w.hint}</div>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
