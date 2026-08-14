'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import {
  Sparkles,
  X,
  Loader2,
  AlertCircle,
  Check,
  Wand2,
  Image as ImageIcon,
  Type,
} from 'lucide-react';
import { enhanceImage } from '@/lib/muapi';
import { callOpenAIChat } from '@/shared/api/openai';
import type { AiAssistantModalProps, AiAssistantResult } from './AiAssistantProvider';

/* ------------------------------------------------------------------ *
 * Tool definitions
 * ------------------------------------------------------------------ */

const IMAGE_TOOLS = [
  { id: 'upscale', label: 'Upscale' },
  { id: 'style-transfer', label: 'Style transfer' },
  { id: 'background-remove', label: 'Background remove' },
  { id: 'restore', label: 'Restore' },
] as const;

const TEXT_TOOLS = [
  { id: 'rewrite', label: 'Rewrite' },
  { id: 'tone', label: 'Tone' },
  { id: 'expand', label: 'Expand' },
  { id: 'summarize', label: 'Summarize' },
  { id: 'translate', label: 'Translate' },
] as const;

const TONES = ['professional', 'casual', 'friendly', 'confident', 'playful', 'formal'];
const STYLES = ['anime', '3d', 'sketch', 'watercolor'];
const LANGUAGES = ['Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi'];

/* ------------------------------------------------------------------ *
 * Image tool → endpoint + payload mapping
 * (endpoints verified against packages/studio/src/models.js)
 * ------------------------------------------------------------------ */

function buildImagePayload(tool: string, imageUrl: string, opts: { style?: string; strength?: number; scale?: number }) {
  switch (tool) {
    case 'upscale':
      return {
        endpoint: 'ai-image-upscale',
        payload: { image_url: imageUrl, scale: opts.scale ?? 2 },
      };
    case 'style-transfer':
      return {
        endpoint: 'bytedance-seededit-image',
        payload: {
          image_url: imageUrl,
          style: opts.style ?? 'anime',
          strength: opts.strength ?? 0.6,
          prompt: `Transform the image into a ${opts.style ?? 'anime'} style.`,
        },
      };
    case 'background-remove':
      return {
        endpoint: 'ai-background-remover',
        payload: { image_url: imageUrl },
      };
    case 'restore':
      return {
        endpoint: 'ai-skin-enhancer',
        payload: { image_url: imageUrl },
      };
    default:
      return { endpoint: 'ai-image-upscale', payload: { image_url: imageUrl } };
  }
}

/* ------------------------------------------------------------------ *
 * Text system prompts + defensive JSON parse
 * ------------------------------------------------------------------ */

function systemPrompt(tool: string, opts: { tone?: string; targetLang?: string }): string {
  const base = 'Return ONLY a JSON array of 1 to 3 variant strings, no markdown, no commentary.';
  switch (tool) {
    case 'rewrite':
      return `Rewrite the following text preserving its original meaning. ${base}`;
    case 'tone':
      return `Rewrite the following text in a ${opts.tone ?? 'professional'} tone, preserving meaning. ${base}`;
    case 'expand':
      return `Expand the following text with more detail and depth while keeping the same topic and intent. ${base}`;
    case 'summarize':
      return `Summarize the following text concisely while preserving the key points. ${base}`;
    case 'translate':
      return `Translate the following text into ${opts.targetLang ?? 'Spanish'}. ${base}`;
    default:
      return base;
  }
}

function parseVariants(raw: string): string[] {
  if (!raw) return [];
  const text = raw.trim();
  // Try direct JSON.
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      const strs = parsed.filter((v) => typeof v === 'string').map((v) => String(v).trim()).filter(Boolean);
      if (strs.length) return strs;
    }
    if (typeof parsed === 'string' && parsed.trim()) return [parsed.trim()];
  } catch {
    /* not JSON — fall through */
  }
  // Strip code fences if present.
  const fenced = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  if (fenced !== text) {
    try {
      const parsed = JSON.parse(fenced);
      if (Array.isArray(parsed)) {
        const strs = parsed.filter((v) => typeof v === 'string').map((v) => String(v).trim()).filter(Boolean);
        if (strs.length) return strs;
      }
    } catch {
      /* ignore */
    }
  }
  // Fall back to line-splitting (one variant per non-empty line).
  const lines = text
    .split(/\n+/)
    .map((l) => l.replace(/^[\d\s\-\*\.\)]+/, '').trim())
    .filter(Boolean);
  return lines.length ? lines : [text];
}

