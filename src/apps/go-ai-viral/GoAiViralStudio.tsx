'use client'
/**
 * GO-Viral Studio — Visual Prompt Feed Browser
 *
 * A continuously-refreshed public feed of AI image and video prompts discovered
 * from public X (Twitter) posts. Every record preserves the original author,
 * source post URL, preview media, and machine-readable metadata — curated by
 * ImgLume and discovered by ByRadar.
 *
 * https://github.com/Hanyuyu/visual-prompt-feed
 *
 * Features:
 *  - Browse the full prompt catalog organized by media type and category
 *  - Search by title, prompt text, or tags
 *  - Preview media assets (images + video posters)
 *  - View full prompt text with one-click copy for use in other studios
 *  - Jump to the original X post for source attribution
 *  - Filter by recommended model (gptimage, nanobanana, seedance, etc.)
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Search, Copy, ExternalLink, Heart,
  Grid, List, ChevronRight,
  Image as ImageIcon, Video, BookOpen,
  Repeat2, MessageCircle, Flame
} from 'lucide-react'
import { buttons, semantic, tabStyle, optionStyle, appWrapper, iconBadge } from '@/shared/styles/designTokens'
import type { PromptRecord, FeedStats } from '@/types/go-ai-viral/prompt'
import type { SeedancePrompt, SeedanceStats } from '@/types/go-ai-viral/seedance'
import { useDemoPersonalize } from '@/shared/personalization'
import { createViralHandoff, emitSendTo, TARGET_LABEL, VIRAL_TARGETS_BY_MEDIA, type StudioTarget, type ViralSourceMedia } from '@/shared/crossStudio'
import { StudioTargetPicker } from './StudioTargetPicker'

// ── Types ────────────────────────────────────────────────────────────────────

type MediaType = 'all' | 'image' | 'video'
type SortOption = 'newest' | 'oldest'
type StudioMode = 'feed' | 'video-prompts'

interface FeedResponse {
  data: PromptRecord[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  meta: {
    stats: FeedStats
    availableCategories: string[]
    availableModels: string[]
    fetchedAt: number
  }
}

function classNames(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

function getMediaTypeIcon(type: 'image' | 'video') {
  return type === 'video' ? Video : ImageIcon
}

function getModelDisplay(model: string): string {
  const map: Record<string, string> = {
    gptimage: 'GPT Image',
    nanobanana: 'Nano Banana',
    seedance: 'Seedance',
    grok: 'Grok',
    kling: 'Kling',
    midjourney: 'Midjourney',
    minimax: 'MiniMax',
    veo: 'Veo',
    ideogram: 'Ideogram',
    luma: 'Luma',
    runway: 'Runway',
    stability: 'Stable Diffusion',
    alibaba: 'Alibaba',
  }
   return map[model] || model
}

// ── PromptCard ────────────────────────────────────────────────────────────────

interface PromptCardProps {
  record: PromptRecord
  isSelected: boolean
  onSelect: (record: PromptRecord) => void
}

function PromptCard({ record, isSelected, onSelect }: PromptCardProps) {
  const [showPicker, setShowPicker] = useState(false)
  const MediaIcon = getMediaTypeIcon(record.mediaType)
  const primaryMedia =
    record.media.find((m) => m.role === 'result') || record.media[0]

  const handleOpenInStudio = () => {
    setShowPicker(true)
  }
  const { openPersonalize } = useDemoPersonalize()

  return (
    <>
      <button
        onClick={() => onSelect(record)}
        className={classNames(
          'group relative flex flex-col rounded-3xl border text-left transition-all duration-300 overflow-hidden',
          isSelected
            ? 'border-cyan-400/50 bg-cyan-400/[0.03]'
            : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
        )}
      >
      {/* Media preview */}
      <div className="relative">
        {primaryMedia ? (
          <div className="relative aspect-video overflow-hidden">
            <img
              src={primaryMedia.previewUrl}
              alt={primaryMedia.altText || record.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-white/5">
            <MediaIcon size={32} style={{ color: semantic.textMuted }} />
          </div>
        )}

        {/* Category badge - glass panel style */}
        <span className="absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90"
          style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}
        >
          {(record.categories || []).slice(0, 1).join(', ') || record.mediaType}
        </span>

        {/* Play affordance on hover */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-white/15 backdrop-blur">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>

        {/* Engagement overlay - bottom left */}
        {record.source?.engagement && (
          <div className="absolute bottom-2 left-2 flex gap-1">
            <div className="flex gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
              <Heart size={10} className="fill-white/30 text-white" />
              <span>{formatNumber(record.source.engagement.likes)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-snug text-white line-clamp-2">{record.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-white/55">
          {record.prompt}
        </p>

        <div className="mt-auto flex flex-col gap-2 pt-5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSelect(record); }}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
          >
            View Prompt
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              openPersonalize({ source: record, trigger: e.currentTarget })
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
          >
            Personalize
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              openPersonalize({ source: record, trigger: e.currentTarget })
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
          >
            Personalize
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleOpenInStudio()
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 px-4 py-2.5 text-sm font-bold text-black shadow-glow transition hover:scale-[1.01]"
          >
            Open in Studio
          </button>
          {record.source?.url && (
            <a
              href={record.source.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              Open Source
            </a>
          )}
        </div>
      </div>
    </button>
    {showPicker && (
      <StudioTargetPicker
        mediaType={record.mediaType || 'image'}
        onClose={() => setShowPicker(false)}
        record={{
          title: record.title,
          prompt: record.prompt,
          fullPrompt: record.prompt,
          mediaType: record.mediaType,
          media: record.media,
          outputUrl: null,
          detailHref: record.source?.url || null,
        }}
        onSelectTarget={(target, recordData) => {
          const handoff = createViralHandoff({
            target,
            record: recordData,
          })
          try {
            localStorage.setItem('storyboard_to_studio', JSON.stringify(handoff))
          } catch {
            // ignore
          }
          emitSendTo(target)
        }}
      />
    )}
    </>
  )
}

// ── VideoPromptCard ───────────────────────────────────────────────────────────

interface VideoPromptCardProps {
  record: SeedancePrompt
  onSelect: (record: SeedancePrompt) => void
}

function VideoPromptCard({ record, onSelect }: VideoPromptCardProps) {
  const [showPicker, setShowPicker] = useState(false)
  const primaryMedia = record.outputUrl
    ? { previewUrl: record.outputUrl, altText: record.prompt }
    : null

  const handleOpenInStudio = () => {
    setShowPicker(true)
  }
  const { openPersonalize } = useDemoPersonalize()

  return (
    <>
      <button
        onClick={() => onSelect(record)}
        className={classNames(
          'group relative flex flex-col rounded-3xl border text-left transition-all duration-300 overflow-hidden',
          'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
        )}
      >
      {/* Video preview */}
      <div className="relative">
        {primaryMedia ? (
          <div className="relative aspect-video overflow-hidden bg-black">
            <video
              src={primaryMedia.previewUrl}
              className="h-full w-full object-cover"
              preload="metadata"
              playsInline
              muted
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-white/5">
            <Video size={32} style={{ color: semantic.textMuted }} />
          </div>
        )}

        {/* Category badge - glass panel style */}
        <span className="absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90"
          style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}
        >
          {(record.categories || []).slice(0, 1).join(', ') || record.sourceLanguage?.toUpperCase() || 'VIDEO'}
        </span>

        {/* Play affordance on hover */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-white/15 backdrop-blur">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>

        {/* Engagement overlay - bottom left */}
        {record.engagement && record.engagement.likes > 0 && (
          <div className="absolute bottom-2 left-2 flex gap-1">
            <div className="flex gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
              <Heart size={10} className="fill-white/30 text-white" />
              <span>{formatNumber(record.engagement.likes)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-snug text-white line-clamp-2">{record.prompt}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-white/55">
          {record.fullPrompt}
        </p>

        <div className="mt-auto flex flex-col gap-2 pt-5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSelect(record); }}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
          >
            View Prompt
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              openPersonalize({ source: record, trigger: e.currentTarget })
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
          >
            Personalize
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              openPersonalize({ source: record, trigger: e.currentTarget })
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
          >
            Personalize
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleOpenInStudio()
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 px-4 py-2.5 text-sm font-bold text-black shadow-glow transition hover:scale-[1.01]"
          >
            Open in Studio
          </button>
          {record.outputUrl && (
            <a
              href={record.outputUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              Play Video
            </a>
          )}
        </div>
      </div>
    </button>
    {showPicker && (
      <StudioTargetPicker
        mediaType="video"
        onClose={() => setShowPicker(false)}
        record={{
          title: record.prompt,
          prompt: record.prompt,
          fullPrompt: record.fullPrompt,
          mediaType: 'video',
          outputUrl: record.outputUrl,
          detailHref: record.detailHref,
        }}
        onSelectTarget={(target, recordData) => {
          const handoff = createViralHandoff({
            target,
            record: recordData,
          })
          try {
            localStorage.setItem('storyboard_to_studio', JSON.stringify(handoff))
          } catch {
            // ignore
          }
          emitSendTo(target)
        }}
      />
    )}
    </>
  )
}

// ── VideoPromptModal ──────────────────────────────────────────────────────────

interface VideoPromptModalProps {
  record: SeedancePrompt
  onClose: () => void
}

function VideoPromptModal({ record, onClose }: VideoPromptModalProps) {
  const [showPicker, setShowPicker] = useState(false)

  const handleOpenInStudio = () => {
    setShowPicker(true)
  }
  const { openPersonalize } = useDemoPersonalize()

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-prompt-title"
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
        style={{ background: 'rgba(0,0,0,0.8)' }}
        onClick={onClose}
      >
      <div
        className="relative mx-4 my-8 w-full max-w-4xl rounded-2xl border border-white/10"
        style={{ background: 'var(--bg-panel)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ ...iconBadge }}>
              <Video size={14} className="text-black" />
            </div>
            <h2 className="text-lg font-bold text-white">Video Prompt</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close video prompt details"
            className="rounded-lg p-1.5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          {record.outputUrl && (
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
              <video
                src={record.outputUrl}
                controls
                className="h-full w-full"
                preload="metadata"
              />
            </div>
          )}

          <div>
            <h1 id="video-prompt-title" className="text-xl font-bold text-white">{record.prompt}</h1>
            <p className="mt-2 text-sm text-white/60">{record.fullPrompt}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: semantic.textMuted }}>
            <span className="capitalize">Language: {record.sourceLanguage || 'unknown'}</span>
            <span>•</span>
            <span>Slug: {record.slug}</span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleOpenInStudio}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold"
              style={buttons.primary}
            >
              Open in Studio
            </button>
            {record.detailHref && (
              <a
                href={record.detailHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold"
                style={buttons.primary}
              >
                <ExternalLink size={14} />
                View Details
              </a>
            )}
            {record.outputUrl && (
              <a
                href={record.outputUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold"
                style={buttons.ghost}
              >
                Open Video
              </a>
            )}
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(record.fullPrompt || record.prompt)
              }}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold"
              style={buttons.ghost}
            >
              <Copy size={14} />
              Copy Prompt
            </button>
          </div>
        </div>
      </div>
    </div>
    {showPicker && (
      <StudioTargetPicker
        mediaType="video"
        onClose={() => setShowPicker(false)}
        record={{
          title: record.prompt,
          prompt: record.prompt,
          fullPrompt: record.fullPrompt,
          mediaType: 'video',
          outputUrl: record.outputUrl,
          detailHref: record.detailHref,
        }}
        onSelectTarget={(target, recordData) => {
          const handoff = createViralHandoff({
            target,
            record: recordData,
          })
          try {
            localStorage.setItem('storyboard_to_studio', JSON.stringify(handoff))
          } catch {
            // ignore
          }
          emitSendTo(target)
        }}
      />
    )}
    </>
  )
}

// ── PromptDetailModal ─────────────────────────────────────────────────────────

interface PromptDetailModalProps {
  record: PromptRecord
  onClose: () => void
}

function PromptDetailModal({ record, onClose }: PromptDetailModalProps) {
  const [copied, setCopied] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const handleOpenInStudio = () => {
    setShowPicker(true)
  }
  const { openPersonalize } = useDemoPersonalize()

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null
    const modal = modalRef.current
    if (!modal) return
    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (first) first.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      if (!first || !last) return
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    return () => {
      previousFocusRef.current?.focus()
    }
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(record.prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select text
      const el = document.getElementById('prompt-text')
      if (el) {
        const range = document.createRange()
        range.selectNode(el)
        window.getSelection()?.removeAllRanges()
        window.getSelection()?.addRange(range)
        document.execCommand('copy')
        window.getSelection()?.removeAllRanges()
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  const primaryMedia = record.media.find((m) => m.role === 'result') || record.media[0]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative mx-4 my-8 w-full max-w-4xl rounded-2xl border border-white/10"
        style={{ background: 'var(--bg-panel)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ ...iconBadge }}>
              <BookOpen size={14} className="text-black" />
            </div>
            <h2 className="text-lg font-bold text-white">Prompt Details</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close prompt details"
            className="rounded-lg p-1.5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-6">
             {/* Title */}
             <h1 id="prompt-detail-title" className="text-xl font-bold text-white">{record.title}</h1>

            {/* Media preview */}
            {primaryMedia && (
              <div className="rounded-xl overflow-hidden border border-white/10">
                <img
                  src={primaryMedia.previewUrl}
                  alt={primaryMedia.altText || record.title}
                  className="w-full object-contain"
                />
              </div>
            )}

            {/* All media assets */}
            {record.media.length > 1 && (
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: semantic.textLabel }}>
                  All Media Assets ({record.media.length})
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {record.media.map((m, i) => (
                    <div
                      key={i}
                      className="relative aspect-square rounded-lg overflow-hidden border border-white/10"
                    >
                      <img
                        src={m.previewUrl}
                        alt={m.altText || `Asset ${i + 1}`}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt text */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium" style={{ color: semantic.textLabel }}>
                  Prompt Text
                </p>
                <div className="flex items-center gap-2">
                  {copied && <span className="text-xs text-cyan-300">Copied!</span>}
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Copy size={12} /> Copy
                  </button>
                </div>
              </div>
              <div
                id="prompt-text"
                className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm leading-relaxed whitespace-pre-wrap break-words"
                style={{ color: semantic.textPrimary }}
              >
                {record.prompt}
              </div>
            </div>

            {/* Source attribution */}
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="mb-2 text-xs font-medium" style={{ color: semantic.textLabel }}>
                Original Source
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 text-xs font-black text-black">
                  {record.source?.author?.handle?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div className="font-medium text-white">
                    {record.source?.author?.name || record.source?.author?.handle || 'Unknown author'}
                  </div>
                  <div className="text-sm" style={{ color: semantic.textMuted }}>
                    @{record.source?.author?.handle || 'unknown'}
                  </div>
                </div>
                <a
                  href={record.source?.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ExternalLink size={12} />
                  View on X
                </a>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs font-medium mb-1" style={{ color: semantic.textLabel }}>Recommended Model</p>
                <p className="text-sm font-semibold text-white">{getModelDisplay(record.recommendedModel)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs font-medium mb-1" style={{ color: semantic.textLabel }}>Media Type</p>
                <p className="text-sm font-semibold text-white capitalize">{record.mediaType}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs font-medium mb-1" style={{ color: semantic.textLabel }}>Categories</p>
                <div className="flex flex-wrap gap-1">
                  {(record.categories || []).map((cat) => (
                    <span
                      key={cat}
                      className="rounded-full px-2 py-0.5 text-xs"
                      style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--color-primary)' }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs font-medium mb-1" style={{ color: semantic.textLabel }}>Language</p>
                <p className="text-sm font-semibold text-white">
                  {record.language || 'Unknown'}
                </p>
              </div>
              {record.source?.engagement && (
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-xs font-medium mb-1" style={{ color: semantic.textLabel }}>Engagement</p>
                  <div className="flex gap-3 text-sm">
                    <span>♥ {formatNumber(record.source.engagement.likes)}</span>
                    <span>↻ {formatNumber(record.source.engagement.reposts)}</span>
                    <span>💬 {formatNumber(record.source.engagement.replies)}</span>
                  </div>
                </div>
              )}
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs font-medium mb-1" style={{ color: semantic.textLabel }}>Curation</p>
                <p className="text-sm" style={{ color: semantic.textMuted }}>
                  Curated by {record.curation?.creator || 'ImgLume'} ·{' '}
                  <a
                    href={record.curation?.recordUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-300 hover:text-cyan-200"
                  >
                    View record
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-white/10 p-4 flex gap-3">
          <button
            type="button"
            onClick={handleOpenInStudio}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            style={buttons.primary}
          >
            Open in Studio
          </button>
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            style={buttons.primary}
          >
            <Copy size={14} /> {copied ? 'Copied!' : 'Copy Prompt'}
          </button>
          <a
            href={record.source?.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            style={buttons.ghost}
          >
            <ExternalLink size={14} /> Open on X
          </a>
        </div>
      </div>
    {showPicker && (
      <StudioTargetPicker
        mediaType={record.mediaType || 'image'}
        onClose={() => setShowPicker(false)}
        record={{
          title: record.title,
          prompt: record.prompt,
          fullPrompt: record.prompt,
          mediaType: record.mediaType,
          media: record.media,
          outputUrl: null,
          detailHref: record.source?.url || null,
        }}
        onSelectTarget={(target, recordData) => {
          const handoff = createViralHandoff({
            target,
            record: recordData,
          })
          try {
            localStorage.setItem('storyboard_to_studio', JSON.stringify(handoff))
          } catch {
            // ignore
          }
          emitSendTo(target)
        }}
      />
    )}
    </div>
  )
}

// ── Main Studio ─────────────────────────────────────────────────────────────────

export default function GoAiViralStudio({ apiKey }: { apiKey?: string }) {
  void apiKey // Reserved for future generation features; feed browsing needs no key.
  // Data
  const [records, setRecords] = useState<PromptRecord[]>([])
  const [stats, setStats] = useState<FeedStats | null>(null)
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [mediaType, setMediaType] = useState<MediaType>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [search, setSearch] = useState<string>('')

  // Pagination
  const [page, setPage] = useState(1)
  const pageSize = 24
  const [isPageLoading, setIsPageLoading] = useState(false)

  // View / selection
  const [selectedRecord, setSelectedRecord] = useState<PromptRecord | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Sort
  const [sort, setSort] = useState<SortOption>('newest')

  // Studio mode: 'feed' or 'video-prompts'
  const [studioMode, setStudioMode] = useState<StudioMode>('feed')

  // Video prompts state
  const [videoRecords, setVideoRecords] = useState<SeedancePrompt[]>([])
  const [videoStats, setVideoStats] = useState<SeedanceStats | null>(null)
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([])
  const [videoPage, setVideoPage] = useState(1)
  const videoPageSize = 24
  const [isVideoPageLoading, setIsVideoPageLoading] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [selectedVideoRecord, setSelectedVideoRecord] = useState<SeedancePrompt | null>(null)
  const [videoLanguage, setVideoLanguage] = useState('')
  const [videoOnly, setVideoOnly] = useState<'video-only' | 'video-and-prompt' | 'all'>('video-and-prompt')

  // Abort/race-protection refs for fetchFeed
  const fetchIdRef = useRef(0)
  const controllerRef = useRef<AbortController | null>(null)

  // Abort/race-protection refs for video feed
  const videoFetchIdRef = useRef(0)
  const videoControllerRef = useRef<AbortController | null>(null)

  // Debounced search
  const [searchInput, setSearchInput] = useState('')
  const [videoSearchInput, setVideoSearchInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      if (studioMode === 'video-prompts') {
        // videoSearchInput is used directly by fetchVideoFeed
      } else {
        setSearch(searchInput)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchInput, videoSearchInput, studioMode])

  const fetchFeed = useCallback(async (pageNum = 1) => {
    const isInitial = pageNum === 1
    if (isInitial) setIsLoading(true)
    else setIsPageLoading(true)
    setError(null)

    // Abort any in-flight request before starting a new one
    if (controllerRef.current) {
      controllerRef.current.abort()
    }
    const controller = new AbortController()
    controllerRef.current = controller
    const currentId = ++fetchIdRef.current

    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        pageSize: String(pageSize),
        mediaType,
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedModel && { model: selectedModel }),
        ...(search && { search }),
        sort,
      })
      const res = await fetch(`/api/go-ai-viral/prompts?${params}`, {
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(`Failed to fetch feed: ${res.status}`)
      // Guard: only apply results from the latest request
      if (controllerRef.current !== controller) return
      if (currentId !== fetchIdRef.current) return
      const json: FeedResponse = await res.json()
      setRecords(json.data)
      setStats(json.meta?.stats || null)
      setAvailableCategories(json.meta?.availableCategories || [])
      setAvailableModels(json.meta?.availableModels || [])
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return
      const errMsg = err instanceof Error ? err.message : 'Failed to load the prompt feed'
      setError(errMsg)
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null
      }
      if (currentId === fetchIdRef.current) {
        if (isInitial) setIsLoading(false)
        else setIsPageLoading(false)
      }
    }
  }, [mediaType, selectedCategory, selectedModel, search, sort])

  // Fetch when filters change
  useEffect(() => {
    setPage(1)
    fetchFeed(1)
  }, [mediaType, selectedCategory, selectedModel, search, sort, fetchFeed])

  // Fetch when page changes
  useEffect(() => {
    if (page !== 1) fetchFeed(page)
  }, [page, fetchFeed])

  const fetchVideoFeed = useCallback(async (pageNum = 1) => {
    const isInitial = pageNum === 1
    if (isInitial) setIsLoading(true)
    else setIsVideoPageLoading(true)
    setVideoError(null)

    if (videoControllerRef.current) {
      videoControllerRef.current.abort()
    }
    const controller = new AbortController()
    videoControllerRef.current = controller
    const currentId = ++videoFetchIdRef.current

    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        pageSize: String(videoPageSize),
        ...(videoSearchInput && { search: videoSearchInput }),
        ...(videoLanguage && { language: videoLanguage }),
        ...(videoOnly === 'video-only' || videoOnly === 'video-and-prompt' ? { hasVideo: 'true' } : {}),
        ...(videoOnly === 'video-and-prompt' ? { hasPrompt: 'true' } : {}),
      })
      const res = await fetch(`/api/go-ai-viral/seedance?${params}`, {
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(`Failed to fetch video prompts: ${res.status}`)
      if (videoControllerRef.current !== controller) return
      if (currentId !== videoFetchIdRef.current) return
      const json: {
        data: SeedancePrompt[]
        pagination: { page: number; pageSize: number; total: number; totalPages: number }
        meta: { stats: SeedanceStats; availableLanguages: string[]; fetchedAt: number }
      } = await res.json()
      setVideoRecords(json.data)
      setVideoStats(json.meta?.stats || null)
      setAvailableLanguages(json.meta?.availableLanguages || [])
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return
      const errMsg = err instanceof Error ? err.message : 'Failed to load video prompts'
      setVideoError(errMsg)
    } finally {
      if (videoControllerRef.current === controller) {
        videoControllerRef.current = null
      }
      if (currentId === videoFetchIdRef.current) {
        if (isInitial) setIsLoading(false)
        else setIsVideoPageLoading(false)
      }
    }
  }, [videoSearchInput, videoLanguage, videoOnly])

  useEffect(() => {
    if (studioMode !== 'video-prompts') return
    setVideoPage(1)
    fetchVideoFeed(1)
  }, [studioMode, videoSearchInput, videoLanguage, videoOnly, fetchVideoFeed])

  useEffect(() => {
    if (studioMode !== 'video-prompts' || videoPage === 1) return
    fetchVideoFeed(videoPage)
  }, [studioMode, videoPage, fetchVideoFeed])

  // ── Sidebar category data ────────────────────────────────────────────────────
  const categoryCounts = useMemo(() => {
    if (!stats?.categories) return {}
    return stats.categories
  }, [stats?.categories])

  const modelCounts = useMemo(() => {
    if (!stats?.recommendedModels) return {}
    return stats.recommendedModels
  }, [stats?.recommendedModels])

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col" style={appWrapper}>
      {/* Sub-header */}
      <div
        className="flex-shrink-0 h-12 flex items-center justify-between px-6 z-10"
        style={{
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(0,0,0,0.2)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ ...iconBadge }}
          >
            <Video size={13} className="text-black" />
          </div>
          <span className="text-sm font-semibold tracking-tight">GO-Viral</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--color-primary)' }}
          >
            {stats?.total || '—'} prompts
          </span>
        </div>

        {/* Media type tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <button
            onClick={() => setStudioMode('feed')}
            className="relative px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5"
            style={tabStyle(studioMode === 'feed')}
            aria-pressed={studioMode === 'feed'}
          >
            <Grid size={10} />
            Feed
          </button>
          <button
            onClick={() => setStudioMode('video-prompts')}
            className="relative px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5"
            style={tabStyle(studioMode === 'video-prompts')}
            aria-pressed={studioMode === 'video-prompts'}
          >
            <Video size={10} />
            Video Prompts
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* ── Sidebar (Side Menu) ── */}
        <aside className="flex-shrink-0 w-64 border-r border-white/5 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-5">
             {/* Search */}
             <div>
               <p className="text-xs font-medium mb-2" style={{ color: semantic.textLabel }}>
                 Search
               </p>
               <div className="relative">
                 <Search
                   size={14}
                   className="absolute left-3 top-2.5"
                   style={{ color: semantic.textMuted }}
                 />
                 <input
                   type="text"
                   value={studioMode === 'video-prompts' ? videoSearchInput : searchInput}
                   onChange={(e) => {
                     if (studioMode === 'video-prompts') {
                       setVideoSearchInput(e.target.value)
                     } else {
                       setSearchInput(e.target.value)
                     }
                   }}
                   placeholder={studioMode === 'video-prompts' ? 'Search video prompts...' : 'Search prompts, tags...'}
                   aria-label="Search prompts"
                   className="w-full rounded-xl bg-white/5 border border-white/10 px-9 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-400/50 transition-colors"
                 />
               </div>
             </div>

              {studioMode === 'video-prompts' && (
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: semantic.textLabel }}>
                    Availability
                  </p>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => { setVideoOnly('video-and-prompt'); setVideoPage(1) }}
                      className="text-left px-3 py-2 rounded-lg text-sm transition-all"
                      style={optionStyle(videoOnly === 'video-and-prompt')}
                    >
                      With video + prompt
                    </button>
                    <button
                      onClick={() => { setVideoOnly('video-only'); setVideoPage(1) }}
                      className="text-left px-3 py-2 rounded-lg text-sm transition-all"
                      style={optionStyle(videoOnly === 'video-only')}
                    >
                      With video only
                    </button>
                    <button
                      onClick={() => { setVideoOnly('all'); setVideoPage(1) }}
                      className="text-left px-3 py-2 rounded-lg text-sm transition-all"
                      style={optionStyle(videoOnly === 'all')}
                    >
                      All prompts
                    </button>
                  </div>
                </div>
              )}

            {/* Sort */}
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: semantic.textLabel }}>
                Sort By
              </p>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setSort('newest')}
                  className="text-left px-3 py-2 rounded-lg text-sm transition-all"
                  style={optionStyle(sort === 'newest')}
                >
                  Newest first
                </button>
                <button
                  onClick={() => setSort('oldest')}
                  className="text-left px-3 py-2 rounded-lg text-sm transition-all"
                  style={optionStyle(sort === 'oldest')}
                >
                  Oldest first
                </button>
              </div>
            </div>

            {/* Categories */}
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: semantic.textLabel }}>
                Categories
              </p>
              <div className="flex flex-col gap-1 max-h-80 overflow-y-auto custom-scrollbar">
                <button
                  onClick={() => { setSelectedCategory(''); setPage(1) }}
                  className="text-left px-3 py-2 rounded-lg text-sm transition-all"
                  style={optionStyle(selectedCategory === '')}
                >
                  All categories
                </button>
                {availableCategories.map((cat) => {
                  const count = categoryCounts[cat]?.total || 0
                  return (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); setPage(1) }}
                      className="flex items-center justify-between text-left px-3 py-2 rounded-lg text-sm transition-all"
                      style={optionStyle(selectedCategory === cat)}
                    >
                      <span className="capitalize">{cat.replace(/-/g, ' ')}</span>
                      <span
                        className="text-xs px-1.5 py-0.25 rounded-full"
                        style={{
                          background: selectedCategory === cat
                            ? 'rgba(34,211,238,0.2)'
                            : 'rgba(255,255,255,0.05)',
                          color: selectedCategory === cat ? 'var(--color-primary)' : semantic.textMuted,
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Recommended models */}
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: semantic.textLabel }}>
                Recommended Model
              </p>
              <div className="flex flex-col gap-1 max-h-64 overflow-y-auto custom-scrollbar">
                <button
                  onClick={() => { setSelectedModel(''); setPage(1) }}
                  className="text-left px-3 py-2 rounded-lg text-sm transition-all"
                  style={optionStyle(selectedModel === '')}
                >
                  All models
                </button>
                {availableModels.map((model) => {
                  const count = modelCounts[model] || 0
                  return (
                    <button
                      key={model}
                      onClick={() => { setSelectedModel(model); setPage(1) }}
                      className="flex items-center justify-between text-left px-3 py-2 rounded-lg text-sm transition-all"
                      style={optionStyle(selectedModel === model)}
                    >
                      <span>{getModelDisplay(model)}</span>
                      <span
                        className="text-xs px-1.5 py-0.25 rounded-full"
                        style={{
                          background: selectedModel === model
                            ? 'rgba(34,211,238,0.2)'
                            : 'rgba(255,255,255,0.05)',
                          color: selectedModel === model ? 'var(--color-primary)' : semantic.textMuted,
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

             {/* View mode */}
             <div>
               <p className="text-xs font-medium mb-2" style={{ color: semantic.textLabel }}>
                 View
               </p>
               <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                 <button
                   onClick={() => setViewMode('grid')}
                   className="rounded-md p-1.5 text-xs transition-all"
                   style={optionStyle(viewMode === 'grid')}
                   aria-label="Grid view"
                   title="Grid view"
                 >
                   <Grid size={14} />
                 </button>
                 <button
                   onClick={() => setViewMode('list')}
                   className="rounded-md p-1.5 text-xs transition-all"
                   style={optionStyle(viewMode === 'list')}
                   aria-label="List view"
                   title="List view"
                 >
                   <List size={14} />
                 </button>
               </div>
             </div>

             {studioMode === 'video-prompts' && (
               <div>
                 <p className="text-xs font-medium mb-2" style={{ color: semantic.textLabel }}>
                   Source Language
                 </p>
                 <div className="flex flex-col gap-1 max-h-64 overflow-y-auto custom-scrollbar">
                   <button
                     onClick={() => { setVideoLanguage(''); setVideoPage(1) }}
                     className="text-left px-3 py-2 rounded-lg text-sm transition-all"
                     style={optionStyle(videoLanguage === '')}
                   >
                     All languages
                   </button>
                   {availableLanguages.map((lang) => (
                     <button
                       key={lang}
                       onClick={() => { setVideoLanguage(lang); setVideoPage(1) }}
                       className="text-left px-3 py-2 rounded-lg text-sm transition-all capitalize"
                       style={optionStyle(videoLanguage === lang)}
                     >
                       {lang}
                     </button>
                   ))}
                 </div>
               </div>
             )}
           </div>
         </aside>

        {/* ── Main Feed ── */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar relative">
          {(studioMode === 'feed' ? isPageLoading : isVideoPageLoading) && (studioMode === 'feed' ? page : videoPage) > 1 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            </div>
          )}
          {isLoading && (studioMode === 'feed' ? page : videoPage) === 1 ? (
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: pageSize }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-video rounded-xl border border-white/10 bg-white/[0.02] animate-pulse"
                  />
                ))}
              </div>
            </div>
          ) : studioMode === 'feed' && error && records.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-red-400">{error}</p>
              <button
                onClick={() => fetchFeed(1)}
                className="mt-4 rounded-xl px-4 py-2 text-sm font-semibold"
                style={buttons.primary}
              >
                Retry
              </button>
            </div>
          ) : studioMode === 'feed' && records.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-white/50 text-sm">No prompts match your current filters.</p>
              <button
                onClick={() => {
                  setSearch('')
                  setSearchInput('')
                  setSelectedCategory('')
                  setSelectedModel('')
                  setMediaType('all')
                  setSort('newest')
                }}
                className="mt-4 rounded-xl px-4 py-2 text-sm font-semibold"
                style={buttons.primary}
              >
                Clear all filters
              </button>
            </div>
          ) : studioMode === 'video-prompts' && videoError && videoRecords.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-red-400">{videoError}</p>
              <button
                onClick={() => fetchVideoFeed(1)}
                className="mt-4 rounded-xl px-4 py-2 text-sm font-semibold"
                style={buttons.primary}
              >
                Retry
              </button>
            </div>
          ) : studioMode === 'video-prompts' && videoRecords.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-white/50 text-sm">No video prompts match your current filters.</p>
               <button
                  onClick={() => {
                    setVideoSearchInput('')
                    setVideoLanguage('')
                    setVideoOnly('video-and-prompt')
                  }}
                 className="mt-4 rounded-xl px-4 py-2 text-sm font-semibold"
                 style={buttons.primary}
               >
                 Clear all filters
               </button>
            </div>
          ) : (
            <div className="p-6">
              {studioMode === 'feed' ? (
                viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {records.map((record) => (
                      <PromptCard
                        key={record.id}
                        record={record}
                        isSelected={selectedRecord?.id === record.id}
                        onSelect={setSelectedRecord}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {records.map((record) => (
                      <button
                        key={record.id}
                        onClick={() => setSelectedRecord(record)}
                        className={classNames(
                          'w-full text-left flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all',
                          selectedRecord?.id === record.id
                            ? 'border-cyan-400/50 bg-cyan-400/[0.03]'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                        )}
                      >
                         <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg">
                           {(() => {
                             const primaryMedia =
                               record.media.find((m) => m.role === 'result') || record.media[0]
                             return primaryMedia ? (
                               <img
                                 src={primaryMedia.previewUrl}
                                 alt={record.title}
                                 loading="lazy"
                                 className="h-full w-full object-cover"
                               />
                             ) : (
                               <div className="flex h-full w-full items-center justify-center">
                                 <Video size={16} style={{ color: semantic.textMuted }} />
                               </div>
                             )
                           })()}
                         </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-white line-clamp-1">{record.title}</h3>
                          <p className="text-xs text-white/40 line-clamp-1">
                            Prompt: {record.prompt.slice(0, 80)}
                            {record.prompt.length > 80 && '...'}
                          </p>
                           <div className="mt-1 flex items-center gap-3 text-xs" style={{ color: semantic.textMuted }}>
                              <span>@{record.source?.author?.handle}</span>
                              <span>•</span>
                              <span>{formatDate(record.source?.publishedAt)}</span>
                            </div>
                            {record.source?.engagement && (
                              <div className="mt-1 flex items-center gap-3 text-[10px]" style={{ color: semantic.textMuted }}>
                                <span className="flex items-center gap-1">
                                  <Heart size={10} className="fill-white/30 text-white" />
                                  {formatNumber(record.source.engagement.likes)}
                                </span>
                                {record.source.engagement.reposts ? (
                                  <span className="flex items-center gap-1">
                                    <Repeat2 size={10} />
                                    {formatNumber(record.source.engagement.reposts)}
                                  </span>
                                ) : null}
                                {record.source.engagement.replies ? (
                                  <span className="flex items-center gap-1">
                                    <MessageCircle size={10} />
                                    {formatNumber(record.source.engagement.replies)}
                                  </span>
                                ) : null}
                                {record.source.engagement.likes != null && record.source.engagement.likes >= 50 && (
                                  <span className="flex items-center gap-1 text-red-400">
                                    <Flame size={10} />
                                    Viral
                                  </span>
                                )}
                              </div>
                            )}
                        </div>
                        <ChevronRight size={14} style={{ color: semantic.textMuted }} />
                      </button>
                    ))}
                  </div>
                )
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {videoRecords.map((record) => (
                    <VideoPromptCard
                      key={record.slug}
                      record={record}
                      onSelect={setSelectedVideoRecord}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {(studioMode === 'feed' ? records.length : videoRecords.length) > 0 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-xs" style={{ color: semantic.textMuted }}>
                    {studioMode === 'feed'
                      ? `Page ${page} of ${Math.ceil((stats?.total || 0) / pageSize)} · ${stats?.total || 0} total prompts`
                      : `Page ${videoPage} of ${Math.ceil((videoStats?.total || 0) / videoPageSize)} · ${videoStats?.total || 0} video prompts`}
                  </p>
                  <div className="flex gap-2">
                     <button
                       onClick={() => (studioMode === 'feed' ? setPage(p => Math.max(1, p - 1)) : setVideoPage(p => Math.max(1, p - 1)))}
                       disabled={(() => {
                         if (studioMode === 'feed') return page <= 1 || isLoading || isPageLoading
                         return videoPage <= 1 || isLoading || isVideoPageLoading
                       })()}
                       className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50"
                       style={buttons.ghost}
                     >
                       Previous
                     </button>
                     <button
                       onClick={() => (studioMode === 'feed' ? setPage(p => p + 1) : setVideoPage(p => p + 1))}
                       disabled={(() => {
                         if (studioMode === 'feed') return page >= Math.ceil((stats?.total || 0) / pageSize) || isLoading || isPageLoading
                         return videoPage >= Math.ceil((videoStats?.total || 0) / videoPageSize) || isLoading || isVideoPageLoading
                       })()}
                       className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50"
                       style={buttons.ghost}
                     >
                       Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Prompt Detail Modal */}
      {selectedRecord && (
        <PromptDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      )}

      {/* Video Prompt Modal */}
      {selectedVideoRecord && (
        <VideoPromptModal record={selectedVideoRecord} onClose={() => setSelectedVideoRecord(null)} />
      )}
    </div>
  )
}
