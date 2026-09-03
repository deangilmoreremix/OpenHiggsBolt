/**
 * PersonalizationModal
 *
 * Context-driven modal for the SmartVideo personalization workflow.
 * Implements the approved full-width design hierarchy.
 */

'use client'

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ChangeEvent,
  type DragEvent,
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
  AlertCircle,
} from 'lucide-react'
import { useDemoPersonalize } from './DemoPersonalizeProvider'
import type { PersonalizationAsset } from './types'

// Niche-specific CTA copy lives in components/landing/landingData.js. The
// modal reads the active niche id from source.sourceMetadata.nicheId and
// renders the matching heading/body so each niche section can open the
// personalization flow with on-brand copy.
import { NICHE_CTA_BY_ID } from '@/components/landing/landingData'

// ── Helpers ──────────────────────────────────────────────────────────────────

function classNames(...classes: (string | boolean | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

const VIDEO_MODES = [
  { key: 'face_only', label: 'FACE ONLY', description: 'Keep the original body, clothing, movement, scene and timing. Change face.' },
  { key: 'full_body', label: 'FULL PRESENTER', description: 'Replace the presenter with the uploaded person where supported.' },
  { key: 'recreate', label: 'RECREATE FOR CLIENT', description: 'Recreate the viral concept using this client\'s assets and personalized prompt.' },
  { key: 'complete', label: 'COMPLETE PERSONALIZATION', description: 'Person + products + brand + logo + CTA + prompt.' },
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

// ── Reusable sub-components ──────────────────────────────────────────────────

/** Large visual drop zone with ↑ icon, primary label, secondary hint. */
function UploadDropZone({
  label,
  hint,
  onFiles,
  multiple = false,
  disabled,
  compact = false,
}: {
  label: string
  hint?: string
  onFiles: (files: FileList | null) => void
  multiple?: boolean
  disabled?: boolean
  compact?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragOver(true)
  }, [disabled])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (disabled) return
    onFiles(e.dataTransfer.files)
  }, [disabled, onFiles])

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    onFiles(e.target.files)
    e.target.value = ''
  }, [onFiles])

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      className={classNames(
        'flex flex-col items-center justify-center gap-2 cursor-pointer',
        'rounded-xl border border-dashed transition-all',
        compact ? 'px-3 py-3 min-h-[72px]' : 'px-4 py-6 min-h-[90px]',
        isDragOver
          ? 'border-cyan-400/60 bg-cyan-400/5'
          : 'border-white/15 bg-black/20 hover:border-white/25 hover:bg-white/[0.03]',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
      <Upload size={compact ? 16 : 20} className="text-white/60" />
      <div className="text-center">
        <p className={classNames('font-semibold text-white', compact ? 'text-[11px]' : 'text-xs')}>{label}</p>
        {hint && <p className={classNames('text-white/40 mt-0.5', compact ? 'text-[10px]' : 'text-[11px]')}>{hint}</p>}
      </div>
    </div>
  )
}

/** Thumbnail card for an uploaded asset with status overlay. */
function AssetThumb({
  asset,
  isPrimary,
  primaryLabel,
  onSetPrimary,
  onRemove,
  onRetry,
}: {
  asset: PersonalizationAsset
  isPrimary?: boolean
  primaryLabel?: string
  onSetPrimary?: () => void
  onRemove?: () => void
  onRetry?: () => void
}) {
  const status = asset.uploadStatus
  const isUploading = status === 'uploading'
  const isError = status === 'error'
  const isReady = status === 'ready'
  const displayUrl = asset.uploadedUrl || asset.url

  return (
    <div className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/40 group">
      {isUploading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
          <Loader2 size={16} className="animate-spin text-white" />
        </div>
      )}
      {isError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-red-900/40 p-1">
          <AlertCircle size={14} className="text-red-300" />
          <span className="text-[9px] text-red-200 text-center leading-tight">Failed</span>
          {onRetry && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRetry() }}
              className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] text-white hover:bg-white/30"
            >
              Retry
            </button>
          )}
        </div>
      )}
      {isReady && (
        <div className="absolute top-1 right-1 z-10 flex items-center gap-0.5 rounded-full bg-emerald-500/90 px-1.5 py-0.5">
          <Check size={8} className="text-white" />
          <span className="text-[8px] font-bold text-white">READY</span>
        </div>
      )}
      {displayUrl ? (
        <img src={displayUrl} alt={asset.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/30 text-[10px]">
          {asset.name}
        </div>
      )}
      {isPrimary && (
        <div className="absolute bottom-1 left-1 z-10 rounded-full bg-cyan-400 px-1.5 py-0.5">
          <span className="text-[8px] font-bold text-black">★ {primaryLabel || 'PRIMARY'}</span>
        </div>
      )}
      {onSetPrimary && !isPrimary && !isError && !isUploading && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSetPrimary() }}
          className="absolute bottom-1 right-1 z-10 rounded bg-white/20 px-1.5 py-0.5 text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/30"
        >
          Set Primary
        </button>
      )}
      {onRemove && !isError && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="absolute top-1 left-1 z-10 rounded-full bg-red-500/80 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
        >
          <X size={8} className="text-white" />
        </button>
      )}
    </div>
  )
}

