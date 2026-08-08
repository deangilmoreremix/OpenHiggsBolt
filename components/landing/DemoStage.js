'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';

/* ─── helpers ──────────────────────────────────────────────────────────── */
function createResult(feature, prompt, option) {
  return {
    title: `${feature.outputLabel} for ${feature.label}`,
    prompt,
    option,
    bullets: [
      `${feature.label} interpreted the prompt as a ${feature.eyebrow.toLowerCase()} request.`,
      `Selected mode: ${option}.`,
      `Estimated production runtime: ${feature.eta}.`,
      'The full studio will preserve this prompt, mode, and route when you open it.'
    ],
    meta: [['Route', feature.ctaPath], ['Mode', option], ['Runtime', feature.eta]]
  };
}

function Frame({ children }) {
  return <div className="demo-preview p-5">{children}</div>;
}

function Meta({ result }) {
  return (
    <div className="mt-5 grid gap-2 text-sm">
      {result.meta.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <span className="text-white/45">{k}</span>
          <span className="font-semibold text-white/80">{v}</span>
        </div>
      ))}
    </div>
  );
}

function Generic({ feature, result }) {
  return (
    <Frame>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <h5 className="text-lg font-black text-white">{result.title}</h5>
        <p className="mt-3 text-sm leading-6 text-white/55">"{result.prompt}"</p>
        <ul className="mt-4 space-y-2 text-sm text-white/65">
          {result.bullets.map((b) => (
            <li key={b} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />{b}</li>
          ))}
        </ul>
      </div>
      <Meta result={result} />
    </Frame>
  );
}

/* ─── renderers ────────────────────────────────────────────────────────── */
function ImageOutput({ feature, result }) {
  return (
    <Frame>
      <div className="aspect-video rounded-2xl bg-gradient-to-br from-cyan-400/20 via-purple-500/20 to-black mb-4" />
      <Generic feature={feature} result={result} />
    </Frame>
  );
}

function VideoOutput({ feature, result }) {
  return (
    <Frame>
      <div className="aspect-video rounded-2xl bg-black/60 border border-white/10 mb-4 grid place-items-center">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-white/10" />
          <p className="mt-4 text-sm text-white/60">Video preview timeline</p>
        </div>
      </div>
      <Generic feature={feature} result={result} />
    </Frame>
  );
}

function AudioOutput({ feature, result }) {
  return (
    <Frame>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 mb-4">
        <div className="flex h-28 items-end justify-center gap-1">
          {Array.from({ length: 32 }).map((_, i) => (
            <span key={i} className="w-1.5 rounded-full bg-gradient-to-t from-cyan-300 to-purple-400" style={{ height: `${20 + ((i * 17) % 72)}px` }} />
          ))}
        </div>
      </div>
      <Generic feature={feature} result={result} />
    </Frame>
  );
}

function ClipOutput({ feature, result }) {
  return (
    <Frame>
      <div className="space-y-3 mb-4">
        {['Hook: first 3 seconds', 'Best moment', 'CTA ending'].map((item) => (
          <div key={item} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-sm font-bold text-white">{item}</div>
            <div className="mt-1 text-xs text-white/45">Auto-generated clip marker</div>
          </div>
        ))}
      </div>
      <Generic feature={feature} result={result} />
    </Frame>
  );
}

function MotionOutput({ feature, result }) {
  return (
    <Frame>
      <div className="aspect-video rounded-2xl mb-4" style={{background:'radial-gradient(circle at 30% 30%,rgba(34,211,238,0.2),transparent 25%),radial-gradient(circle at 70% 70%,rgba(168,85,247,0.2),transparent 25%),#050505'}} />
      <Generic feature={feature} result={result} />
    </Frame>
  );
}

function LipsyncOutput({ feature, result }) {
  return (
    <Frame>
      <div className="grid gap-4 md:grid-cols-2 mb-4">
        <div className="aspect-square rounded-2xl bg-gradient-to-br from-cyan-400/20 to-purple-500/20" />
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-white/65">
          Voice waveform, face landmarks, and lip-sync timing are prepared for the full studio.
        </div>
      </div>
      <Generic feature={feature} result={result} />
    </Frame>
  );
}

function CinemaOutput({ feature, result }) {
  return (
    <Frame>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 mb-4">
        <div className="text-5xl font-black text-white/10">35mm</div>
        <div className="mt-3 text-sm text-white/60">Camera, lens, aperture, and scene tone preview</div>
      </div>
      <Generic feature={feature} result={result} />
    </Frame>
  );
}

