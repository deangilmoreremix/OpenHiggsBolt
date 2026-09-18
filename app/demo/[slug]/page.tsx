'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { findDemoBySlug } from '@/data/demoLookup';
import type { VideoDemo } from '@/data/types';
import { VideoCreateTargetPicker } from '@/components/landing/VideoCreateTargetPicker';
import { DemoPersonalizeProvider, useDemoPersonalize } from '@/shared/personalization';
import LazyVideo from '@/components/landing/LazyVideo';
import { MINIMAX_H3_DEMOS } from '@/data/minimaxH3Demos';
import { SEEDANCE_25_DEMOS } from '@/data/seedance25Demos';
import { SEEDANCE_1_DEMOS } from '@/data/seedance1Demos';
import { PROMPTFEED_DEMOS } from '@/data/promptFeedDemos';

const ALL_DEMOS: VideoDemo[] = [
  ...MINIMAX_H3_DEMOS,
  ...SEEDANCE_25_DEMOS,
  ...SEEDANCE_1_DEMOS,
  ...PROMPTFEED_DEMOS,
];

function DemoDetailPageInner() {
  const params = useParams();
  const router = useRouter();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const demo = slug ? findDemoBySlug(slug) : null;

  const [showCreatePicker, setShowCreatePicker] = useState(false);
  const [copied, setCopied] = useState(false);
  const [related, setRelated] = useState<VideoDemo[]>([]);
  const createStyleButtonRef = useRef<HTMLElement | null>(null);

  const { openPersonalize } = useDemoPersonalize();

  useEffect(() => {
    if (!demo) return;
    const sameCategory = ALL_DEMOS.filter(
      (d) => d.category === demo.category && d.slug !== demo.slug,
    );
    const sameSource = ALL_DEMOS.filter(
      (d) => d.sourceRepo === demo.sourceRepo && d.slug !== demo.slug,
    );
    const combined = [...sameCategory, ...sameSource];
    const unique = Array.from(new Map(combined.map((d) => [`${d.sourceRepo}|${d.slug}`, d])).values());
    setRelated(unique.slice(0, 6));
  }, [demo]);

  const handleCreateStyle = useCallback(() => {
    setShowCreatePicker(true);
  }, []);

  const closeCreatePicker = useCallback(() => {
    setShowCreatePicker(false);
  }, []);

  const handlePersonalize = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!demo) return;
    openPersonalize({ source: demo, trigger: event.currentTarget });
  }, [demo, openPersonalize]);

  const copyPrompt = useCallback(async () => {
    if (!demo) return;
    try {
      await navigator.clipboard.writeText(demo.prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }, [demo]);

  useEffect(() => {
    if (!demo) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [demo]);

  if (!demo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-black text-white">Demo not found</h1>
          <p className="mt-2 text-sm text-white/60">
            The requested demo could not be resolved from slug <code className="text-white/80">{slug || '—'}</code>.
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 px-5 py-3 text-sm font-bold text-black shadow-lg transition hover:scale-[1.01]"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <a
        href="#demo-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white/90 focus:px-4 focus:py-2 focus:text-sm focus:text-black"
      >
        Skip to content
      </a>
      <main id="demo-main" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition hover:text-white"
          >
            ← Back to all demos
          </button>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
              <div className="aspect-video w-full">
                <LazyVideo
                  src={demo.videoSrc}
                  poster={demo.posterSrc}
                  className="h-full w-full object-cover"
                  aria-label={`${demo.title} preview`}
                />
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="glass-panel rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90">
                    {demo.category}
                  </span>
                  {(demo.tags || []).slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-white/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h1 className="mt-4 text-2xl font-black text-white sm:text-3xl">{demo.title}</h1>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/65">{demo.useCase}</p>

                <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ['Model', demo.modelName || demo.model || 'SmartVideo GO AI'],
                    ['Duration', demo.durationLabel || '—'],
                    ['Aspect', demo.aspectRatio || '—'],
                    ['Source', demo.sourceRepo],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                      <dt className="text-[11px] uppercase tracking-wider text-white/40">{k}</dt>
                      <dd className="mt-0.5 truncate text-sm font-semibold text-white/90">{v}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-5">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
                    Full generation prompt
                  </h3>
                  <pre className="mt-2 whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-black/40 p-4 text-[13px] leading-6 text-white/80">
                    {demo.prompt}
                  </pre>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={copyPrompt}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]"
                  >
                    {copied ? 'Copied' : 'Copy Prompt'}
                  </button>
                  <button
                    ref={createStyleButtonRef as any}
                    type="button"
                    onClick={handleCreateStyle}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 px-5 py-3 text-sm font-bold text-black shadow-glow transition hover:scale-[1.01]"
                  >
                    Create This Style
                  </button>
                  <button
                    type="button"
                    onClick={handlePersonalize}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]"
                  >
                    Personalize This Demo
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-white/50">Related demos</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {related.map((item) => (
                  <button
                    key={`${item.sourceRepo}|${item.slug}`}
                    type="button"
                    onClick={() => router.push(`/demo/${item.slug}`)}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-white/20 hover:bg-white/[0.06]"
                    aria-label={`View related demo: ${item.title}`}
                  >
                    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black/40">
                      {item.posterSrc ? (
                        <img src={item.posterSrc} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-white/40">No preview</div>
                      )}
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-white/85">{item.title}</p>
                    <p className="mt-1 text-[11px] text-white/50">{item.aspectRatio || 'Demo'}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {showCreatePicker && demo && (
        <VideoCreateTargetPicker
          demo={demo}
          triggerElement={createStyleButtonRef.current}
          onClose={closeCreatePicker}
        />
      )}
    </div>
  );
}

export default function DemoDetailPage() {
  return (
    <DemoPersonalizeProvider>
      <DemoDetailPageInner />
    </DemoPersonalizeProvider>
  );
}