/** Section heading. */
function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-white/90">{title}</h3>
      {description && <p className="text-xs text-white/40 mt-1">{description}</p>}
    </div>
  )
}

/** Outer card frame used for the six client asset cards. */
function AssetCardFrame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={classNames('flex flex-col rounded-xl border border-white/10 bg-black/20 p-5', className)}>
      {children}
    </div>
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
  const [isPersonalizing, setIsPersonalizing] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

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
      if (e.key === 'Escape') closePersonalize()
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

  // Resolve niche-specific CTA copy if the source was opened from a niche
  // section. Falls back to the generic modal header so existing entry
  // points (e.g. demo cards) keep their current copy.
  const nicheId =
    typeof (source as any)?.sourceMetadata?.nicheId === 'string'
      ? ((source as any).sourceMetadata.nicheId as string)
      : null
  const nicheCta = nicheId ? NICHE_CTA_BY_ID[nicheId] : null
  const headerTitle = nicheCta?.ctaHeading ?? 'Personalize This Demo'
  const headerBody = nicheCta?.ctaBody ??
    'Turn this demo into a custom version for yourself, your business, or a customer. Personalize the person, branding, products, prompt, offer and CTA.'

  const isVideo = source.mediaType === 'video'
  const isImage = source.mediaType === 'image'
  const isPromptOnly = source.mediaType === 'prompt-only'
  const eligibleModes: readonly any[] = isVideo ? VIDEO_MODES : isImage ? IMAGE_MODES : []
  const outputOptions = isVideo ? OUTPUT_OPTIONS_VIDEO : isImage ? OUTPUT_OPTIONS_IMAGE : OUTPUT_OPTIONS_PROMPT
  const showModes = outputType !== 'prompt' && eligibleModes.length > 0

  // ── Upload handlers ────────────────────────────────────────────────────────

  const handleIdentityUpload = useCallback((files: FileList | null) => {
    if (files) addIdentityFiles(files)
  }, [addIdentityFiles])
  const handleLogoUpload = useCallback((files: FileList | null) => {
    if (files) addLogoFiles(files)
  }, [addLogoFiles])
  const handleProductUpload = useCallback((files: FileList | null) => {
    if (files) addProductFiles(files)
  }, [addProductFiles])
  const handleBrandRefUpload = useCallback((files: FileList | null) => {
    if (files) addBrandReferenceFiles(files)
  }, [addBrandReferenceFiles])
  const handleFirstFrameUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    setFirstFrameFile(files[0])
  }, [setFirstFrameFile])
  const handleLastFrameUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    setLastFrameFile(files[0])
  }, [setLastFrameFile])
  const handleCtaUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    setCtaGraphicFile(files[0])
  }, [setCtaGraphicFile])

  // ── Prompt actions ───────────────────────────────────────────────────────

  const handleCopyPrompt = useCallback(async () => {
    const text = promptState.edited || promptState.personalized || promptState.original
    try {
      await navigator.clipboard.writeText(text)
      setCopiedPrompt(true)
      setTimeout(() => setCopiedPrompt(false), 1800)
    } catch { /* ignore */ }
  }, [promptState])

  const handlePersonalize = useCallback(async () => {
    setIsPersonalizing(true)
    try {
      await personalizePrompt()
    } finally {
      setIsPersonalizing(false)
    }
  }, [personalizePrompt])

  const handleRegenerate = useCallback(async () => {
    setIsRegenerating(true)
    try {
      await personalizePrompt()
    } finally {
      setIsRegenerating(false)
    }
  }, [personalizePrompt])

  // ── Render ─────────────────────────────────────────────────────────────────

  const personalizationInProgress =
    generation.status === 'generating' || generation.status === 'personalizing-prompt'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !personalizationInProgress) closePersonalize()
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
          background: '#0e0e10',
          border: '1px solid rgba(255,255,255,0.08)',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header (full width) ─────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(34,211,238,0.15)' }}
            >
              <Sparkles size={18} style={{ color: '#22d3ee' }} />
            </div>
            <div>
              <h2 id="personalize-title" className="text-base font-semibold text-white flex items-center gap-2">
                {headerTitle}
                {sourceTypeLabel && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider"
                    style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}
                  >
                    {sourceTypeLabel}
                  </span>
                )}
              </h2>
              <p
                className="text-xs mt-1 text-white/50 max-w-2xl"
                dangerouslySetInnerHTML={{ __html: headerBody }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={closePersonalize}
            disabled={personalizationInProgress}
            className="p-2 rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            aria-label="Close personalization modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {generation.status === 'complete' && result ? (
            <ResultView
              result={result}
              resultTab={resultTab}
              setResultTab={setResultTab}
              source={source}
              promptState={promptState}
              generateAgain={generateAgain}
              outputType={outputType}
              setOutputType={setOutputType}
              download={download}
              editInImageStudio={editInImageStudio}
              editInVideoStudio={editInVideoStudio}
              publish={publish}
              sharedMediaCount={sharedMediaEntries.length}
              isVideo={isVideo}
              eligibleModes={eligibleModes}
              mode={mode}
              setMode={setMode}
            />
          ) : generation.status === 'error' ? (
            <ErrorView
              errorMessage={generation.errorMessage}
              retry={retry}
              generate={generate}
            />
          ) : personalizationInProgress ? (
            <ProgressView
              status={generation.status}
              progress={generation.progress}
              message={generation.progressMessage}
            />
          ) : (
            <ConfigurationView
              // Source + Client
              source={source}
              sourceTypeLabel={sourceTypeLabel}
              clients={clients}
              selectedClientId={selectedClientId}
              clientForm={clientForm}
              selectClient={selectClient}
              saveClient={saveClient}
              deleteClient={deleteClient}
              updateClientForm={updateClientForm}
              // Assets
              assets={assets}
              addIdentityFiles={handleIdentityUpload}
              removeIdentity={removeIdentity}
              setPrimaryIdentity={setPrimaryIdentity}
              addLogoFiles={handleLogoUpload}
              removeLogo={removeLogo}
              setPrimaryLogo={setPrimaryLogo}
              addProductFiles={handleProductUpload}
              removeProduct={removeProduct}
              addBrandReferenceFiles={handleBrandRefUpload}
              removeBrandReference={removeBrandReference}
              setFirstFrameFile={handleFirstFrameUpload}
              removeFirstFrame={removeFirstFrame}
              setLastFrameFile={handleLastFrameUpload}
              removeLastFrame={removeLastFrame}
              setCtaGraphicFile={handleCtaUpload}
              removeCtaGraphic={removeCtaGraphic}
              retryAssetUpload={retryAssetUpload}
              // Prompt
              promptState={promptState}
              updatePersonalizedPrompt={updatePersonalizedPrompt}
              resetPrompt={resetPrompt}
              isPersonalizing={isPersonalizing}
              isRegenerating={isRegenerating}
              handlePersonalize={handlePersonalize}
              handleRegenerate={handleRegenerate}
              handleCopyPrompt={handleCopyPrompt}
              copiedPrompt={copiedPrompt}
              canPersonalize={Boolean(clientForm.businessName || clientForm.name)}
              // Output + Mode
              outputOptions={outputOptions as any}
              outputType={outputType}
              setOutputType={setOutputType}
              showModes={showModes}
              eligibleModes={eligibleModes as any}
              mode={mode}
              setMode={setMode}
              // Engine
              showAdvanced={showAdvanced}
              setShowAdvanced={setShowAdvanced}
              genOptions={genOptions}
              updateGenOptions={updateGenOptions}
              // Generate
              generate={generate}
              closePersonalize={closePersonalize}
              isReadyToGenerate={Boolean((clientForm.businessName || clientForm.name) && (outputType === 'prompt' || mode))}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-views ────────────────────────────────────────────────────────────────

function ProgressView({
  status,
  progress,
  message,
}: {
  status: string
  progress: number
  message: string
}) {
  return (
    <div className="px-6 py-16 text-center space-y-4">
      <Loader2 size={40} className="mx-auto animate-spin" style={{ color: '#22d3ee' }} />
      <h3 className="text-lg font-bold text-white">
        {message || (status === 'personalizing-prompt' ? 'Personalizing Prompt...' : 'Generating...')}
      </h3>
      <div className="max-w-xs mx-auto">
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: 'linear-gradient(to right, #22d3ee, #a855f7)' }}
          />
        </div>
        <p className="text-xs text-white/40 mt-1">{progress}%</p>
      </div>
    </div>
  )
}

function ErrorView({
  errorMessage,
  retry,
  generate,
}: {
  errorMessage: string | null
  retry: () => void
  generate: () => void
}) {
  return (
    <div className="px-6 py-16 text-center space-y-4">
      <AlertTriangle size={40} style={{ color: '#f87171' }} className="mx-auto" />
      <h3 className="text-lg font-bold text-white">We Could Not Complete This Personalization</h3>
      <p className="text-sm text-white/60 max-w-md mx-auto">
        {errorMessage || 'An unexpected error occurred.'}
      </p>
      <p className="text-xs text-white/40">Your client, assets, and settings have been preserved.</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={retry}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"
          style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee' }}
        >
          <RefreshCw size={14} /> Retry
        </button>
        <button
          onClick={generate}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"
          style={{ background: 'linear-gradient(to right, #22d3ee, #a855f7)', color: 'black' }}
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

function ResultView(props: any) {
  const {
    result,
    resultTab,
    setResultTab,
    source,
    promptState,
    generateAgain,
    outputType,
    setOutputType,
    download,
    editInImageStudio,
    editInVideoStudio,
    publish,
    sharedMediaCount,
    isVideo,
    eligibleModes,
    mode,
    setMode,
  } = props

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white">Your Personalized Content Is Ready</h3>
        <p className="text-xs mt-1 text-white/40">Original on the left, personalized result on the right.</p>
      </div>

      {/* Result tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-px">
        {(result.type === 'prompt'
          ? ['prompt']
          : result.type === 'image'
          ? ['prompt', 'images']
          : ['prompt', 'videos']
        ).map((tab: string) => (
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
              <CopyButton text={promptState.original} label="Copy" />
            </div>
            <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-white/70">{promptState.original}</pre>
          </div>
          <div className="rounded-xl border border-cyan-400/20 bg-black/30 p-4">
            <div className="mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Personalized Prompt</span>
            </div>
            <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-white/90">
              {promptState.edited || promptState.personalized || promptState.original}
            </pre>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={generateAgain}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
              style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee' }}
            >
              <RefreshCw size={14} /> Generate Again
            </button>
            {result.type !== 'video' && (
              <button
                onClick={() => setOutputType('video')}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border border-white/10 text-white hover:bg-white/5"
              >
                <Video size={14} /> Generate Video
              </button>
            )}
            {result.type !== 'image' && (
              <button
                onClick={() => setOutputType('image')}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border border-white/10 text-white hover:bg-white/5"
              >
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
            <button onClick={download} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border border-white/10 text-white hover:bg-white/5">
              <Download size={14} /> Download
            </button>
            <button onClick={editInImageStudio} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border border-white/10 text-white hover:bg-white/5">
              <Image size={14} /> Edit in Image Studio
            </button>
            <button onClick={publish} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee' }}>
              <Share2 size={14} /> Publish
            </button>
            <button onClick={generateAgain} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border border-white/10 text-white hover:bg-white/5">
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
            <button onClick={download} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border border-white/10 text-white hover:bg-white/5">
              <Download size={14} /> Download
            </button>
            <button onClick={editInVideoStudio} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border border-white/10 text-white hover:bg-white/5">
              <Video size={14} /> Edit in Video Studio
            </button>
            <button onClick={publish} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee' }}>
              <Share2 size={14} /> Publish
            </button>
            <button onClick={generateAgain} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border border-white/10 text-white hover:bg-white/5">
              <RefreshCw size={14} /> Generate Again
            </button>
          </div>
          {isVideo && eligibleModes.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
              <span className="text-xs text-white/40 self-center mr-2">Try another mode:</span>
              {eligibleModes.filter((m: any) => m.key !== mode).map((m: any) => (
                <button
                  key={m.key}
                  onClick={() => { setMode(m.key); generateAgain() }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 border border-white/10"
                >
                  {m.label}
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
          <span className="text-xs text-white/60">Saved to Shared Media ({sharedMediaCount} total entries)</span>
        </div>
      </div>
    </div>
  )
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* ignore */ }
      }}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10"
    >
      <Copy size={12} /> {copied ? 'Copied!' : label}
    </button>
  )
}

