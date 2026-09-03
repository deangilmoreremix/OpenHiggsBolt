/**
 * PersonalizationModal
 *
 * Context-driven modal for the personalization workflow.
 */

'use client'

import {
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react'
import {
  X,
  Upload,
  Trash2,
  Copy,
  Download,
  Sparkles,
  ChevronDown,
  RefreshCw,
  Loader2,
  Image,
  Video,
  FileText,
  User,
  Building2,
  Users,
  Check,
  AlertTriangle,
  Share2,
  Save,
} from 'lucide-react'
import { useDemoPersonalize } from './DemoPersonalizeProvider'
import type { PersonalizationSource, PersonalizationAsset } from './types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function classNames(...classes: (string | boolean | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

const VIDEO_MODES = [
  { key: 'face_only', label: 'FACE ONLY', description: 'Replace only the face while keeping the body, movement, background, and timing.' },
  { key: 'full_body', label: 'FULL PRESENTER', description: 'Replace the presenter with the uploaded person while preserving movement and performance.' },
  { key: 'recreate', label: 'RECREATE FOR CLIENT', description: 'Use the original creative concept with the personalized prompt and client assets to generate a new client-specific version.' },
  { key: 'complete', label: 'COMPLETE PERSONALIZATION', description: 'Personalize the prompt, presenter, branding, logo, and CTA using AI generation and exact overlays.' },
] as const

const IMAGE_MODES = [
  { key: 'keep_design', label: 'KEEP THIS DESIGN', description: 'Use the original image as the visual base.' },
  { key: 'replace_face', label: 'REPLACE FACE', description: 'Keep the design and replace the face.' },
  { key: 'replace_person', label: 'REPLACE PERSON', description: 'Replace or recreate the person while preserving the composition.' },
  { key: 'recreate', label: 'RECREATE FOR CLIENT', description: 'Use the original concept and personalized prompt for a fresh client-specific image.' },
  { key: 'complete', label: 'COMPLETE PERSONALIZATION', description: 'Use client identity, products, brand references, logo, and exact text/logo overlays.' },
] as const

const OUTPUT_OPTIONS_VIDEO = [
  { key: 'prompt', label: 'Prompt', icon: FileText },
  { key: 'video', label: 'Video', icon: Video },
  { key: 'everything', label: 'Everything', icon: Sparkles },
] as const

const OUTPUT_OPTIONS_IMAGE = [
  { key: 'prompt', label: 'Prompt', icon: FileText },
  { key: 'image', label: 'Image', icon: Image },
  { key: 'everything', label: 'Everything', icon: Sparkles },
] as const

const OUTPUT_OPTIONS_PROMPT = [
  { key: 'prompt', label: 'Prompt', icon: FileText },
] as const

// ── Focus trap ───────────────────────────────────────────────────────────────

function useFocusTrap(isActive: boolean, containerRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelector)
    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      if (focusableElements.length === 0) {
        e.preventDefault()
        return
      }
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable?.focus()
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTab)
    firstFocusable?.focus()

    return () => container.removeEventListener('keydown', handleTab)
  }, [isActive, containerRef])
}

// ── Asset card component ─────────────────────────────────────────────────────

function AssetCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="mb-2">
        <p className="text-xs font-semibold text-white">{title}</p>
        {description && <p className="text-[11px] text-white/40">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function AssetPreview({
  asset,
  onRemove,
  onSetPrimary,
  onRetry,
  isPrimary,
  primaryLabel,
}: {
  asset: PersonalizationAsset
  onRemove?: () => void
  onSetPrimary?: () => void
  onRetry?: () => void
  isPrimary?: boolean
  primaryLabel?: string
}) {
  const status = asset.uploadStatus
  const isUploading = status === 'uploading'
  const isError = status === 'error'
  const displayUrl = asset.url

  return (
    <div className="relative aspect-square rounded-lg overflow-hidden border border-white/10">
      {isUploading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
          <Loader2 size={18} className="animate-spin text-white" />
        </div>
      )}
      {isError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-red-900/40 p-1">
          <AlertTriangle size={14} className="text-red-300" />
          <span className="text-[9px] text-red-200 text-center leading-tight">Upload failed</span>
          <div className="flex gap-1">
            {onRetry && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRetry() }}
                className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] text-white hover:bg-white/30"
              >
                Retry
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove() }}
                className="rounded bg-red-500/80 px-1.5 py-0.5 text-[9px] text-white hover:bg-red-500"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}
      <img src={displayUrl} alt={asset.name} className="w-full h-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
        <p className="text-[10px] text-white/80 truncate">{asset.name}</p>
      </div>
      {isPrimary && (
        <div className="absolute top-1.5 right-1.5 rounded-full bg-cyan-400 px-1.5 py-0.5">
          <span className="text-[10px] font-bold text-black">{primaryLabel || 'PRIMARY'}</span>
        </div>
      )}
      {!isPrimary && !isError && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1.5 left-1.5 rounded-full bg-red-500/80 p-0.5 hover:bg-red-500"
        >
          <X size={10} className="text-white" />
        </button>
      )}
      {onSetPrimary && !isPrimary && !isUploading && !isError && (
        <button
          type="button"
          onClick={onSetPrimary}
          className="absolute bottom-1.5 right-1.5 rounded bg-white/20 px-1.5 py-0.5 text-[10px] text-white hover:bg-white/30"
        >
          Set Primary
        </button>
      )}
    </div>
  )
}

function UploadButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 px-3 py-2 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
    >
      {children}
    </button>
  )
}

// ── Modal ────────────────────────────────────────────────────────────────────

export default function PersonalizationModal() {
  const ctx = useDemoPersonalize()
  const {
    isOpen,
    source,
    closePersonalize,
    sourceTypeLabel,
    apiKey,
    clients,
    selectedClientId,
    clientForm,
    saveClient,
    selectClient,
    deleteClient,
    updateClientForm,
    assets,
    addIdentityFiles,
    removeIdentity,
    setPrimaryIdentity,
    addLogoFiles,
    removeLogo,
    setPrimaryLogo,
    addProductFiles,
    removeProduct,
    addBrandReferenceFiles,
    removeBrandReference,
    setFirstFrameFile,
    removeFirstFrame,
    setLastFrameFile,
    removeLastFrame,
    setCtaGraphicFile,
    removeCtaGraphic,
    retryAssetUpload,
    promptState,
    updatePersonalizedPrompt,
    resetPrompt,
    personalizePrompt,
    outputType,
    setOutputType,
    mode,
    setMode,
    genOptions,
    updateGenOptions,
    generation,
    generate,
    retry,
    generateAgain,
    result,
    resultTab,
    setResultTab,
    editInImageStudio,
    editInVideoStudio,
    publish,
    download,
    sharedMediaEntries,
  }: any = ctx

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const identityInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const productInputRef = useRef<HTMLInputElement>(null)
  const brandRefInputRef = useRef<HTMLInputElement>(null)
  const firstFrameInputRef = useRef<HTMLInputElement>(null)
  const lastFrameInputRef = useRef<HTMLInputElement>(null)
  const ctaInputRef = useRef<HTMLInputElement>(null)
  const previousActiveElementRef = useRef<HTMLElement | null>(null)

  useFocusTrap(isOpen, dialogRef)

  useEffect(() => {
    if (!isOpen) return

    previousActiveElementRef.current = document.activeElement as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePersonalize()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      previousActiveElementRef.current?.focus()
    }
  }, [isOpen, closePersonalize])

  useEffect(() => {
    setMode(null)
  }, [source?.id, setMode])

  if (!isOpen || !source) return null

  const isVideo = source.mediaType === 'video'
  const isImage = source.mediaType === 'image'
  const isPromptOnly = source.mediaType === 'prompt-only'
  const eligibleModes: readonly any[] = isVideo ? VIDEO_MODES : isImage ? IMAGE_MODES : []
  const outputOptions = isVideo ? OUTPUT_OPTIONS_VIDEO : isImage ? OUTPUT_OPTIONS_IMAGE : OUTPUT_OPTIONS_PROMPT

  // ── Upload handlers ─────────────────────────────────────────────────────────

  const handleIdentityUpload = useCallback(
    (files: FileList | null) => {
      if (!files) return
      addIdentityFiles(files)
    },
    [addIdentityFiles],
  )

  const handleLogoUpload = useCallback(
    (files: FileList | null) => {
      if (!files) return
      addLogoFiles(files)
    },
    [addLogoFiles],
  )

  const handleProductUpload = useCallback(
    (files: FileList | null) => {
      if (!files) return
      addProductFiles(files)
    },
    [addProductFiles],
  )

  const handleBrandRefUpload = useCallback(
    (files: FileList | null) => {
      if (!files) return
      addBrandReferenceFiles(files)
    },
    [addBrandReferenceFiles],
  )

  const handleFirstFrameUpload = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      const file = files[0]
      setFirstFrameFile(file)
    },
    [setFirstFrameFile],
  )

  const handleLastFrameUpload = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      const file = files[0]
      setLastFrameFile(file)
    },
    [setLastFrameFile],
  )

  const handleCtaUpload = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      const file = files[0]
      setCtaGraphicFile(file)
    },
    [setCtaGraphicFile],
  )

  const handleCopyPrompt = useCallback(async () => {
    const text = promptState.edited || promptState.personalized || promptState.original
    try {
      await navigator.clipboard.writeText(text)
      setCopiedPrompt(true)
      setTimeout(() => setCopiedPrompt(false), 1800)
    } catch {
      // ignore
    }
  }, [promptState])

  const handleResetPrompt = useCallback(() => {
    resetPrompt()
  }, [resetPrompt])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closePersonalize()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="personalize-title"
        tabIndex={-1}
        className="w-full max-w-6xl overflow-hidden rounded-2xl shadow-2xl animate-fade-in-up"
        style={{
          background: '#111',
          border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,211,238,0.15)' }}>
              <Sparkles size={18} style={{ color: '#22d3ee' }} />
            </div>
            <div>
              <h2 id="personalize-title" className="text-base font-semibold text-white">Personalize This Demo</h2>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Turn this demo into a custom version for yourself, your business, or a customer.
                {sourceTypeLabel && <span className="ml-2 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>{sourceTypeLabel}</span>}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closePersonalize}
            disabled={generation.status === 'generating' || generation.status === 'personalizing-prompt'}
            className="p-2 rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            aria-label="Close personalization modal"
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {generation.status === 'complete' && result ? (
            /* ── Result View ─────────────────────────────────────────────── */
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">Your Personalized Content Is Ready</h3>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Original on the left, personalized result on the right.
                </p>
              </div>

              {/* Result tabs */}
              <div className="flex gap-2 border-b border-white/10 pb-px">
                {(result.type === 'prompt' ? ['prompt'] : result.type === 'image' ? ['prompt', 'images'] : ['prompt', 'videos']).map((tab: string) => (
                  <button
                    key={tab}
                    onClick={() => setResultTab(tab)}
                    className={classNames(
                      'px-4 py-2 text-sm font-medium transition-colors',
                      resultTab === tab ? 'text-cyan-300' : 'text-white/50 hover:text-white/80',
                    )}
                    style={{ borderBottom: resultTab === tab ? '2px solid #22d3ee' : '2px solid transparent' }}
                  >
                    {tab === 'prompt' ? 'Prompt' : tab === 'images' ? 'Images' : 'Videos'}
                  </button>
                ))}
              </div>

              {/* Prompt result */}
              {resultTab === 'prompt' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-white/40">Original Prompt</span>
                      <button onClick={handleCopyPrompt} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                        <Copy size={12} /> {copiedPrompt ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-white/70">{promptState.original}</pre>
                  </div>
                  <div className="rounded-xl border border-cyan-400/20 bg-black/30 p-4">
                    <div className="mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Personalized Prompt</span>
                    </div>
                    <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-white/90">{promptState.edited || promptState.personalized || promptState.original}</pre>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={generateAgain} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee' }}>
                      <RefreshCw size={14} /> Generate Again
                    </button>
                    {result.type !== 'video' && (
                      <button onClick={() => setOutputType('video')} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white' }}>
                        <Video size={14} /> Generate Video
                      </button>
                    )}
                    {result.type !== 'image' && (
                      <button onClick={() => setOutputType('image')} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white' }}>
                        <Image size={14} /> Generate Image
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Image result */}
              {resultTab === 'images' && result.type === 'image' && result.url && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-white/10 overflow-hidden">
                      <div className="p-2 border-b border-white/10">
                        <span className="text-xs font-semibold text-white/40">ORIGINAL</span>
                      </div>
                      {source.sourceMedia && (
                        <img src={source.sourceMedia} alt="Original" className="w-full object-contain" style={{ maxHeight: '50vh' }} />
                      )}
                    </div>
                    <div className="rounded-xl border border-cyan-400/20 overflow-hidden">
                      <div className="p-2 border-b border-cyan-400/20">
                        <span className="text-xs font-semibold text-cyan-300">PERSONALIZED</span>
                      </div>
                      <img src={result.url} alt="Personalized" className="w-full object-contain" style={{ maxHeight: '50vh' }} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={download} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white' }}>
                      <Download size={14} /> Download
                    </button>
                    <button onClick={editInImageStudio} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white' }}>
                      <Image size={14} /> Edit in Image Studio
                    </button>
                    <button onClick={publish} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee' }}>
                      <Share2 size={14} /> Publish
                    </button>
                    <button onClick={generateAgain} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white' }}>
                      <RefreshCw size={14} /> Generate Again
                    </button>
                  </div>
                </div>
              )}

              {/* Video result */}
              {resultTab === 'videos' && result.type === 'video' && result.url && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-white/10 overflow-hidden">
                      <div className="p-2 border-b border-white/10">
                        <span className="text-xs font-semibold text-white/40">ORIGINAL</span>
                      </div>
                      {source.sourceMedia && (
                        <video src={source.sourceMedia} controls className="w-full" style={{ maxHeight: '50vh' }} />
                      )}
                    </div>
                    <div className="rounded-xl border border-cyan-400/20 overflow-hidden">
                      <div className="p-2 border-b border-cyan-400/20">
                        <span className="text-xs font-semibold text-cyan-300">PERSONALIZED</span>
                      </div>
                      <video src={result.url} controls autoPlay className="w-full" style={{ maxHeight: '50vh' }} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={download} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white' }}>
                      <Download size={14} /> Download
                    </button>
                    <button onClick={editInVideoStudio} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white' }}>
                      <Video size={14} /> Edit in Video Studio
                    </button>
                    <button onClick={publish} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee' }}>
                      <Share2 size={14} /> Publish
                    </button>
                    <button onClick={generateAgain} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white' }}>
                      <RefreshCw size={14} /> Generate Again
                    </button>
                  </div>
                  {isVideo && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                      <span className="text-xs text-white/40 self-center mr-2">Switch mode:</span>
                      {VIDEO_MODES.filter((m: any) => m.key !== mode).map((m: any) => (
                        <button
                          key={m.key}
                          onClick={() => { setMode(m.key); generateAgain() }}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          Try {m.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Shared media confirmation */}
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="flex items-center gap-2">
                  <Check size={14} style={{ color: '#22d3ee' }} />
                  <span className="text-xs text-white/60">Saved to Shared Media ({sharedMediaEntries.length} total entries)</span>
                </div>
              </div>
            </div>
          ) : generation.status === 'error' ? (
            /* ── Error State ──────────────────────────────────────────────── */
            <div className="p-8 text-center space-y-4">
              <AlertTriangle size={40} style={{ color: '#f87171' }} className="mx-auto" />
              <h3 className="text-lg font-bold text-white">We Could Not Complete This Personalization</h3>
              <p className="text-sm text-white/60 max-w-md mx-auto">
                {generation.errorMessage || 'An unexpected error occurred.'}
              </p>
              <p className="text-xs text-white/40">Your client, assets, and settings have been preserved.</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button onClick={retry} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold" style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee' }}>
                  <RefreshCw size={14} /> Retry
                </button>
                <button onClick={generate} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold" style={{ background: 'linear-gradient(to right, #22d3ee, #a855f7)', color: 'black' }}>
                  Try Again
                </button>
              </div>
            </div>
          ) : generation.status === 'generating' || generation.status === 'personalizing-prompt' ? (
            /* ── Generation Progress ──────────────────────────────────────── */
            <div className="p-8 text-center space-y-4">
              <Loader2 size={40} className="mx-auto animate-spin" style={{ color: '#22d3ee' }} />
              <h3 className="text-lg font-bold text-white">{generation.progressMessage || generation.status === 'personalizing-prompt' ? 'Personalizing Prompt...' : 'Generating...'}</h3>
              <div className="max-w-xs mx-auto">
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${generation.progress}%`, background: 'linear-gradient(to right, #22d3ee, #a855f7)' }} />
                </div>
                <p className="text-xs text-white/40 mt-1">{generation.progress}%</p>
              </div>
            </div>
          ) : (
            /* ── Configuration View ───────────────────────────────────────── */
            <div className="flex flex-col lg:flex-row">
              {/* Left column - Source + prompt */}
              <div className="w-full lg:w-1/2 p-6 border-b lg:border-b-0 lg:border-r border-white/10 space-y-6">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">Source Demo</h3>
                  <div className="rounded-xl border border-white/10 overflow-hidden bg-black/20">
                    {isVideo && source.sourceMedia && (
                      <div className="relative aspect-video bg-black">
                        <video
                          src={source.sourceMedia}
                          poster={source.poster || undefined}
                          controls
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    {isImage && source.sourceMedia && (
                      <img src={source.sourceMedia} alt={source.title} className="w-full object-contain" style={{ maxHeight: '40vh' }} />
                    )}
                    {!source.sourceMedia && (
                      <div className="flex aspect-video items-center justify-center bg-white/5">
                        <FileText size={32} style={{ color: 'rgba(255,255,255,0.2)' }} />
                      </div>
                    )}
                    <div className="p-4 space-y-2">
                      <h4 className="text-sm font-semibold text-white line-clamp-2">{source.title}</h4>
                      {sourceTypeLabel && (
                        <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>{sourceTypeLabel}</span>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {source.category && <div><span className="text-white/40">Category:</span> <span className="text-white/80">{source.category}</span></div>}
                        {source.modelName && <div><span className="text-white/40">Model:</span> <span className="text-white/80">{source.modelName}</span></div>}
                        {source.aspectRatio && <div><span className="text-white/40">Aspect:</span> <span className="text-white/80">{source.aspectRatio}</span></div>}
                        {source.durationLabel && <div><span className="text-white/40">Duration:</span> <span className="text-white/80">{source.durationLabel}</span></div>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Original prompt */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Original Prompt</h3>
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <pre className="whitespace-pre-wrap break-words text-[13px] leading-6 text-white/70">{source.originalPrompt || source.fullPrompt || source.shortPrompt || ''}</pre>
                  </div>
                </div>

                {/* Personalized prompt */}
                {promptState.personalized && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Personalized Prompt</h3>
                      <div className="flex gap-2">
                        <button onClick={handleCopyPrompt} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                          <Copy size={12} /> {copiedPrompt ? 'Copied!' : 'Copy'}
                        </button>
                        <button onClick={handleResetPrompt} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                          Reset
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={promptState.edited || promptState.personalized}
                      onChange={(e) => updatePersonalizedPrompt(e.target.value)}
                      rows={6}
                      className="w-full rounded-xl border border-cyan-400/20 bg-black/30 p-4 text-sm leading-6 text-white/90 outline-none resize-y"
                      style={{ caretColor: '#22d3ee' }}
                    />
                  </div>
                )}
              </div>

              {/* Right column - Configuration */}
              <div className="w-full lg:w-1/2 p-6 space-y-6">
                {/* Who is this for */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Who Is This For?</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'me', label: 'Me', icon: User },
                      { key: 'my-business', label: 'My Business', icon: Building2 },
                      { key: 'customer', label: 'Customer / Client', icon: Users },
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => updateClientForm({ ...clientForm, audience: key })}
                        className={classNames(
                          'flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all',
                          clientForm.audience === key ? 'border-cyan-400/50 bg-cyan-400/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/5',
                        )}
                      >
                        <Icon size={16} style={{ color: clientForm.audience === key ? '#22d3ee' : 'rgba(255,255,255,0.4)' }} />
                        <span className="text-xs font-medium" style={{ color: clientForm.audience === key ? '#22d3ee' : 'rgba(255,255,255,0.7)' }}>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Client selection */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Client Profile</h3>
                  <div className="flex gap-2">
                    <select
                      value={selectedClientId}
                      onChange={(e) => selectClient(e.target.value)}
                      className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                    >
                      <option value="">Select Existing Client</option>
                      {clients.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.businessName || c.name || c.id}</option>
                      ))}
                    </select>
                    <button onClick={() => { selectClient(''); updateClientForm({ ...clientForm, id: '', name: '', businessName: '' }) }} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/70 hover:bg-white/10 transition-colors">
                      New
                    </button>
                  </div>

                  {/* Client form */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'name', label: 'Contact Name', placeholder: 'John Doe' },
                      { key: 'businessName', label: 'Business Name', placeholder: 'ABC Roofing', full: true },
                      { key: 'industry', label: 'Industry', placeholder: 'Roofing' },
                      { key: 'location', label: 'Location', placeholder: 'Miami, FL' },
                      { key: 'productService', label: 'Product / Service', placeholder: 'Free Roof Inspection' },
                      { key: 'offer', label: 'Offer', placeholder: 'Free inspection with no obligation' },
                      { key: 'callToAction', label: 'Call To Action', placeholder: 'Call Now', full: true },
                      { key: 'phone', label: 'Phone', placeholder: '555-555-5555' },
                      { key: 'website', label: 'Website', placeholder: 'abcroofing.com' },
                    ].map(({ key, label, placeholder, full }) => (
                      <div key={key} className={full ? 'col-span-2' : ''}>
                        <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1">{label}</label>
                        <input
                          value={(clientForm as any)[key]}
                          onChange={(e) => updateClientForm({ ...clientForm, [key]: e.target.value })}
                          placeholder={placeholder}
                          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20"
                        />
                      </div>
                    ))}
                    <div className="col-span-2">
                      <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1">Brand Description</label>
                      <textarea
                        value={clientForm.brandDescription}
                        onChange={(e) => updateClientForm({ ...clientForm, brandDescription: e.target.value })}
                        rows={2}
                        placeholder="Describe the brand style, colors, mood..."
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none resize-y placeholder:text-white/20"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveClient} className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee' }}>
                      <Save size={14} /> {selectedClientId ? 'Update Client' : 'Save Client'}
                    </button>
                    {selectedClientId && (
                      <button onClick={() => deleteClient(selectedClientId)} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-400/10 transition-colors" style={{ border: '1px solid rgba(248,113,113,0.2)' }}>
                        <Trash2 size={14} /> Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Client Assets — SIX visible cards */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Client Assets</h3>
                    <p className="text-xs text-white/40">Add the people, products, branding and visual references SmartVideo should use.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Person / Presenter */}
                    <AssetCard title="Person / Presenter" description="Upload one or more photos of the person who should appear in the personalized content.">
                      <div className="flex flex-wrap gap-2">
                        <input type="file" ref={identityInputRef} accept="image/*" multiple className="hidden" onChange={(e) => { handleIdentityUpload(e.target.files); e.target.value = '' }} />
                        <UploadButton onClick={() => identityInputRef.current?.click()}>
                          <Upload size={12} /> Add Photos
                        </UploadButton>
                      </div>
                      {assets.identities.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-2">
                           {assets.identities.map((asset: any) => (
                             <AssetPreview
                               key={asset.id}
                               asset={asset}
                               isPrimary={asset.isPrimary}
                               primaryLabel="PRIMARY"
                               onSetPrimary={() => setPrimaryIdentity(asset.id)}
                               onRemove={() => removeIdentity(asset.id)}
                               onRetry={() => retryAssetUpload(asset.id)}
                             />
                           ))}
                        </div>
                      )}
                    </AssetCard>

                    {/* Logo */}
                    <AssetCard title="Logo" description="Upload the exact client logo for precise branding.">
                      <div className="flex flex-wrap gap-2">
                        <input type="file" ref={logoInputRef} accept="image/*" className="hidden" onChange={(e) => { handleLogoUpload(e.target.files); e.target.value = '' }} />
                        <UploadButton onClick={() => logoInputRef.current?.click()}>
                          <Upload size={12} /> Upload Logo
                        </UploadButton>
                      </div>
                      {assets.logos.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-2">
                           {assets.logos.map((asset: any) => (
                             <AssetPreview
                               key={asset.id}
                               asset={asset}
                               isPrimary={asset.isPrimary}
                               primaryLabel="PRIMARY"
                               onSetPrimary={() => setPrimaryLogo(asset.id)}
                               onRemove={() => removeLogo(asset.id)}
                               onRetry={() => retryAssetUpload(asset.id)}
                             />
                           ))}
                        </div>
                      )}
                    </AssetCard>

                    {/* Products / Services */}
                    <AssetCard title="Products / Services" description="Upload product or service images to include in the personalized output.">
                      <div className="flex flex-wrap gap-2">
                        <input type="file" ref={productInputRef} accept="image/*" multiple className="hidden" onChange={(e) => { handleProductUpload(e.target.files); e.target.value = '' }} />
                        <UploadButton onClick={() => productInputRef.current?.click()}>
                          <Upload size={12} /> Add Images
                        </UploadButton>
                      </div>
                      {assets.products.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-2">
                           {assets.products.map((asset: any) => (
                             <AssetPreview
                               key={asset.id}
                               asset={asset}
                               onRemove={() => removeProduct(asset.id)}
                               onRetry={() => retryAssetUpload(asset.id)}
                             />
                           ))}
                        </div>
                      )}
                    </AssetCard>

                    {/* Brand References */}
                    <AssetCard title="Brand References" description="Upload brand imagery such as locations, uniforms, or packaging.">
                      <div className="flex flex-wrap gap-2">
                        <input type="file" ref={brandRefInputRef} accept="image/*" multiple className="hidden" onChange={(e) => { handleBrandRefUpload(e.target.files); e.target.value = '' }} />
                        <UploadButton onClick={() => brandRefInputRef.current?.click()}>
                          <Upload size={12} /> Add Images
                        </UploadButton>
                      </div>
                      {assets.brandReferences.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-2">
                           {assets.brandReferences.map((asset: any) => (
                             <AssetPreview
                               key={asset.id}
                               asset={asset}
                               onRemove={() => removeBrandReference(asset.id)}
                               onRetry={() => retryAssetUpload(asset.id)}
                             />
                           ))}
                        </div>
                      )}
                    </AssetCard>

                    {/* First Frame */}
                    <AssetCard title="First Frame" description="Control how the video opens.">
                      <div className="flex flex-wrap gap-2">
                        <input type="file" ref={firstFrameInputRef} accept="image/*" className="hidden" onChange={(e) => { handleFirstFrameUpload(e.target.files); e.target.value = '' }} />
                        <UploadButton onClick={() => firstFrameInputRef.current?.click()}>
                          <Upload size={12} /> Upload Image
                        </UploadButton>
                      </div>
                       {assets.firstFrame && (
                         <div className="mt-2">
                           <AssetPreview asset={assets.firstFrame} onRemove={removeFirstFrame} onRetry={() => retryAssetUpload(assets.firstFrame!.id)} />
                         </div>
                       )}
                    </AssetCard>

                    {/* Last Frame / CTA */}
                    <AssetCard title="Last Frame / CTA" description="Control how the video ends.">
                      <div className="flex flex-wrap gap-2">
                        <input type="file" ref={lastFrameInputRef} accept="image/*" className="hidden" onChange={(e) => { handleLastFrameUpload(e.target.files); e.target.value = '' }} />
                        <UploadButton onClick={() => lastFrameInputRef.current?.click()}>
                          <Upload size={12} /> Upload Image
                        </UploadButton>
                      </div>
                       {assets.lastFrame && (
                         <div className="mt-2">
                           <AssetPreview asset={assets.lastFrame} onRemove={removeLastFrame} onRetry={() => retryAssetUpload(assets.lastFrame!.id)} />
                         </div>
                       )}
                    </AssetCard>
                  </div>
                </div>

                {/* CTA & Business Content */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">CTA & Business Content</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1">Product / Service</label>
                      <input
                        value={clientForm.productService}
                        onChange={(e) => updateClientForm({ ...clientForm, productService: e.target.value })}
                        placeholder="Roof Replacement"
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1">Offer</label>
                      <input
                        value={clientForm.offer}
                        onChange={(e) => updateClientForm({ ...clientForm, offer: e.target.value })}
                        placeholder="Free Roof Inspection"
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1">CTA Headline</label>
                      <input
                        value={clientForm.callToAction}
                        onChange={(e) => updateClientForm({ ...clientForm, callToAction: e.target.value })}
                        placeholder="Protect Your Home Today"
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1">Button / Action</label>
                      <input
                        value={clientForm.callToAction}
                        onChange={(e) => updateClientForm({ ...clientForm, callToAction: e.target.value })}
                        placeholder="Book Your Inspection"
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1">Phone</label>
                      <input
                        value={clientForm.phone}
                        onChange={(e) => updateClientForm({ ...clientForm, phone: e.target.value })}
                        placeholder="555-555-5555"
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1">Website</label>
                      <input
                        value={clientForm.website}
                        onChange={(e) => updateClientForm({ ...clientForm, website: e.target.value })}
                        placeholder="abcroofing.com"
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1">CTA Graphic</label>
                    <div className="flex flex-wrap gap-2">
                      <input type="file" ref={ctaInputRef} accept="image/*" className="hidden" onChange={(e) => { handleCtaUpload(e.target.files); e.target.value = '' }} />
                      <UploadButton onClick={() => ctaInputRef.current?.click()}>
                        <Upload size={12} /> Upload CTA Graphic
                      </UploadButton>
                    </div>
                     {assets.ctaGraphic && (
                       <div className="mt-2">
                         <AssetPreview asset={assets.ctaGraphic} onRemove={removeCtaGraphic} onRetry={() => retryAssetUpload(assets.ctaGraphic!.id)} />
                       </div>
                     )}
                  </div>
                </div>

                {/* Personalize The Prompt */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Personalize The Prompt</h3>
                    <button
                      onClick={personalizePrompt}
                      disabled={!clientForm.businessName && !clientForm.name}
                      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                      style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee' }}
                    >
                      <Sparkles size={12} /> Personalize Prompt
                    </button>
                  </div>
                  {promptState.personalized && (
                    <div className="rounded-xl border border-cyan-400/20 bg-black/30 p-3">
                      <p className="text-xs text-cyan-300 mb-1 font-medium">Personalized Prompt</p>
                      <p className="text-xs text-white/70 line-clamp-3">{promptState.personalized}</p>
                    </div>
                  )}
                </div>

                {/* Output selection */}
                {!isPromptOnly && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">What Do You Want To Create?</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {outputOptions.map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => setOutputType(key)}
                          className={classNames(
                            'flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all',
                            outputType === key ? 'border-cyan-400/50 bg-cyan-400/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/5',
                          )}
                        >
                          <Icon size={18} style={{ color: outputType === key ? '#22d3ee' : 'rgba(255,255,255,0.4)' }} />
                          <span className="text-xs font-medium" style={{ color: outputType === key ? '#22d3ee' : 'rgba(255,255,255,0.7)' }}>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Personalization mode */}
                {outputType !== 'prompt' && eligibleModes.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">
                      {isVideo ? 'Personalization Mode' : 'Image Personalization Mode'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {eligibleModes.map((m: any) => (
                        <button
                          key={m.key}
                          onClick={() => setMode(m.key)}
                          className={classNames(
                            'p-4 rounded-xl text-left transition-all',
                            mode === m.key ? 'border-cyan-400/50 bg-cyan-400/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/5',
                          )}
                          style={{ border: mode === m.key ? '1px solid rgba(34,211,238,0.3)' : '1px solid rgba(255,255,255,0.08)' }}
                        >
                          <p className="text-sm font-semibold" style={{ color: mode === m.key ? '#22d3ee' : 'white' }}>{m.label}</p>
                          <p className="text-xs mt-1 text-white/50">{m.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Advanced settings */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-xs font-medium text-white/50 hover:text-white transition-colors"
                  >
                    {showAdvanced ? <ChevronDown size={14} /> : <ChevronDown size={14} />}
                    Advanced Settings
                  </button>
                  {showAdvanced && (
                    <div className="grid grid-cols-2 gap-2 p-4 rounded-xl border border-white/10 bg-black/20">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1">Engine</label>
                        <select
                          value={genOptions.engine}
                          onChange={(e) => updateGenOptions({ ...genOptions, engine: e.target.value })}
                          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                        >
                          <option value="smartvideo-recommended">SmartVideo Recommended</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={genOptions.preserveAudio}
                            onChange={(e) => updateGenOptions({ ...genOptions, preserveAudio: e.target.checked })}
                            className="rounded border-white/20 bg-black/30"
                          />
                          <span className="text-xs text-white/70">Preserve Audio</span>
                        </label>
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1">Logo Handling</label>
                        <select
                          value={genOptions.exactLogoHandling}
                          onChange={(e) => updateGenOptions({ ...genOptions, exactLogoHandling: e.target.value })}
                          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                        >
                          <option value="final-overlay">Exact Final Overlay</option>
                          <option value="ai-reference">AI Reference</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1">CTA Handling</label>
                        <select
                          value={genOptions.exactCtaHandling}
                          onChange={(e) => updateGenOptions({ ...genOptions, exactCtaHandling: e.target.value })}
                          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                        >
                          <option value="final-end-card">Exact End Card</option>
                          <option value="ai-generated">AI Generated</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Consent */}
                {(mode === 'face_only' || mode === 'full_body' || mode === 'replace_face' || mode === 'replace_person') && (
                  <div className="flex items-start gap-2 p-3 rounded-xl border border-white/10 bg-black/20">
                    <input
                      type="checkbox"
                      id="likeness-consent"
                      checked={genOptions.consentGiven}
                      onChange={(e) => updateGenOptions({ ...genOptions, consentGiven: e.target.checked })}
                      className="mt-0.5 rounded border-white/20 bg-black/30"
                    />
                    <label htmlFor="likeness-consent" className="text-xs text-white/60 cursor-pointer">
                      I confirm that I have permission to use this person&apos;s image or likeness.
                    </label>
                  </div>
                )}

                {/* Generate button */}
                <button
                  onClick={generate}
                  disabled={generation.status === 'generating' || generation.status === 'personalizing-prompt'}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold disabled:opacity-50 transition-all"
                  style={{ background: 'linear-gradient(to right, #22d3ee, #a855f7)', color: 'black' }}
                >
                  {generation.status === 'generating' || generation.status === 'personalizing-prompt' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {generation.status === 'personalizing-prompt' ? 'Personalizing...' : 'Generating...'}
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      {outputType === 'prompt' ? 'Personalize Prompt' : outputType === 'image' ? 'Generate Image' : outputType === 'video' ? 'Personalize Video' : 'Generate Everything'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {generation.status !== 'generating' && generation.status !== 'personalizing-prompt' && generation.status !== 'complete' && generation.status !== 'error' && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/10">
            <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <Sparkles size={12} />
              <span className="text-xs">GO AI PERSONALIZATION</span>
            </div>
            <button onClick={closePersonalize} className="text-xs font-medium text-white/40 hover:text-white transition-colors">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
