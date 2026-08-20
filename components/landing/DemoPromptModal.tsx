'use client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { MINIMAX_H3_DEMOS, getCreateUrl, type MinimaxDemo } from '@/data/minimaxH3Demos';

type PromptContextValue = {
  openPrompt: (demo: MinimaxDemo, trigger?: HTMLElement | null) => void;
};

const PromptContext = createContext<PromptContextValue | null>(null);

export function useDemoPrompt(): PromptContextValue {
  const ctx = useContext(PromptContext);
  if (!ctx) {
    // Safe no-op fallback if used outside the provider.
    return { openPrompt: () => {} };
  }
  return ctx;
}

function getFocusable(node: HTMLElement): HTMLElement[] {
  return Array.from(
    node.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => el.offsetParent !== null || el === document.activeElement);
}

const STUDIO_LABELS: Record<string, string> = {
  marketing: 'Marketing Studio',
  cinema: 'Cinema Studio',
  'vfx-studio': 'VFX Studio',
  video: 'Video Studio',
  'ai-influencer': 'AI Influencer Studio',
};

export function DemoPromptProvider({ children }: { children: ReactNode }) {
  const [demo, setDemo] = useState<MinimaxDemo | null>(null);
  const [trigger, setTrigger] = useState<HTMLElement | null>(null);
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const openPrompt = useCallback((d: MinimaxDemo, trig?: HTMLElement | null) => {
    previouslyFocused.current = (trig as HTMLElement) || document.activeElement;
    setTrigger(trig || null);
    setCopied(false);
    setDemo(d);
  }, []);

  const close = useCallback(() => {
    setDemo(null);
    setTrigger(null);
    previouslyFocused.current?.focus?.();
  }, []);

  useEffect(() => {
    if (!demo) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the dialog (close button) on open.
    const t = window.setTimeout(() => {
      const node = dialogRef.current;
      if (!node) return;
      const focusables = getFocusable(node);
      (focusables[0] || node).focus();
    }, 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === 'Tab') {
        const node = dialogRef.current;
        if (!node) return;
        const focusables = getFocusable(node);
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
    };
  }, [demo, close]);

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

  return (
    <PromptContext.Provider value={{ openPrompt }}>
      {children}
      {demo && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6"
          aria-hidden={false}
        >
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-prompt-title"
            tabIndex={-1}
            className="landing-card relative z-10 max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-t-3xl sm:rounded-3xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
                  {demo.category}
                </p>
                <h2
                  id="demo-prompt-title"
                  className="mt-1 truncate text-xl font-black text-white sm:text-2xl"
                >
                  {demo.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close prompt viewer"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[60vh] overflow-y-auto px-6 py-5 custom-scrollbar">
              <p className="text-sm leading-6 text-white/65">{demo.useCase}</p>

              <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ['Model', 'SmartVideo GO AI'],
                  ['Duration', demo.durationLabel || '—'],
                  ['Aspect', demo.aspectRatio || '—'],
                  ['Studio', STUDIO_LABELS[demo.studioTab] || 'Video Studio'],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                    <dt className="text-[11px] uppercase tracking-wider text-white/40">{k}</dt>
                    <dd className="mt-0.5 truncate text-sm font-semibold text-white/90">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
                    Full generation prompt
                  </h3>
                </div>
                <pre className="whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-black/40 p-4 text-[13px] leading-6 text-white/80">
                  {demo.prompt}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-3 border-t border-white/10 p-6 sm:flex-row">
              <button
                type="button"
                onClick={copyPrompt}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]"
              >
                {copied ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                      <path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    Copy Prompt
                  </>
                )}
              </button>
              <a
                href={getCreateUrl(demo)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 px-5 py-3 text-sm font-bold text-black shadow-lg transition hover:scale-[1.01]"
              >
                Create This Style
              </a>
            </div>
          </div>
        </div>
      )}
    </PromptContext.Provider>
  );
}

// Re-export so sections can reference the manifest through one module if needed.
export { MINIMAX_H3_DEMOS };
