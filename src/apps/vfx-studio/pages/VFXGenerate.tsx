'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Copy, RotateCcw, Check, Sparkles, Search } from 'lucide-react';
import { useVideoGeneration } from '@/hooks/useVideoGeneration';
import VfxInputBar from '@/apps/vfx-studio/components/VfxInputBar';
import {
  AI_EFFECTS,
  ALL_EFFECTS,
  MOTION_CONTROLS,
  VFX_CATEGORIES,
  VFX_EFFECTS,
  VFX_HERO_IMAGE,
  type VFXCategoryId,
} from '@/apps/vfx-studio/effectCatalog';
import { readStoryboardHandoff } from '@/shared/crossStudio';
import { PublishStep } from '@/components/SocialPublishProvider';
import { AssistStep } from '@/components/AiAssistantProvider';
import type { AspectRatio, Resolution, Quality, VFXEffect } from '@/types/vfx';

const STORAGE_KEY_UI = 'vfx_ui_state';

type CategoryId = VFXCategoryId;

interface UIState {
  activeCategory: CategoryId;
  selectedEffectId: string | null;
  imageUrl: string;
  prompt: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  duration: number;
  quality: Quality;
}

function loadUIState(): Partial<UIState> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_UI);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveUIState(state: UIState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_UI, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export default function VFXGenerate({ apiKey, onRequestApiKey, onDismissApiKey, templateData, renderPersonalizeAction }: { 
  apiKey?: string; 
  onRequestApiKey?: () => void;
  onDismissApiKey?: () => void;
  templateData?: { prompt?: string; aspectRatio?: string; [key: string]: any };
  renderPersonalizeAction?: (options: unknown) => React.ReactNode;
}) {
  const saved = loadUIState();

  const [activeCategory, setActiveCategory] = useState<CategoryId>(saved?.activeCategory || 'ai-effects');
  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(saved?.selectedEffectId || null);
  const [imageUrl, setImageUrl] = useState(saved?.imageUrl || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(saved?.prompt || '');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(saved?.aspectRatio || '16:9');
  const [resolution, setResolution] = useState<Resolution>(saved?.resolution || '480p');
  const [duration, setDuration] = useState(saved?.duration ?? 5);
  const [quality, setQuality] = useState<Quality>(saved?.quality || 'medium');

  // ── Apply template data from landing page "Create This Style" ──────────────
  const templateApplied = useRef<string | null>(null);
  useEffect(() => {
    const templateId = templateData?.sourceRepo && templateData?.slug
      ? `${templateData.sourceRepo}|${templateData.slug}`
      : templateData?.slug;
    if (!templateData || templateApplied.current === templateId) return;
    templateApplied.current = templateId;

    if (templateData.prompt) {
      setPrompt(templateData.prompt);
    }
    if (templateData.aspectRatio) {
      setAspectRatio(templateData.aspectRatio as AspectRatio);
    }
  }, [templateData]);

  // ── Apply cross-studio handoff from GO-Viral / Storyboard ──────────────────
  const handoffApplied = useRef<string | null>(null);
  useEffect(() => {
    try {
      const handoff = readStoryboardHandoff("vfx-studio");
      if (!handoff || handoffApplied.current === handoff.createdAt) return;
      handoffApplied.current = handoff.createdAt;

      if (handoff.combinedPrompt || handoff.projectName) {
        setPrompt(handoff.combinedPrompt || handoff.projectName);
      }
      if (handoff.aspectRatio) {
        setAspectRatio(handoff.aspectRatio as AspectRatio);
      }
    } catch (error) { /* silent */ }
  }, []);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [pendingGenerate, setPendingGenerate] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    status,
    progress,
    videoUrl,
    error: hookError,
    loading,
    requestId,
    uploadImage,
    generateVideo,
    cancelVideo,
    retryVideo,
    reset,
    setError,
  } = useVideoGeneration(apiKey || undefined);

   const selectedEffect = useMemo(
     () => ALL_EFFECTS.find((e) => e.id === selectedEffectId) || null,
     [selectedEffectId]
   );

  const effectsByCategory = useMemo(() => {
    const map = new Map<CategoryId, VFXEffect[]>();
    map.set('ai-effects', AI_EFFECTS);
    map.set('motion-controls', MOTION_CONTROLS);
    map.set('vfx', VFX_EFFECTS);
    return map;
  }, []);

  const filteredEffects = useMemo(() => {
    const list = effectsByCategory.get(activeCategory) || [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((e) => e.name.toLowerCase().includes(q));
  }, [activeCategory, effectsByCategory, search]);

  /**
   * Optional renderer for the shared Personalization Modal hand-off.
   *
   * The provider is mounted ONCE in `components/StandaloneShell.js` around
   * every studio tab, so this page only builds a plain hand-off payload and
   * renders the trigger the app root passes in — no import across any package
   * boundary.
   */
  const studioPersonalizeOptions = useMemo(
    () => ({
      originStudio: 'vfx-studio' as const,
      studioProjectId: `${selectedEffectId || 'no-effect'} : ${aspectRatio} : ${(imageUrl || '').split('/').pop() || 'no-image'}`,
      title: selectedEffect ? `${selectedEffect.name} image` : 'VFX Studio image',
      media: {
        mediaType: 'image' as const,
        url: imageUrl || null,
        poster: null,
        aspectRatio,
        duration,
        durationLabel: `${duration}s`,
      },
      prompt: { text: prompt || selectedEffect?.prompt || '' },
    }),
    [selectedEffectId, selectedEffect, aspectRatio, duration, imageUrl, prompt],
  );

  // Show generation modal when generating
  useEffect(() => {
    if ((status === 'queued' || status === 'processing') && !showGenerationModal) {
      setShowGenerationModal(true);
    }
    if (status === 'idle' && showGenerationModal) {
      setShowGenerationModal(false);
    }
  }, [status, showGenerationModal]);

  // Persist UI settings
  useEffect(() => {
    saveUIState({
      activeCategory,
      selectedEffectId,
      imageUrl,
      prompt,
      aspectRatio,
      resolution,
      duration,
      quality,
    });
  }, [activeCategory, selectedEffectId, imageUrl, prompt, aspectRatio, resolution, duration, quality]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      const url = await uploadImage(file);
      if (url) {
        setImageUrl(url);
      }
    },
    [uploadImage]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  /** A pasted image address: shown straight away, then re-hosted so the API can always fetch it. */
  const commitImageUrl = useCallback(
    async (url: string) => {
      const value = url.trim();
      if (!/^https?:\/\//i.test(value)) {
        setError('Image URL must start with http:// or https://');
        return;
      }
      setImageFile(null);
      setImagePreview(value);
      setImageUrl(value);
      const uploaded = await uploadImage(value);
      if (uploaded) setImageUrl(uploaded);
    },
    [uploadImage, setError]
  );

  const clearImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

   const handleGenerate = useCallback(async () => {
     if (!selectedEffect) {
       setError('Select an effect first');
       return;
     }
     if (!imageUrl) {
       setError('Upload an image or paste an image URL first');
       return;
     }
     if (!apiKey) {
       setPendingGenerate(true);
       onRequestApiKey?.();
       return;
     }

     await generateVideo({
       image_url: imageUrl,
       effect: selectedEffect.name,
       // The preset name picks the look; whatever the user typed is added on top.
       prompt: [selectedEffect.prompt, prompt.trim()].filter(Boolean).join('. ') || undefined,
       aspect_ratio: aspectRatio,
       resolution,
       duration,
       quality,
     });
    }, [selectedEffect, imageUrl, prompt, aspectRatio, resolution, duration, quality, generateVideo, setError, apiKey, onRequestApiKey]);

  // If the user requested generation but the key is missing, surface the
  // global API key modal. Once the shell provides a key via the `apiKey` prop,
  // generation auto-starts.
  const handleRequestApiKey = useCallback(() => {
    setPendingGenerate(true);
    onRequestApiKey?.();
  }, [onRequestApiKey]);

  // Auto-trigger generation once the global key arrives.
  useEffect(() => {
    if (pendingGenerate && apiKey) {
      setPendingGenerate(false);
      handleGenerate();
    }
  }, [pendingGenerate, apiKey, handleGenerate]);

  // Reset pending generate when the key is explicitly dismissed without saving.
  useEffect(() => {
    if (!apiKey && pendingGenerate) {
      setPendingGenerate(false);
    }
  }, [apiKey, pendingGenerate]);

  const handleDownload = useCallback(async () => {
    if (!videoUrl) return;
    try {
      const res = await fetch(videoUrl);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vfx-${selectedEffect?.name || 'video'}.mp4`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(videoUrl, '_blank');
    }
  }, [videoUrl, selectedEffect]);

  const handleCopyUrl = useCallback(() => {
    if (!videoUrl) return;
    navigator.clipboard.writeText(videoUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [videoUrl]);

  const handleRegenerate = useCallback(() => {
    retryVideo();
  }, [retryVideo]);

  const handleReset = useCallback(() => {
    reset();
    clearImage();
    setSelectedEffectId(null);
    setPrompt('');
    setShowGenerationModal(false);
  }, [reset, clearImage]);

  const statusLabel = useMemo(() => {
    switch (status) {
      case 'uploading':
        return 'Uploading image...';
      case 'queued':
        return 'Queued for generation';
      case 'processing':
        return `Processing video... ${progress}%`;
      case 'completed':
        return 'Generation complete';
      case 'failed':
        return 'Generation failed';
      case 'cancelled':
        return 'Generation cancelled';
      default:
        return '';
    }
  }, [status, progress]);

  const errorMessage = hookError ?? '';

  const categoryCounts: Record<CategoryId, number> = {
    'ai-effects': AI_EFFECTS.length,
    'motion-controls': MOTION_CONTROLS.length,
    vfx: VFX_EFFECTS.length,
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-[#030303] custom-scrollbar" data-vfx-page="">
      {/* Generation progress / result popup */}
      {showGenerationModal && (
        <div className="fixed inset-0 z-[240] flex items-center justify-center bg-black/60 p-4">
          <div className="relative flex min-h-[220px] min-w-[300px] max-w-full flex-col items-center gap-4 rounded-2xl border border-white/10 bg-[#0c0c0f] p-8 text-white shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
            <button
              type="button"
              onClick={() => {
                setShowGenerationModal(false);
                reset();
              }}
              title="Close"
              aria-label="Close"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-xl text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              ×
            </button>
            {(status === 'queued' || status === 'processing') && (
              <>
                <div className="text-center text-lg font-semibold">⏳ Generating your video...</div>
                <div className="h-2 w-80 max-w-[90vw] overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-[#22d3ee] to-[#a855f7] transition-[width] duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {requestId && <div className="text-xs text-white/40">Request ID: {requestId}</div>}
              </>
            )}
            {status === 'completed' && videoUrl && (
              <>
                <div className="text-center text-lg font-semibold">🎉 Your video is ready!</div>
                <video src={videoUrl} controls className="max-h-[300px] max-w-full rounded-xl bg-black" />
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="rounded-full bg-[#22d3ee] px-5 py-2.5 text-sm font-bold text-black"
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGenerationModal(false)}
                    className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/80 hover:text-white"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
            {status === 'failed' && errorMessage && (
              <div className="max-w-md text-center text-red-300">
                <b>Error:</b> {errorMessage}
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowGenerationModal(false);
                      reset();
                    }}
                    className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/80 hover:text-white"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 pb-24 pt-4 md:px-8">
        {/* Banner */}
        <div
          data-vfx-banner=""
          className="relative h-32 w-full shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d10] md:h-44"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={VFX_HERO_IMAGE}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: '50% 38%' }}
            onError={(e) => {
              e.currentTarget.style.visibility = 'hidden';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/10" />
          <div className="absolute inset-y-0 left-0 z-10 flex max-w-[80%] flex-col justify-center px-5 text-left md:px-7">
            <h1 className="text-xl font-black leading-tight tracking-tight text-white md:text-2xl">AI VFX Studio</h1>
            <p className="mt-1 line-clamp-1 text-xs text-white/65 md:text-sm">
              Hollywood camera moves, explosive VFX and AI effects from a single image
            </p>
          </div>
        </div>

        <VfxInputBar
          effectName={selectedEffect?.name ?? null}
          previewUrl={imagePreview}
          imageUrl={imageUrl}
          prompt={prompt}
          onPromptChange={setPrompt}
          onPickFile={() => fileInputRef.current?.click()}
          onDropFile={handleFileSelect}
          onCommitUrl={commitImageUrl}
          onClearImage={clearImage}
          aspectRatio={aspectRatio}
          onAspectRatioChange={setAspectRatio}
          duration={duration}
          onDurationChange={setDuration}
          resolution={resolution}
          onResolutionChange={setResolution}
          quality={quality}
          onQualityChange={setQuality}
          status={status}
          progress={progress}
          statusLabel={statusLabel}
          error={errorMessage}
          loading={loading}
          onGenerate={handleGenerate}
          onCancel={cancelVideo}
          personalizeAction={
            studioPersonalizeOptions.media.url ? renderPersonalizeAction?.(studioPersonalizeOptions) : null
          }
        />

        {/* Finished video */}
        {videoUrl && status === 'completed' && (
          <div
            id="video-generation-status"
            className="flex flex-col flex-wrap items-start gap-4 rounded-2xl border border-white/10 bg-[#111] p-4 sm:flex-row"
          >
            <video src={videoUrl} controls className="max-h-[260px] w-full max-w-full rounded-xl bg-black sm:w-auto" />
            <div className="flex w-full flex-col gap-2 sm:w-auto">
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 rounded-full bg-[#22d3ee] px-4 py-2 text-sm font-bold text-black"
              >
                <Download size={14} />
                Download
              </button>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.08]"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy URL'}
              </button>
              <PublishStep
                mediaUrl={videoUrl}
                mediaType="video"
                title={selectedEffect?.name ? `${selectedEffect.name} video` : 'My VFX video'}
                className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.08]"
              />
              <AssistStep
                assetUrl={videoUrl}
                assetType="video"
                onApply={() => {}}
                className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.08]"
              >
                Enhance
              </AssistStep>
              <button
                type="button"
                onClick={handleRegenerate}
                className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.08]"
              >
                <RotateCcw size={14} />
                Regenerate
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white/50 hover:text-white"
              >
                <Sparkles size={14} />
                New Video
              </button>
            </div>
          </div>
        )}

        {/* Category pills + search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="no-scrollbar flex gap-2 overflow-x-auto" role="tablist" aria-label="Effect categories">
            {VFX_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={activeCategory === category.id}
                data-vfx-tab={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                  activeCategory === category.id
                    ? 'bg-[#22d3ee] text-black'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {category.icon} {category.label} · {categoryCounts[category.id]}
              </button>
            ))}
          </div>
          <div className="relative ml-auto min-w-[180px] flex-1 sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search effects..."
              aria-label="Search effects"
              className="w-full rounded-full border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#22d3ee]/50"
            />
          </div>
        </div>

        {/* Effect cards */}
        {filteredEffects.length === 0 ? (
          <p className="py-10 text-center text-sm text-white/40">No effects match “{search}”.</p>
        ) : (
          <div
            data-vfx-grid=""
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          >
            {filteredEffects.map((effect) => {
              const isSelected = selectedEffectId === effect.id;
              return (
                <button
                  key={effect.id}
                  type="button"
                  data-vfx-effect={effect.name}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedEffectId(effect.id)}
                  className={`group relative aspect-[3/4] overflow-hidden rounded-2xl border bg-[#111] text-left transition-all ${
                    isSelected
                      ? 'border-[#22d3ee] shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  {effect.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={effect.preview}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.visibility = 'hidden';
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-4xl">{effect.emoji}</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-2.5 text-xs font-bold leading-tight text-white">
                    {effect.name}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