/* ------------------------------------------------------------------ *
 * Focus-trap helpers
 * ------------------------------------------------------------------ */

function getFocusable(node: HTMLElement): HTMLElement[] {
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];
  return Array.from(node.querySelectorAll<HTMLElement>(selectors.join(','))).filter(
    (el) => el.offsetParent !== null && !el.hasAttribute('disabled')
  );
}

/* ------------------------------------------------------------------ *
 * Job state (useReducer)
 * ------------------------------------------------------------------ */

type JobStatus = 'idle' | 'submitting' | 'processing' | 'completed' | 'failed';

type JobState = {
  status: JobStatus;
  pollStatus: string;
  result: any; // string (image url) | string[] (text variants)
  error: string | null;
  selectedVariant: string | null;
};

type JobAction =
  | { type: 'RESET' }
  | { type: 'SUBMITTING' }
  | { type: 'PROCESSING'; pollStatus: string }
  | { type: 'COMPLETED'; result: any }
  | { type: 'FAILED'; error: string }
  | { type: 'SELECT_VARIANT'; variant: string };

function jobReducer(state: JobState, action: JobAction): JobState {
  switch (action.type) {
    case 'RESET':
      return { status: 'idle', pollStatus: '', result: null, error: null, selectedVariant: null };
    case 'SUBMITTING':
      return { ...state, status: 'submitting', error: null, pollStatus: 'Starting…' };
    case 'PROCESSING':
      return { ...state, status: 'processing', pollStatus: action.pollStatus };
    case 'COMPLETED':
      return {
        ...state,
        status: 'completed',
        pollStatus: '',
        result: action.result,
        selectedVariant: Array.isArray(action.result) ? action.result[0] ?? null : null,
      };
    case 'FAILED':
      return { ...state, status: 'failed', pollStatus: '', error: action.error };
    case 'SELECT_VARIANT':
      return { ...state, selectedVariant: action.variant };
    default:
      return state;
  }
}

/* ------------------------------------------------------------------ *
 * Small UI helpers
 * ------------------------------------------------------------------ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 p-4 rounded-xl border border-[var(--border-color)] bg-white/[0.02]">
      <h3 className="text-[11px] font-bold uppercase tracking-wide text-white/70 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-semibold text-white/70 mb-1">
      {children}
    </label>
  );
}

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-card)]';

/* ------------------------------------------------------------------ */