function MarketingOutput({ feature, result }) {
  const labels = ['Hook', 'Body', 'CTA'];
  const copy = ['Stop scrolling.', 'Show the transformation.', 'Start today.'];
  return (
    <Frame>
      <div className="space-y-3 mb-4">
        {labels.map((label, i) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-xs uppercase tracking-wider text-cyan-200">{label}</div>
            <div className="mt-1 text-sm text-white/70">{copy[i]}</div>
          </div>
        ))}
      </div>
      <Generic feature={feature} result={result} />
    </Frame>
  );
}

function WorkflowOutput({ feature, result }) {
  return (
    <Frame>
      <div className="space-y-3 mb-4">
        {['Brief node', 'Generate node', 'Review node', 'Export node'].map((node, i) => (
          <div key={node} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-cyan-300 text-xs font-black text-black">{i + 1}</span>
            <div className="text-sm font-bold text-white">{node}</div>
          </div>
        ))}
      </div>
      <Meta result={result} />
    </Frame>
  );
}

function AgentOutput({ feature, result }) {
  const turns = [
    ['Agent', 'I can help turn this into a launch plan.'],
    ['User', result.prompt],
    ['Agent', 'Here is the first action: create the brief, select the format, and generate the first asset.']
  ];
  return (
    <Frame>
      <div className="space-y-3">
        {turns.map(([who, copy], i) => (
          <div key={i} className={`rounded-2xl p-4 text-sm leading-6 ${who === 'Agent' ? 'bg-white/[0.06] text-white/70' : 'bg-cyan-300/10 text-cyan-50'}`}>
            <span className="mr-2 font-bold">{who}:</span>{copy}
          </div>
        ))}
      </div>
    </Frame>
  );
}

function DesignOutput({ feature, result }) {
  return (
    <Frame>
      <div className="grid gap-3 md:grid-cols-2 mb-4">
        {['Hero layout', 'Demo grid', 'Pricing section', 'CTA footer'].map((item) => (
          <div key={item} className="aspect-video rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-sm font-bold text-white">{item}</div>
            <div className="mt-3 h-2 rounded-full bg-gradient-to-r from-cyan-300 to-purple-400" />
          </div>
        ))}
      </div>
      <Generic feature={feature} result={result} />
    </Frame>
  );
}

function VfxOutput({ feature, result }) {
  return (
    <Frame>
      <div className="aspect-video rounded-2xl p-5 mb-4 grid place-items-center" style={{background:'radial-gradient(circle at 50% 45%,rgba(168,85,247,0.35),transparent 25%),linear-gradient(135deg,rgba(34,211,238,0.18),#050505)'}}>
        <div className="rounded-xl border border-white/10 bg-black/40 p-6 text-center">
          <p className="text-sm font-bold text-white">AI effect preview</p>
          <p className="mt-2 text-xs text-white/50">{result.option} applied to source media</p>
        </div>
      </div>
      <Generic feature={feature} result={result} />
    </Frame>
  );
}

function StoryboardOutput({ feature, result }) {
  return (
    <Frame>
      <div className="grid gap-3 md:grid-cols-2 mb-4">
        {['Opening', 'Problem', 'Transformation', 'CTA'].map((scene, i) => (
          <div key={scene} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="aspect-video rounded-xl bg-gradient-to-br from-cyan-400/15 to-purple-500/15 mb-2" />
            <div className="text-sm font-bold text-white">Scene {i + 1}: {scene}</div>
          </div>
        ))}
      </div>
      <Generic feature={feature} result={result} />
    </Frame>
  );
}

function ThumbnailOutput({ feature, result }) {
  return (
    <Frame>
      <div className="aspect-video rounded-2xl p-6 mb-4" style={{background:'linear-gradient(135deg,rgba(34,211,238,0.25),rgba(168,85,247,0.18)),#050505'}}>
        <div className="flex h-full flex-col justify-between rounded-xl border border-white/10 bg-black/45 p-5">
          <span className="w-2/3 rounded-full bg-white px-4 py-2 text-center text-sm font-black text-black">AI VIDEO TOOL</span>
          <span className="text-3xl font-black leading-none text-white">Save hours launching campaigns</span>
        </div>
      </div>
      <Generic feature={feature} result={result} />
    </Frame>
  );
}

function RecastOutput({ feature, result }) {
  return (
    <Frame>
      <div className="grid gap-3 md:grid-cols-2 mb-4">
        {[['Source clip','Uploaded'],['Character image','Uploaded'],['Swapped video','Rendered']].map(([label, status]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center">
            <div className="aspect-video rounded-xl bg-gradient-to-br from-cyan-400/20 to-purple-500/20 mb-3" />
            <div className="text-sm font-bold text-white">{label}</div>
            <div className="mt-1 text-xs text-cyan-200">{status}</div>
          </div>
        ))}
      </div>
      <Generic feature={feature} result={result} />
    </Frame>
  );
}

