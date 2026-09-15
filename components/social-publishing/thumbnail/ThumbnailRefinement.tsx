'use client';

import React, { useState, useCallback, useRef } from 'react';
import { RefreshCw, Wand2, Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { refineThumbnail, type ThumbnailRefineResult } from '@/shared/api/thumbnailService';

const QUICK_CHIPS = [
  { id: 'dramatic', label: 'More dramatic' },
  { id: 'cleaner', label: 'Cleaner' },
  { id: 'brighter', label: 'Brighter' },
  { id: 'face-larger', label: 'Face larger' },
  { id: 'contrast', label: 'More contrast' },
  { id: 'diff-bg', label: 'Different background' },
  { id: 'professional', label: 'More professional' },
  { id: 'negative-space', label: 'More negative space' },
  { id: 'similar', label: 'Generate similar' },
] as const;

const CHIP_PROMPTS: Record<string, string> = {
  'dramatic': 'Make this more dramatic with stronger lighting, higher contrast, and more impactful composition.',
  'cleaner': 'Clean up the composition, remove clutter, use simpler background, more minimalist design.',
  'brighter': 'Increase overall brightness, use lighter color palette, airy and luminous feel.',
  'face-larger': 'Make the face/central figure larger and more prominent in the frame, closer crop.',
  'contrast': 'Increase contrast significantly, deeper blacks, more saturated colors, punchier look.',
  'diff-bg': 'Change the background to something completely different while keeping the main subject.',
  'professional': 'Make this look more professional and polished, corporate-grade quality, refined aesthetic.',
  'negative-space': 'Add much more negative space, minimalist layout, subject smaller and off-center.',
  'similar': 'Generate a variation similar to this image, keeping the same style and composition.',
}

export interface ThumbnailRefinementProps {
  sourceImageUrl: string | null
  aspectRatio?: string
  disabled?: boolean
  onResults: (results: ThumbnailRefineResult[]) => void
  onError?: (error: string) => void
  muapiKey?: string
  quality?: string
  background?: string
  outputFormat?: string
  customSize?: string
}

export default function ThumbnailRefinement({
  sourceImageUrl,
  aspectRatio = '16:9',
  disabled = false,
  onResults,
  onError,
  quality = 'auto',
  background = 'auto',
  outputFormat = 'png',
  customSize,
}: ThumbnailRefinementProps) {
  const [refinementPrompt, setRefinementPrompt] = useState('')
  const [selectedChip, setSelectedChip] = useState<string | null>(null)
  const [refining, setRefining] = useState(false)
  const [refineError, setRefineError] = useState<string | null>(null)
  const [maskDataUrl, setMaskDataUrl] = useState<string | undefined>(undefined)
  const maskInputRef = useRef<HTMLInputElement>(null)

  const handleMaskUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const url = ev.target?.result as string
      setMaskDataUrl(url)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleRemoveMask = useCallback(() => {
    setMaskDataUrl(undefined)
    if (maskInputRef.current) maskInputRef.current.value = ''
  }, [])

  const handleChipClick = useCallback((chipId: string) => {
    setSelectedChip(prev => prev === chipId ? null : chipId)
    if (chipId !== selectedChip) {
      setRefinementPrompt(CHIP_PROMPTS[chipId] || '')
    }
  }, [selectedChip])

  const handleRefine = useCallback(async () => {
    if (!sourceImageUrl || !refinementPrompt.trim() || refining) return

    setRefining(true)
    setRefineError(null)

    try {
      const results = await refineThumbnail({
        imageUrl: sourceImageUrl,
        prompt: refinementPrompt.trim(),
        aspectRatio,
        n: 1,
        strength: selectedChip === 'similar' ? 0.3 : 0.5,
        quality: quality as any,
        background: background as any,
        outputFormat: outputFormat as any,
        customSize: customSize || undefined,
        maskDataUrl,
      })
      onResults(results)
      setSelectedChip(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Refinement failed'
      setRefineError(message)
      onError?.(message)
    } finally {
      setRefining(false)
    }
  }, [sourceImageUrl, refinementPrompt, aspectRatio, refining, selectedChip, onResults, onError, quality, background, outputFormat, customSize, maskDataUrl])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleRefine()
    }
  }

  if (!sourceImageUrl) {
    return (
      <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] text-white/20 text-xs text-center">
        <Wand2 size={16} className="mx-auto mb-2 opacity-50" />
        Generate a thumbnail first to enable refinement.
      </div>
    )
  }

  return (
    <div className="space-y-3 p-4 rounded-xl border border-white/8 bg-white/[0.02]" aria-live="polite">
      <div className="flex items-center gap-2">
        <RefreshCw size={13} className="text-[#22d3ee]" />
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">
          Refine thumbnail
        </p>
      </div>

      {/* Quick chips */}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quick refinement options">
        {QUICK_CHIPS.map(chip => {
          const isActive = selectedChip === chip.id
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => handleChipClick(chip.id)}
              disabled={disabled || refining}
              aria-pressed={isActive}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all disabled:opacity-40"
              style={{
                background: isActive ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.05)',
                color: isActive ? '#22d3ee' : 'rgba(255,255,255,0.5)',
                border: `1px solid ${isActive ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {chip.label}
            </button>
          )
        })}
      </div>

      {/* Mask upload */}
      <div className="space-y-2">
        <p className="text-[10px] font-medium text-white/40">Mask (optional)</p>
        {maskDataUrl ? (
          <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10">
            <img src={maskDataUrl} alt="Mask preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={handleRemoveMask}
              disabled={refining}
              className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 hover:bg-red-500 rounded-full flex items-center justify-center"
              aria-label="Remove mask"
            >
              <X size={10} className="text-white" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => maskInputRef.current?.click()}
            disabled={disabled || refining}
            className="flex items-center gap-2 w-full p-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-white/40 hover:border-[#22d3ee]/40 hover:text-[#22d3ee] transition-all disabled:opacity-40"
          >
            <Upload size={14} />
            <span className="text-[10px] font-medium">Upload mask PNG</span>
          </button>
        )}
        <input
          ref={maskInputRef}
          type="file"
          accept="image/png"
          onChange={handleMaskUpload}
          className="hidden"
          aria-hidden="true"
        />
        <p className="text-[9px] text-white/25">Mask must be same size as source image and contain an alpha channel.</p>
      </div>

      {/* Freeform refinement input */}
      <div className="relative">
        <textarea
          value={refinementPrompt}
          onChange={(e) => setRefinementPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what to change… e.g. 'swap the background for a city skyline at sunset'"
          rows={2}
          disabled={disabled || refining}
          className="w-full resize-none text-xs outline-none rounded-lg p-3 pr-10 transition-colors disabled:opacity-50"
          style={{ background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
          aria-label="Refinement prompt"
        />
        <button
          type="button"
          onClick={handleRefine}
          disabled={disabled || refining || !refinementPrompt.trim() || !sourceImageUrl}
          className="absolute bottom-2 right-2 p-1.5 rounded-lg transition-all disabled:opacity-30"
          style={{ background: 'rgba(34,211,238,0.15)' }}
          aria-label="Apply refinement"
          title="Apply refinement"
        >
          {refining
            ? <Loader2 size={13} className="animate-spin text-[#22d3ee]" />
            : <Wand2 size={13} className="text-[#22d3ee]" />
          }
        </button>
      </div>

      {refineError && (
        <div className="p-2 rounded-lg text-[11px] text-red-400" style={{ background: 'rgba(239,68,68,0.1)' }} role="alert">
          {refineError}
        </div>
      )}

      <p className="text-[10px] text-white/25">
        Uses image-to-image generation. Results replace the current selection.
      </p>
    </div>
  )
}