// ── Configuration view (the main editing UI) ─────────────────────────────────

function ConfigurationView(props: any) {
  const {
    // Source + Client
    source, sourceTypeLabel, clients, selectedClientId, clientForm,
    selectClient, saveClient, deleteClient, updateClientForm,
    // Assets
    assets,
    addIdentityFiles, removeIdentity, setPrimaryIdentity,
    addLogoFiles, removeLogo, setPrimaryLogo,
    addProductFiles, removeProduct,
    addBrandReferenceFiles, removeBrandReference,
    setFirstFrameFile, removeFirstFrame,
    setLastFrameFile, removeLastFrame,
    setCtaGraphicFile, removeCtaGraphic,
    retryAssetUpload,
    // Prompt
    promptState, updatePersonalizedPrompt, resetPrompt,
    isPersonalizing, isRegenerating,
    handlePersonalize, handleRegenerate, handleCopyPrompt, copiedPrompt,
    canPersonalize,
    // Output + Mode
    outputOptions, outputType, setOutputType,
    showModes, eligibleModes, mode, setMode,
    // Engine
    showAdvanced, setShowAdvanced, genOptions, updateGenOptions,
    // Generate
    generate, closePersonalize, isReadyToGenerate,
  } = props

  const isVideo = source.mediaType === 'video'
  const isImage = source.mediaType === 'image'
  const isPromptOnly = source.mediaType === 'prompt-only'

  return (
    <div className="p-6 space-y-8">
      {/* ── ROW 1: Source Demo | Client Profile (two columns) ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Demo */}
        <div>
          <SectionHeading title="Source Demo" />
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
                <FileText size={32} className="text-white/20" />
              </div>
            )}
            <div className="p-4 space-y-1.5">
              <h4 className="text-sm font-semibold text-white line-clamp-2">{source.title}</h4>
              {sourceTypeLabel && (
                <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>
                  {sourceTypeLabel}
                </span>
              )}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                {source.category && <div><span className="text-white/40">Category:</span> <span className="text-white/80">{source.category}</span></div>}
                {source.aspectRatio && <div><span className="text-white/40">Aspect:</span> <span className="text-white/80">{source.aspectRatio}</span></div>}
                {source.durationLabel && <div><span className="text-white/40">Duration:</span> <span className="text-white/80">{source.durationLabel}</span></div>}
              </div>
            </div>
          </div>
        </div>

        {/* Client Profile */}
        <div className="space-y-4">
          <div>
            <SectionHeading title="Who Is This For?" />
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'me', label: 'ME', icon: User },
                { key: 'my-business', label: 'BUSINESS', icon: Building2 },
                { key: 'customer', label: 'CLIENT', icon: Users },
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
          <div>
            <SectionHeading title="Client Profile" />
            <div className="space-y-3">
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
                <button
                  onClick={() => { selectClient(''); updateClientForm({ ...clientForm, id: '', name: '', businessName: '' }) }}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/70 hover:bg-white/10"
                >
                  New
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ClientField label="Business Name" value={clientForm.businessName} placeholder="ABC Roofing" onChange={(v) => updateClientForm({ ...clientForm, businessName: v })} full />
                <ClientField label="Industry" value={clientForm.industry} placeholder="Roofing" onChange={(v) => updateClientForm({ ...clientForm, industry: v })} />
                <ClientField label="Location" value={clientForm.location} placeholder="Tampa, Florida" onChange={(v) => updateClientForm({ ...clientForm, location: v })} />
                <ClientField label="Phone" value={clientForm.phone} placeholder="555-555-5555" onChange={(v) => updateClientForm({ ...clientForm, phone: v })} />
                <ClientField label="Website" value={clientForm.website} placeholder="abcroofing.com" onChange={(v) => updateClientForm({ ...clientForm, website: v })} full />
              </div>
              <div className="flex gap-2">
                <button onClick={saveClient} className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee' }}>
                  <Save size={14} /> {selectedClientId ? 'Update Client' : 'Save Client'}
                </button>
                {selectedClientId && (
                  <button onClick={() => deleteClient(selectedClientId)} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-400/10 border border-red-400/20">
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CLIENT ASSETS (full width, 6 cards in 2x3) ──────────────── */}
      <div>
        <SectionHeading
          title="Client Assets"
          description="Add the people, products, branding and visual references SmartVideo should use when personalizing this demo."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Person / Presenter */}
          <AssetCardFrame>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">👤</span>
              <h4 className="text-sm font-semibold text-white">Person / Presenter</h4>
            </div>
            <p className="text-xs text-white/50 mb-4">
              Upload one or more photos of the person who should appear in the content.
            </p>
            <UploadDropZone
              label="Add Photos"
              hint="Drag & drop or browse"
              onFiles={addIdentityFiles}
              multiple
            />
            {assets.identities.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Your Photos</p>
                <div className="grid grid-cols-4 gap-2">
                  {assets.identities.map((asset: PersonalizationAsset) => (
                    <AssetThumb
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
              </div>
            )}
            <p className="text-[10px] text-white/30 mt-3 italic">Recommended: Face + Full Body + 3/4</p>
          </AssetCardFrame>

          {/* Logo */}
          <AssetCardFrame>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🏷</span>
              <h4 className="text-sm font-semibold text-white">Logo</h4>
            </div>
            <p className="text-xs text-white/50 mb-4">
              Upload the client&apos;s exact logo for exact branding.
            </p>
            <UploadDropZone
              label="Upload Logo"
              hint="Drag & drop or browse"
              onFiles={addLogoFiles}
            />
            {assets.logos.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  {assets.logos.map((asset: PersonalizationAsset) => (
                    <AssetThumb
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
                <p className="text-[10px] text-cyan-300 font-semibold mt-2">★ PRIMARY — FINAL OVERLAY</p>
              </div>
            )}
          </AssetCardFrame>

          {/* Products / Services */}
          <AssetCardFrame>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">📦</span>
              <h4 className="text-sm font-semibold text-white">Products / Services</h4>
            </div>
            <p className="text-xs text-white/50 mb-4">
              Add products, finished work, locations or service images.
            </p>
            <UploadDropZone
              label="Add Images"
              hint="Drag & drop or browse"
              onFiles={addProductFiles}
              multiple
            />
            {assets.products.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {assets.products.map((asset: PersonalizationAsset, i: number) => (
                  <AssetThumb
                    key={asset.id}
                    asset={asset}
                    onRemove={() => removeProduct(asset.id)}
                    onRetry={() => retryAssetUpload(asset.id)}
                  />
                ))}
                <UploadDropZone label="+ Add More" onFiles={addProductFiles} multiple compact />
              </div>
            )}
          </AssetCardFrame>

          {/* Brand References */}
          <AssetCardFrame>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🏢</span>
              <h4 className="text-sm font-semibold text-white">Brand References</h4>
            </div>
            <p className="text-xs text-white/50 mb-4">
              Show SmartVideo what the client&apos;s business and brand look like.
            </p>
            <UploadDropZone
              label="Add Images"
              hint="Drag & drop or browse"
              onFiles={addBrandReferenceFiles}
              multiple
            />
            {assets.brandReferences.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {assets.brandReferences.map((asset: PersonalizationAsset) => (
                  <AssetThumb
                    key={asset.id}
                    asset={asset}
                    onRemove={() => removeBrandReference(asset.id)}
                    onRetry={() => retryAssetUpload(asset.id)}
                  />
                ))}
                <UploadDropZone label="+ Add More" onFiles={addBrandReferenceFiles} multiple compact />
              </div>
            )}
            <p className="text-[10px] text-white/30 mt-3 italic">
              Store • Office • Truck • Uniform • Packaging • Brand Photography
            </p>
          </AssetCardFrame>

          {/* First Frame */}
          <AssetCardFrame>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🎬</span>
              <h4 className="text-sm font-semibold text-white">First Frame</h4>
            </div>
            <p className="text-xs text-white/50 mb-4">
              Control how the personalized video begins.
            </p>
            {!assets.firstFrame ? (
              <UploadDropZone
                label="Upload Image"
                onFiles={setFirstFrameFile}
              />
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  <AssetThumb
                    asset={assets.firstFrame}
                    onRemove={removeFirstFrame}
                    onRetry={() => retryAssetUpload(assets.firstFrame!.id)}
                  />
                </div>
                <p className="text-[10px] text-white/40 mt-2">FIRST FRAME</p>
              </div>
            )}
          </AssetCardFrame>

          {/* Last Frame / CTA */}
          <AssetCardFrame>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🎯</span>
              <h4 className="text-sm font-semibold text-white">Last Frame / CTA</h4>
            </div>
            <p className="text-xs text-white/50 mb-4">
              Control how the personalized video ends.
            </p>
            {!assets.lastFrame ? (
              <UploadDropZone
                label="Upload Image"
                onFiles={setLastFrameFile}
              />
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  <AssetThumb
                    asset={assets.lastFrame}
                    onRemove={removeLastFrame}
                    onRetry={() => retryAssetUpload(assets.lastFrame!.id)}
                  />
                </div>
                <p className="text-[10px] text-white/40 mt-2">LAST FRAME</p>
              </div>
            )}
          </AssetCardFrame>
        </div>
      </div>

      {/* ── CTA & BUSINESS CONTENT (full width) ────────────────────── */}
      <div>
        <SectionHeading title="CTA & Business Content" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ClientField label="Product / Service" value={clientForm.productService} placeholder="Residential Roof Replacement" onChange={(v) => updateClientForm({ ...clientForm, productService: v })} />
          <ClientField label="Offer" value={clientForm.offer} placeholder="Free Roof Inspection" onChange={(v) => updateClientForm({ ...clientForm, offer: v })} />
          <ClientField label="CTA Headline" value={clientForm.callToAction} placeholder="Protect Your Home Today" onChange={(v) => updateClientForm({ ...clientForm, callToAction: v })} />
          <ClientField label="Button / Action" value={clientForm.callToAction} placeholder="Book Your Inspection" onChange={(v) => updateClientForm({ ...clientForm, callToAction: v })} />
          <ClientField label="Phone" value={clientForm.phone} placeholder="555-555-5555" onChange={(v) => updateClientForm({ ...clientForm, phone: v })} />
          <ClientField label="Website" value={clientForm.website} placeholder="abcroofing.com" onChange={(v) => updateClientForm({ ...clientForm, website: v })} />
        </div>
        <div className="mt-4">
          <p className="text-[11px] uppercase tracking-wider text-white/40 mb-2">CTA Graphic</p>
          {!assets.ctaGraphic ? (
            <UploadDropZone label="Upload CTA Graphic" hint="Drag & drop or browse" onFiles={setCtaGraphicFile} />
          ) : (
            <div className="space-y-2">
              <div className="max-w-[200px]">
                <AssetThumb
                  asset={assets.ctaGraphic}
                  onRemove={removeCtaGraphic}
                  onRetry={() => retryAssetUpload(assets.ctaGraphic!.id)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── PERSONALIZE THE PROMPT (full width, original vs personalized) ── */}
      <div>
        <SectionHeading title="Personalize The Prompt" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-2">Original Prompt</p>
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 min-h-[140px]">
              <p className="text-sm leading-6 text-white/70 whitespace-pre-wrap break-words">
                {promptState.original || 'No original prompt available.'}
              </p>
              <p className="text-[10px] text-white/30 mt-3 italic">
                Preserve camera, motion, pacing, lighting and style.
              </p>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-cyan-300 font-semibold mb-2">Personalized Prompt</p>
            <textarea
              value={promptState.edited || promptState.personalized}
              onChange={(e) => updatePersonalizedPrompt(e.target.value)}
              rows={6}
              placeholder="Click Personalize Prompt to generate a client-specific version."
              className="w-full rounded-xl border border-cyan-400/20 bg-black/30 p-4 text-sm leading-6 text-white/90 outline-none resize-y"
              style={{ caretColor: '#22d3ee' }}
            />
            <p className="text-[10px] text-white/30 mt-1">Editable before generation.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={handlePersonalize}
            disabled={!canPersonalize || isPersonalizing}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-50"
            style={{ background: 'linear-gradient(to right, #22d3ee, #a855f7)', color: 'black' }}
          >
            {isPersonalizing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Personalize Prompt
          </button>
          <button
            onClick={handleRegenerate}
            disabled={!canPersonalize || isRegenerating || !promptState.personalized}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 border border-white/10 disabled:opacity-50"
          >
            <RefreshCw size={12} className={isRegenerating ? 'animate-spin' : ''} /> Regenerate
          </button>
          <button
            onClick={handleCopyPrompt}
            disabled={!promptState.personalized}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 border border-white/10 disabled:opacity-50"
          >
            <Copy size={12} /> {copiedPrompt ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={resetPrompt}
            disabled={!promptState.personalized}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 border border-white/10 disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ── WHAT DO YOU WANT TO CREATE? (full width) ────────────────── */}
      {!isPromptOnly && (
        <div>
          <SectionHeading title="What Do You Want To Create?" />
          <div className="grid grid-cols-3 gap-3">
            {outputOptions.map(({ key, label, icon: Icon }: any) => (
              <button
                key={key}
                onClick={() => setOutputType(key)}
                className={classNames(
                  'flex flex-col items-center gap-2 rounded-xl border p-4 transition-all',
                  outputType === key ? 'border-cyan-400/50 bg-cyan-400/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/5',
                )}
              >
                <Icon size={22} style={{ color: outputType === key ? '#22d3ee' : 'rgba(255,255,255,0.4)' }} />
                <span className="text-sm font-semibold" style={{ color: outputType === key ? '#22d3ee' : 'rgba(255,255,255,0.7)' }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── PERSONALIZATION MODE (full width, 2x2 grid) ──────────────── */}
      {showModes && (
        <div>
          <SectionHeading title={isVideo ? 'Personalization Mode' : 'Image Personalization Mode'} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {eligibleModes.map((m: any) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={classNames(
                  'p-4 rounded-xl text-left transition-all border',
                  mode === m.key ? 'border-cyan-400/50 bg-cyan-400/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/5',
                )}
              >
                <p className="text-sm font-bold" style={{ color: mode === m.key ? '#22d3ee' : 'white' }}>{m.label}</p>
                <p className="text-xs mt-1.5 text-white/50">{m.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── ENGINE: SmartVideo Recommended (full width) ─────────────── */}
      <div>
        <SectionHeading title="Engine" />
        <div className="rounded-xl border border-cyan-400/20 p-5" style={{ background: 'rgba(34,211,238,0.04)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,211,238,0.15)' }}>
              <Sparkles size={18} style={{ color: '#22d3ee' }} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">✨ SmartVideo Recommended</p>
              <p className="text-xs text-white/50 mt-1">
                SmartVideo automatically chooses the best generation path for your selected content, personalization mode and assets.
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-xs font-medium text-white/50 hover:text-white mt-3"
        >
          <ChevronDown size={14} className={classNames('transition-transform', showAdvanced && 'rotate-180')} />
          Advanced Settings
        </button>
        {showAdvanced && (
          <div className="grid grid-cols-2 gap-3 p-4 mt-2 rounded-xl border border-white/10 bg-black/20">
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

      {/* ── CONSENT (full width) ─────────────────────────────────────── */}
      {mode && ['face_only', 'full_body', 'replace_face', 'replace_person'].includes(mode) && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-white/10 bg-black/20">
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

      {/* ── ACTION BAR (full width, centered) ────────────────────────── */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-white/10">
        <button
          onClick={closePersonalize}
          className="rounded-xl px-5 py-3 text-sm font-semibold text-white/70 hover:text-white hover:bg-white/5"
        >
          Cancel
        </button>
        <button
          onClick={generate}
          disabled={!isReadyToGenerate}
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold disabled:opacity-50 transition-all"
          style={{ background: 'linear-gradient(to right, #22d3ee, #a855f7)', color: 'black' }}
        >
          <Sparkles size={16} />
          {outputType === 'prompt' ? 'Personalize Prompt' : outputType === 'image' ? 'Generate Image' : outputType === 'video' ? 'Personalize Video' : 'Generate Everything'}
        </button>
      </div>
    </div>
  )
}

function ClientField({
  label,
  value,
  placeholder,
  onChange,
  full = false,
}: {
  label: string
  value: any
  placeholder: string
  onChange: (v: string) => void
  full?: boolean
}) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1">{label}</label>
      <input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20"
      />
    </div>
  )
}
