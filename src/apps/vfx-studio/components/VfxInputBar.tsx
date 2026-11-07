'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import type { AspectRatio, GenerationState, Quality, Resolution } from '@/types/vfx';

const SELECT_CLASS =
  'rounded-xl border border-white/10 bg-[#0d0d10] px-3 py-2 text-sm font-semibold text-white outline-none transition-colors focus:border-[#22d3ee]/60';

const ASPECT_OPTIONS: { value: AspectRatio; label: string }[] = [
  { value: '9:16', label: '9:16 Portrait' },
  { value: '16:9', label: '16:9 Landscape' },
  { value: '1:1', label: '1:1 Square' },
];
const DURATION_OPTIONS = [
  { value: 5, label: '5s' },
  { value: 10, label: '10s' },
];
const RESOLUTION_OPTIONS: { value: Resolution; label: string }[] = [
  { value: '480p', label: '480p' },
  { value: '720p', label: '720p' },
];
const QUALITY_OPTIONS: { value: Quality; label: string }[] = [
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

function Select<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="flex min-w-[96px] flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</span>
      <select
        aria-label={label}
        className={SELECT_CLASS}
        value={String(value)}
        onChange={(e) => {
          const next = options.find((option) => String(option.value) === e.target.value);
          if (next) onChange(next.value);
        }}
      >
        {options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export interface VfxInputBarProps {
  effectName: string | null;
  previewUrl: string | null;
  imageUrl: string;
  prompt: string;
  onPromptChange: (value: string) => void;
  onPickFile: () => void;
  onDropFile: (file: File) => void;
  onCommitUrl: (url: string) => void;
  onClearImage: () => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (value: AspectRatio) => void;
  duration: number;
  onDurationChange: (value: number) => void;
  resolution: Resolution;
  onResolutionChange: (value: Resolution) => void;
  quality: Quality;
  onQualityChange: (value: Quality) => void;
  status: GenerationState;
  progress: number;
  statusLabel: string;
  error: string;
  loading: boolean;
  onGenerate: () => void;
  onCancel: () => void;
  /** Renders the shared Personalization trigger next to the image when there is one. */
  personalizeAction?: React.ReactNode;
}

/**
 * The sticky input panel under the page banner: source image, optional prompt, the four generation settings and
 * the Generate button. Mirrors the layout of the reference AI VFX studio in this app's colours.
 */
export default function VfxInputBar(props: VfxInputBarProps) {
  const {
    effectName,
    previewUrl,
    imageUrl,
    prompt,
    onPromptChange,
    onPickFile,
    onDropFile,
    onCommitUrl,
    onClearImage,
    status,
    progress,
    statusLabel,
    error,
    loading,
    onGenerate,
    onCancel,
  } = props;

  const [dragging, setDragging] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const shownImage = previewUrl || imageUrl || null;
  const running = status === 'queued' || status === 'processing';
  const uploading = status === 'uploading';

  // The pasted URL box empties once the image is cleared or replaced by an upload.
  useEffect(() => {
    if (!imageUrl) setUrlDraft('');
  }, [imageUrl]);

  const commitUrl = () => {
    const value = urlDraft.trim();
    if (value && value !== imageUrl) onCommitUrl(value);
  };

  return (
    <div
      data-vfx-bar=""
      className="z-20 flex w-full flex-col md:sticky md:top-2 gap-3 rounded-[1.75rem] border border-white/[0.08] bg-gradient-to-b from-[#18181c]/95 to-[#0c0c0e]/95 p-4 shadow-[0_15px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
    >
      <div className="flex flex-col items-stretch gap-3 md:flex-row">
        <div className="relative shrink-0">
          <button
            type="button"
            data-vfx-image=""
            onClick={onPickFile}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) onDropFile(file);
            }}
            title="Upload the image the effect is applied to"
            className={`relative flex h-28 w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border border-dashed text-[11px] font-semibold text-white/50 transition-colors md:w-28 ${
              dragging
                ? 'border-[#22d3ee] bg-[#22d3ee]/10'
                : 'border-white/15 bg-white/[0.03] hover:border-[#22d3ee]/60 hover:bg-white/[0.05]'
            }`}
          >
            {shownImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shownImage} alt="Source image" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <>
                <Upload size={22} />
                <span>Add image</span>
              </>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-[11px] text-white">
                Uploading…
              </div>
            )}
          </button>
          {shownImage && !uploading && (
            <button
              type="button"
              onClick={onClearImage}
              aria-label="Remove image"
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-black/80 text-white hover:bg-red-500"
            >
              <X size={11} />
            </button>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span>
              {effectName ? (
                <>
                  Effect: <span className="font-bold text-[#22d3ee]">{effectName}</span>
                </>
              ) : (
                'Pick an effect below, add an image, then Generate.'
              )}
            </span>
            {shownImage && props.personalizeAction}
          </div>
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder='Optional: describe the subject (e.g. "a red sports car")'
            className="w-full flex-1 resize-none bg-transparent text-sm text-white outline-none placeholder:text-white/30 md:text-base"
          />
          <input
            type="url"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onBlur={commitUrl}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitUrl();
              }
            }}
            placeholder="…or paste an image URL (https://) and press Enter"
            aria-label="Image URL"
            className="min-w-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none placeholder:text-white/30 focus:border-[#22d3ee]/50"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-white/[0.04] pt-3">
        <div className="flex flex-wrap gap-2">
          <Select label="Aspect" value={props.aspectRatio} options={ASPECT_OPTIONS} onChange={props.onAspectRatioChange} />
          <Select label="Duration" value={props.duration} options={DURATION_OPTIONS} onChange={props.onDurationChange} />
          <Select label="Size" value={props.resolution} options={RESOLUTION_OPTIONS} onChange={props.onResolutionChange} />
          <Select label="Quality" value={props.quality} options={QUALITY_OPTIONS} onChange={props.onQualityChange} />
        </div>

        <div className="flex items-center gap-2">
          {running && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-white/80 transition-colors hover:border-red-400/60 hover:text-red-300"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            data-vfx-generate=""
            onClick={onGenerate}
            disabled={loading || running || uploading}
            className="flex items-center gap-2 rounded-full bg-[#22d3ee] px-7 py-3 text-sm font-bold text-black shadow-[0_0_24px_rgba(34,211,238,0.25)] transition-all hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {(loading || running) && <Loader2 size={15} className="animate-spin" />}
            {loading || running ? 'Generating…' : 'Generate ✨'}
          </button>
        </div>
      </div>

      {(running || uploading) && (
        <div className="flex flex-col gap-1.5" role="status">
          <div className="flex items-center justify-between text-[11px] text-white/60">
            <span>{statusLabel}</span>
            {running && <span>{Math.round(progress)}%</span>}
          </div>
          {running && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-[#22d3ee] to-[#a855f7] transition-[width] duration-500"
                style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
              />
            </div>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
