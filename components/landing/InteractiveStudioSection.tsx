'use client';
import LazyVideo from './LazyVideo';
import Reveal from './Reveal';
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

export default function InteractiveStudioSection() {
  const demo = INTERACTIVE_DEMO;

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
            <div className="demo-stage relative overflow-hidden p-3">
              <LazyVideo
                src={demo?.videoSrc ?? '/media/minimax-h3/videos/ice-gunslinger-interactive-web-loop.webm'}
                poster={demo?.posterSrc ?? '/media/minimax-h3/previews/ice-gunslinger-interactive-web-loop.svg'}
                label="Ice Gunslinger interactive web loop"
                hoverPlay
                toggleOnClick
                preload="metadata"
                className="aspect-video w-full rounded-2xl"
                videoClassName="rounded-2xl"
              />

              {/* Floating interaction chips around the media */}
              <div className="pointer-events-none absolute left-5 top-5 flex flex-wrap gap-2">
                {INTERACTIONS.slice(0, 3).map((it) => (
                  <span
                    key={it.label}
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
                    className="glass-panel rounded-full px-3 py-1.5 text-xs font-semibold text-white/90"
                  >
                    {it.label}
                  </span>
                ))}
              </div>

              {/* Faux product bar */}
              <div className="pointer-events-none absolute inset-x-5 bottom-5 flex items-center justify-between rounded-2xl border border-white/10 bg-black/55 px-4 py-3 backdrop-blur">
                <span className="text-xs text-white/60">ice-gunslinger · web loop</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 px-3 py-1.5 text-xs font-bold text-black">
                  Generate ▸
                </span>
              </div>
            </div>
          </Reveal>

          {/* Workflow capability list */}
          <div className="grid gap-3 sm:grid-cols-2">
            {WORKFLOW.map((w, i) => (
              <Reveal
                key={w.label}
                delay={i * 80}
                className="glass-panel flex items-start gap-3 rounded-2xl p-4"
              >
                <IconDot />
                <div>
                  <div className="font-bold text-white">{w.label}</div>
                  <div className="mt-0.5 text-sm text-white/55">{w.hint}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