export default function AiAssistantModal(props: AiAssistantModalProps) {
  const {
    open,
    mode,
    allowToggle,
    input,
    inputKind,
    defaultValue,
    apiKey,
    openaiKey,
    onClose,
    onApply,
  } = props;

  const [modeState, setModeState] = useState<'image' | 'text'>(mode);
  const [tool, setTool] = useState<string>(mode === 'image' ? 'upscale' : 'rewrite');
  const [textValue, setTextValue] = useState<string>('');
  const [tone, setTone] = useState<string>('professional');
  const [styleSel, setStyleSel] = useState<string>('anime');
  const [strength, setStrength] = useState<number>(0.6);
  const [scale, setScale] = useState<number>(2);
  const [targetLang, setTargetLang] = useState<string>('Spanish');
  const [abView, setAbView] = useState<'before' | 'after'>('after');

  const [job, dispatch] = useReducer(jobReducer, {
    status: 'idle',
    pollStatus: '',
    result: null,
    error: null,
    selectedVariant: null,
  });

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const isProcessing = job.status === 'processing' || job.status === 'submitting';

  /* Reset transient state whenever the modal (re)opens. */
  useEffect(() => {
    if (!open) return;
    const startMode = mode;
    setModeState(startMode);
    setTool(startMode === 'image' ? 'upscale' : 'rewrite');
    setTone('professional');
    setStyleSel('anime');
    setStrength(0.6);
    setScale(2);
    setTargetLang('Spanish');
    setAbView('after');
    setTextValue(inputKind === 'text' && input ? input : defaultValue || '');
    dispatch({ type: 'RESET' });

    // Make the BYOK OpenAI key (passed via props) available to callOpenAIChat.
    if (openaiKey && typeof window !== 'undefined') {
      (window as unknown as { __OPENAI_KEY__?: string }).__OPENAI_KEY__ = openaiKey;
    }

    previouslyFocused.current = (document.activeElement as HTMLElement) || null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the first focusable element (close button) on open.
    const node = dialogRef.current;
    const focusables = node ? getFocusable(node) : [];
    (focusables[0] || node)?.focus?.();

    return () => {
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* Escape + focus-trap (Tab cycling). */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        if (!isProcessing) onClose();
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
    },
    [isProcessing, onClose]
  );

  const switchMode = useCallback((next: 'image' | 'text') => {
    setModeState(next);
    setTool(next === 'image' ? 'upscale' : 'rewrite');
    dispatch({ type: 'RESET' });
  }, []);

  const selectTool = useCallback((next: string) => {
    setTool(next);
    dispatch({ type: 'RESET' });
  }, []);

  const handleGenerate = useCallback(async () => {
    dispatch({ type: 'SUBMITTING' });
    try {
      if (modeState === 'image') {
        if (!input) throw new Error('No image provided to enhance.');
        if (!apiKey) throw new Error('Enter your MuAPI key in Settings first.');
        const { endpoint, payload } = buildImagePayload(tool, input, {
          style: styleSel,
          strength,
          scale,
        });
        dispatch({ type: 'PROCESSING', pollStatus: 'Enhancing image…' });
        const url = await enhanceImage(apiKey, endpoint, payload);
        if (!url) throw new Error('No image was returned by the API.');
        dispatch({ type: 'COMPLETED', result: url });
      } else {
        if (!textValue.trim()) throw new Error('Enter some text to process.');
        dispatch({ type: 'PROCESSING', pollStatus: 'Generating…' });
        const raw = await callOpenAIChat([
          { role: 'system', content: systemPrompt(tool, { tone, targetLang }) },
          { role: 'user', content: textValue },
        ]);
        const variants = parseVariants(raw);
        if (variants.length === 0) throw new Error('The model returned no usable suggestions.');
        dispatch({ type: 'COMPLETED', result: variants });
      }
    } catch (err: any) {
      dispatch({ type: 'FAILED', error: err?.message || 'Request failed.' });
    }
  }, [modeState, input, apiKey, tool, styleSel, strength, scale, textValue, tone, targetLang]);

  const handleApply = useCallback(() => {
    let result: AiAssistantResult;
    if (modeState === 'image') {
      result = { kind: 'image', url: String(job.result) };
    } else {
      result = { kind: 'text', text: job.selectedVariant ?? (Array.isArray(job.result) ? job.result[0] : '') };
    }
    onApply(result);
  }, [modeState, job.result, job.selectedVariant, onApply]);

  /* Arrow-key navigation for the text variants radiogroup. */
  const onVariantKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!Array.isArray(job.result)) return;
      const idx = job.result.indexOf(job.selectedVariant);
      let next = idx;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (idx + 1) % job.result.length;
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (idx - 1 + job.result.length) % job.result.length;
      else return;
      e.preventDefault();
      const variant = job.result[next];
      dispatch({ type: 'SELECT_VARIANT', variant });
      const cards = dialogRef.current?.querySelectorAll<HTMLElement>('[data-variant]');
      cards?.[next]?.focus();
    },
    [job.result, job.selectedVariant]
  );

  /* Arrow-key navigation for the A/B image radiogroup. */
  const onAbKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setAbView((v) => (v === 'before' ? 'after' : 'before'));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setAbView((v) => (v === 'after' ? 'before' : 'after'));
      }
    },
    []
  );

  const imageTools = IMAGE_TOOLS;
  const textTools = TEXT_TOOLS;
  const currentTools = modeState === 'image' ? imageTools : textTools;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in-up"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-title"
        onKeyDown={handleKeyDown}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[var(--color-primary)]" />
            <h2 id="ai-title" className="text-sm font-semibold text-[var(--text-primary)] leading-tight">
              AI Assistant
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {allowToggle && (
              <div
                role="tablist"
                aria-label="Assistant mode"
                className="flex items-center rounded-lg border border-[var(--border-color)] p-0.5"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={modeState === 'image'}
                  onClick={() => switchMode('image')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${focusRing} ${
                    modeState === 'image'
                      ? 'bg-[var(--color-primary)] text-black'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <ImageIcon size={13} /> Image
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={modeState === 'text'}
                  onClick={() => switchMode('text')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${focusRing} ${
                    modeState === 'text'
                      ? 'bg-[var(--color-primary)] text-black'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Type size={13} /> Text
                </button>
              </div>
            )}
            {!allowToggle && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-white/70 border border-[var(--border-color)]">
                {modeState === 'image' ? <ImageIcon size={13} /> : <Type size={13} />}
                {modeState === 'image' ? 'Image' : 'Text'}
              </span>
            )}

            <button
              ref={closeBtnRef}
              type="button"
              onClick={() => !isProcessing && onClose()}
              aria-label="Close"
              className={`p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all ${focusRing}`}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Tool chips */}
          <div
            role="radiogroup"
            aria-label={`${modeState === 'image' ? 'Image' : 'Text'} tools`}
            className="flex flex-wrap gap-2 mb-4"
          >
            {currentTools.map((t) => {
              const active = tool === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-pressed={active}
                  onClick={() => selectTool(t.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${focusRing} ${
                    active
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--text-primary)]'
                      : 'border-[var(--border-color)] bg-white/[0.03] text-white/70 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Input area */}
          {modeState === 'image' ? (
            <Section title="Before">
              {input ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={input}
                  alt="Original image to be enhanced by the AI Assistant"
                  className="w-full max-h-64 object-contain rounded-lg border border-[var(--border-color)] bg-black/30"
                />
              ) : (
                <p className="text-xs text-white/70">No image provided.</p>
              )}
            </Section>
          ) : (
            <Section title="Input text">
              <textarea
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder="Type or paste text to enhance…"
                rows={5}
                  className={`w-full bg-white/5 border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-white/40 resize-none ${focusRing}`}
                />
            </Section>
          )}

          {/* Options by tool */}
          {modeState === 'image' && tool === 'style-transfer' && (
            <Section title="Style options">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="ai-style">Style</Label>
                  <select
                    id="ai-style"
                    value={styleSel}
                    onChange={(e) => setStyleSel(e.target.value)}
                    className={`w-full bg-white/5 border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] ${focusRing}`}
                  >
                    {STYLES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="ai-strength">Strength: {strength.toFixed(2)}</Label>
                  <input
                    id="ai-strength"
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={strength}
                    onChange={(e) => setStrength(Number(e.target.value))}
                    className={`w-full ${focusRing}`}
                  />
                </div>
              </div>
            </Section>
          )}

          {modeState === 'image' && tool === 'upscale' && (
            <Section title="Upscale options">
              <div>
                <Label htmlFor="ai-scale">Scale: {scale}×</Label>
                <input
                  id="ai-scale"
                  type="range"
                  min={1}
                  max={4}
                  step={1}
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className={`w-full ${focusRing}`}
                />
              </div>
            </Section>
          )}


          {modeState === 'text' && tool === 'tone' && (
            <Section title="Tone options">
              <Label htmlFor="ai-tone">Tone</Label>
              <select
                id="ai-tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className={`w-full bg-white/5 border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] ${focusRing}`}
              >
                {TONES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Section>
          )}

          {modeState === 'text' && tool === 'translate' && (
            <Section title="Translate options">
              <Label htmlFor="ai-lang">Target language</Label>
              <select
                id="ai-lang"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className={`w-full bg-white/5 border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] ${focusRing}`}
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </Section>
          )}

          {/* Status / error live region */}
          <div aria-live="polite" className="min-h-[1.25rem] mb-2">
            {job.error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <span>{job.error}</span>
              </div>
            )}
            {!job.error && isProcessing && (
              <p className="flex items-center gap-2 text-xs text-white/70">
                <Loader2 size={14} className="animate-spin" />
                {job.pollStatus || 'Working…'}
              </p>
            )}
          </div>

          {/* Results */}
          {job.status === 'completed' && modeState === 'image' && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-white/70">Result</span>
                <div
                  role="radiogroup"
                  aria-label="Compare before and after"
                  onKeyDown={onAbKeyDown}
                  className="flex items-center gap-1 rounded-lg border border-[var(--border-color)] p-0.5"
                >
                  {(['before', 'after'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      role="radio"
                      aria-checked={abView === v}
                      tabIndex={abView === v ? 0 : -1}
                      onClick={() => setAbView(v)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize transition-all ${focusRing} ${
                        abView === v ? 'bg-[var(--color-primary)] text-black' : 'text-white/70'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
                <figure className="m-0">
                  <figcaption className="text-[11px] font-semibold text-white/70 mb-1">Before</figcaption>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={input || ''}
                    alt="Original image before enhancement"
                    className={`w-full max-h-64 object-contain rounded-lg border ${
                      abView === 'before' ? 'border-[var(--color-primary)]' : 'border-[var(--border-color)]'
                    } bg-black/30`}
                  />
                </figure>
                <figure className="m-0">
                  <figcaption className="text-[11px] font-semibold text-white/70 mb-1">After</figcaption>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={String(job.result)}
                    alt="Enhanced image produced by the AI Assistant"
                    className={`w-full max-h-64 object-contain rounded-lg border ${
                      abView === 'after' ? 'border-[var(--color-primary)]' : 'border-[var(--border-color)]'
                    } bg-black/30`}
                  />
                </figure>
              </div>

              <button
                type="button"
                onClick={handleApply}
                className={`mt-3 w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-[var(--color-primary)] text-black font-semibold text-sm hover:opacity-90 transition-all ${focusRing}`}
              >
                <Check size={16} /> Apply enhanced image
              </button>
            </div>
          )}

          {job.status === 'completed' && modeState === 'text' && Array.isArray(job.result) && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-white/70">
                  Variants ({job.result.length})
                </span>
              </div>
              <div role="radiogroup" aria-label="Generated text variants" onKeyDown={onVariantKeyDown} className="space-y-2">
                {job.result.map((variant: string, i: number) => {
                  const active = job.selectedVariant === variant;
                  return (
                    <button
                      key={i}
                      type="button"
                      role="radio"
                      data-variant
                      aria-checked={active}
                      tabIndex={active ? 0 : -1}
                      onClick={() => dispatch({ type: 'SELECT_VARIANT', variant })}
                      className={`w-full text-left rounded-xl border p-3 transition-all ${focusRing} ${
                        active
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                          : 'border-[var(--border-color)] bg-white/[0.03] hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${
                            active ? 'border-[var(--color-primary)]' : 'border-white/40'
                          }`}
                        >
                          {active && <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />}
                        </span>
                        <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{variant}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="sr-only" aria-live="polite">
                {job.selectedVariant ? `Selected variant: ${job.selectedVariant}` : ''}
              </p>

              <button
                type="button"
                onClick={handleApply}
                disabled={!job.selectedVariant}
                className={`mt-3 w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-[var(--color-primary)] text-black font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${focusRing}`}
              >
                <Check size={16} /> Apply selected text
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--border-color)] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => !isProcessing && onClose()}
            className={`px-4 h-10 rounded-xl text-sm font-medium border border-[var(--border-color)] text-white/80 hover:bg-white/5 transition-all ${focusRing}`}
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isProcessing}
            className={`flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-[var(--color-primary)] text-black font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${focusRing}`}
          >
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            {isProcessing ? job.pollStatus || 'Working…' : job.status === 'completed' ? 'Generate again' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
}
