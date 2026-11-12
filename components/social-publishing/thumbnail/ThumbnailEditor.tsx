'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Brush, Eraser, Loader2, Pencil, Undo2, Wand2, X } from 'lucide-react';
import { refineThumbnail, type ThumbnailRefineResult } from '@/shared/api/thumbnailService';
import { composeMarkup, drawStrokes, MARKUP_INSTRUCTION, strokesToMaskPng, type Stroke } from './thumbnailMask';
import ThumbnailPlatformPreview from './ThumbnailPlatformPreview';

type Mode = 'prompt' | 'mask' | 'markup';

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: 'prompt', label: 'Describe', hint: 'Describe the change in words. The whole image can change.' },
  { id: 'mask', label: 'Paint an area', hint: 'Paint over the part to change, then say what should be there. The rest stays as it is.' },
  { id: 'markup', label: 'Draw on it', hint: 'Draw circles, arrows or notes in red where you want changes. The AI applies them and removes the drawing.' },
];

export interface ThumbnailEditorProps {
  sourceImageUrl: string | null;
  /** Model picked in the Thumbnail step (Images 2.6 or GPT Image 2). */
  model?: string;
  aspectRatio?: string;
  disabled?: boolean;
  /** The user accepted a new version (or went back to an older one). */
  onApply: (result: { url: string; responseId?: string; revisedPrompt?: string }) => void;
}