function UgcOutput({ feature, result }) {
  return (
    <Frame>
      <div className="grid gap-3 md:grid-cols-3 mb-4">
        {[['Actor image','Generated'],['Voiceover','Generated'],['Lip-sync video','Ready']].map(([label, status]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center">
            <div className="aspect-video rounded-xl bg-gradient-to-br from-cyan-400/20 to-purple-500/20 mb-3" />
            <div className="text-sm font-bold text-white">{label}</div>
            <div className="mt-1 text-xs text-cyan-200">{status}</div>
          </div>
        ))}
      </div>
      <Generic feature={feature} result={result} />
    </Frame>
  );
}

function AppsOutput({ feature, result }) {
  return (
    <Frame>
      <div className="grid gap-3 md:grid-cols-2 mb-4">
        {['Image Studio', 'Video Studio', 'UGC Generator', 'VFX Studio'].map((item) => (
          <div key={item} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-sm font-bold text-white">{item}</div>
            <div className="mt-1 text-xs text-white/45">Recommended for your brief</div>
          </div>
        ))}
      </div>
      <Generic feature={feature} result={result} />
    </Frame>
  );
}

/* ─── renderer map ─────────────────────────────────────────────────────── */
const RENDERERS = {
  image: ImageOutput, video: VideoOutput, audio: AudioOutput,
  clip: ClipOutput, motion: MotionOutput, lipsync: LipsyncOutput,
  cinema: CinemaOutput, marketing: MarketingOutput, workflow: WorkflowOutput,
  agent: AgentOutput, design: DesignOutput,
  vfx: VfxOutput, storyboard: StoryboardOutput,
  thumbnail: ThumbnailOutput, ugc: UgcOutput, recast: RecastOutput, apps: AppsOutput,
};

/* ─── DemoStage ────────────────────────────────────────────────────────── */
export default function DemoStage({ feature }) {
  const [prompt, setPrompt] = useState(feature.defaultPrompt);
  const [option, setOption] = useState(feature.options?.[0] || 'Default');
  const [result, setResult] = useState(null);
  const [generating, setGenerating] = useState(false);

  const safePrompt = prompt.trim() || feature.defaultPrompt;
  const preview = useMemo(() => createResult(feature, safePrompt, option), [feature, safePrompt, option]);

  const run = () => {
    setResult(null);
    setGenerating(true);
    window.setTimeout(() => { setResult(preview); setGenerating(false); }, 700);
  };

  const Renderer = RENDERERS[feature.outputMode] || Generic;

  return (
    <div className="demo-stage p-4 md:p-6">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">

        {/* ── controls ── */}
        <div className="space-y-5">
          <div>
            <h3 className="text-2xl font-black text-white">{feature.title}</h3>
            <p className="mt-3 text-sm leading-6 text-white/55">{feature.description}</p>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/75">{feature.promptLabel}</span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="h-32 w-full resize-none rounded-2xl border border-white/10 bg-black/40 p-4 text-sm leading-6 text-white outline-none transition focus:border-cyan-300/70 focus:ring-4 focus:ring-cyan-300/10"
            />
          </label>

          <div>
            <span className="mb-3 block text-sm font-semibold text-white/75">Demo mode</span>
            <div className="flex flex-wrap gap-2">
              {feature.options.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setOption(item)}
                  className={`rounded-full border px-3 py-2 text-xs font-bold transition ${option === item ? 'border-cyan-300 bg-cyan-300/15 text-cyan-100' : 'border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.08]'}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={run}
            disabled={generating}
            className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 px-5 py-3 text-sm font-black text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? 'Generating preview...' : 'Generate local preview'}
          </button>

          <Link
            href={feature.ctaPath}
            className="block rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-center text-sm font-bold text-white/75 transition hover:bg-white/[0.08] hover:text-white"
          >
            Open full {feature.label}
          </Link>
        </div>

        {/* ── output ── */}
        <div>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">{feature.outputLabel}</p>
              <h4 className="text-lg font-black text-white">
                {generating ? 'Working...' : result ? 'Preview ready' : 'Ready to preview'}
              </h4>
            </div>
            <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/50">{feature.eta}</span>
          </div>

          {generating ? (
            <div className="demo-preview p-6">
              <div className="mx-auto mt-16 h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-cyan-300" />
              <p className="mt-6 text-center text-sm text-white/45">Creating a deterministic local preview...</p>
            </div>
          ) : result ? (
            <Renderer feature={feature} result={result} />
          ) : (
            <Generic feature={feature} result={preview} />
          )}
        </div>
      </div>
    </div>
  );
}