export default function ThumbnailEditor({ sourceImageUrl, model, aspectRatio = '16:9', disabled = false, onApply }: ThumbnailEditorProps) {
  const [mode, setMode] = useState<Mode>('prompt');
  const [prompt, setPrompt] = useState('');
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [brush, setBrush] = useState(40);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [pending, setPending] = useState<ThumbnailRefineResult | null>(null);
  const [showBefore, setShowBefore] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef<Stroke | null>(null);
  // Identifies the edit request in flight; bumped whenever the thumbnail changes so a late answer is dropped.
  const requestId = useRef(0);
  // The URL this editor just handed to onApply (accepted edit or undo): that change keeps the history.
  const selfChange = useRef<string | null>(null);

  // The source changed: drop anything tied to the old image.
  useEffect(() => {
    requestId.current += 1;
    setBusy(false);
    setStrokes([]);
    setPending(null);
    setShowBefore(false);
    setError(null);
    setNote(null);
    if (selfChange.current === sourceImageUrl) {
      selfChange.current = null; // our own accept/undo: keep the undo history
    } else {
      selfChange.current = null;
      setHistory([]); // a different thumbnail was picked: its edits are not ours to undo
    }
  }, [sourceImageUrl]);

  const paint = useCallback(
    (list: Stroke[]) => {
      const canvas = canvasRef.current;
      const img = imgRef.current;
      if (!canvas || !img || !img.naturalWidth) return;
      if (canvas.width !== img.naturalWidth) canvas.width = img.naturalWidth;
      if (canvas.height !== img.naturalHeight) canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawStrokes(ctx, list, mode === 'markup' ? '#ff2d2d' : 'rgba(34,211,238,0.55)');
    },
    [mode],
  );

  useEffect(() => paint(strokes), [strokes, paint]);

  const toImagePoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode === 'prompt' || busy || disabled) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const scale = canvasRef.current!.width / canvasRef.current!.getBoundingClientRect().width;
    drawing.current = { points: [toImagePoint(e)], size: brush * scale, erase: tool === 'eraser' };
    paint([...strokes, drawing.current]);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current.points.push(toImagePoint(e));
    paint([...strokes, drawing.current]);
  };
  const endStroke = () => {
    if (!drawing.current) return;
    const done = drawing.current;
    drawing.current = null;
    setStrokes((s) => [...s, done]);
  };

  const hasDrawing = strokes.some((s) => !s.erase);
  // Describe needs an instruction; paint needs a painted area and what to put there; markup only needs the drawing (the note is optional).
  const canApply = !!sourceImageUrl && !busy && !disabled && (mode === 'markup' ? hasDrawing : prompt.trim().length > 0 && (mode === 'prompt' || hasDrawing));

  const apply = useCallback(async () => {
    const img = imgRef.current;
    if (!sourceImageUrl || !img || !canApply) return;
    const id = ++requestId.current;
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      let imageUrl = sourceImageUrl;
      let maskUrl: string | undefined;
      let text = prompt.trim();
      if (mode === 'mask') {
        maskUrl = strokesToMaskPng(img.naturalWidth, img.naturalHeight, strokes);
      } else if (mode === 'markup') {
        try {
          imageUrl = composeMarkup(img, strokes);
        } catch {
          throw new Error('This image cannot be drawn on directly. Use "Paint an area" or "Describe" instead.');
        }
        text = `${MARKUP_INSTRUCTION} ${text}`;
      }
      const [first] = await refineThumbnail({ imageUrl, prompt: text, aspectRatio, n: 1, quality, model, maskUrl });
      if (id !== requestId.current) return; // the user moved to another thumbnail meanwhile
      if (!first) throw new Error('No image came back. Try again.');
      setPending(first);
      setShowBefore(false);
      if (first.fallbackFrom) {
        setNote(`Your key cannot use ${first.fallbackFrom} yet, so GPT Image 2 made this edit.`);
      }
    } catch (err) {
      if (id === requestId.current) setError(err instanceof Error ? err.message : 'The edit failed. Try again.');
    } finally {
      if (id === requestId.current) setBusy(false);
    }
  }, [sourceImageUrl, canApply, prompt, mode, strokes, aspectRatio, quality, model]);

  const accept = () => {
    if (!pending || !sourceImageUrl) return;
    setHistory((h) => [...h, sourceImageUrl].slice(-10));
    selfChange.current = pending.url;
    onApply({ url: pending.url, responseId: pending.responseId, revisedPrompt: pending.revisedPrompt });
    setPending(null);
    setStrokes([]);
    setPrompt('');
  };

  const undo = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    selfChange.current = prev;
    onApply({ url: prev });
    setPending(null);
  };

  if (!sourceImageUrl) {
    return (
      <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] text-white/25 text-xs text-center">
        Generate or pick a thumbnail to open the image editor.
      </div>
    );
  }

  const shown = pending && !showBefore ? pending.url : sourceImageUrl;
  const missingKey = !!error && /openai api key|openai key/i.test(error);

  return (
    <section data-testid="thumbnail-editor" className="space-y-3 p-4 rounded-xl border border-white/8 bg-white/[0.02]" aria-label="Image editor">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
          <Pencil size={13} className="text-[#22d3ee]" /> Image editor
        </p>
        <button
          type="button"
          onClick={undo}
          disabled={history.length === 0 || busy}
          className="text-[11px] text-white/50 hover:text-white disabled:opacity-30 flex items-center gap-1"
          aria-label="Undo last edit"
        >
          <Undo2 size={12} /> Undo last edit
        </button>
      </div>

      <div role="tablist" aria-label="Edit method" className="flex flex-wrap gap-1.5">
        {MODES.map((m) => (
          <button
            key={m.id}
            role="tab"
            type="button"
            aria-selected={mode === m.id}
            onClick={() => setMode(m.id)}
            className="px-3 py-1 rounded-full text-[11px] font-medium"
            style={{
              background: mode === m.id ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.05)',
              color: mode === m.id ? '#22d3ee' : 'rgba(255,255,255,0.55)',
              border: `1px solid ${mode === m.id ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-white/35">{MODES.find((m) => m.id === mode)!.hint}</p>

      <div className="relative inline-block max-w-full rounded-lg overflow-hidden border border-white/10 bg-black/40" style={{ touchAction: mode === 'prompt' ? 'auto' : 'none' }}>
        <img
          ref={imgRef}
          src={shown}
          alt={pending && !showBefore ? 'Edited thumbnail preview' : 'Current thumbnail preview'}
          onLoad={() => paint(strokes)}
          className="block max-w-full max-h-[360px]"
        />
        {mode !== 'prompt' && !pending && (
          <canvas
            ref={canvasRef}
            data-testid="thumbnail-draw-layer"
            className="absolute inset-0 w-full h-full"
            style={{ cursor: 'crosshair' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endStroke}
            onPointerLeave={endStroke}
          />
        )}
      </div>

      {mode !== 'prompt' && !pending && (
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/60">
          <button type="button" onClick={() => setTool('brush')} aria-pressed={tool === 'brush'} className="flex items-center gap-1 px-2 py-1 rounded-md border border-white/10" style={{ color: tool === 'brush' ? '#22d3ee' : undefined }}>
            <Brush size={12} /> Brush
          </button>
          <button type="button" onClick={() => setTool('eraser')} aria-pressed={tool === 'eraser'} className="flex items-center gap-1 px-2 py-1 rounded-md border border-white/10" style={{ color: tool === 'eraser' ? '#22d3ee' : undefined }}>
            <Eraser size={12} /> Eraser
          </button>
          <label className="flex items-center gap-2">
            Size
            <input type="range" min={8} max={120} value={brush} onChange={(e) => setBrush(Number(e.target.value))} aria-label="Brush size" />
          </label>
          <button type="button" onClick={() => setStrokes([])} disabled={strokes.length === 0} className="underline disabled:opacity-30">
            Clear drawing
          </button>
        </div>
      )}

      {pending && (
        <div className="space-y-2" data-testid="thumbnail-edit-result">
          <div className="flex items-center gap-2 text-[11px]">
            <button type="button" onClick={() => setShowBefore(true)} aria-pressed={showBefore} className="px-2 py-1 rounded-md border border-white/10">Before</button>
            <button type="button" onClick={() => setShowBefore(false)} aria-pressed={!showBefore} className="px-2 py-1 rounded-md border border-white/10">After</button>
            <span className="text-white/35">{pending.model ? `Made with ${pending.model}` : ''}</span>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={accept} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-black" style={{ background: '#22d3ee' }}>
              Use this version
            </button>
            <button type="button" onClick={() => setPending(null)} className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/60 flex items-center gap-1">
              <X size={12} /> Discard
            </button>
          </div>
        </div>
      )}

      {!pending && (
        <div className="space-y-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            disabled={busy || disabled}
            placeholder={mode === 'mask' ? 'What should appear in the painted area? e.g. "a city skyline at sunset"' : mode === 'markup' ? 'Optional note about your drawing, e.g. "move the logo here"' : 'Describe the change, e.g. "make the title text bigger and the background darker"'}
            className="w-full resize-none text-xs outline-none rounded-lg p-3"
            style={{ background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
            aria-label="Edit instruction"
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-[11px] text-white/50 flex items-center gap-2">
              Quality
              <select value={quality} onChange={(e) => setQuality(e.target.value as 'low' | 'medium' | 'high')} className="rounded-md px-2 py-1 text-[11px]" style={{ background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }} aria-label="Edit quality">
                <option value="low">Draft</option>
                <option value="medium">Standard</option>
                <option value="high">High</option>
              </select>
            </label>
            <button
              type="button"
              onClick={apply}
              disabled={!canApply}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
              style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />} Apply edit
            </button>
          </div>
        </div>
      )}

      {note && <p className="text-[11px] text-amber-300/80" role="status">{note}</p>}
      {error && (
        <div className="p-2 rounded-lg text-[11px] text-red-400" style={{ background: 'rgba(239,68,68,0.1)' }} role="alert">
          {error}
          {missingKey && <span className="block mt-1 text-white/50">Add your OpenAI key in Settings, then try again.</span>}
        </div>
      )}

      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/30">How it will look</p>
        <ThumbnailPlatformPreview imageUrl={shown} />
      </div>
    </section>
  );
}
