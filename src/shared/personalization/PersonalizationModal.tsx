/**
 * PersonalizationModal
 *
 * Context-driven modal for the SmartVideo personalization workflow.
 * Implements the approved full-width design hierarchy (HTML source of truth).
 *
 * Design tokens mirror the approved HTML:
 *   --bg: #080b0f, --modal: #101419, --panel: #151a20, --panel-soft: #12171c
 *   --cyan: #29d3f2, --cyan-soft: rgba(41,211,242,.12)
 *   radii: 22px modal, 16px panels, 12px zones, 9px thumbs
 *
 * Keeps all functional features wired through the existing context:
 *   - durable uploads via uploadFile()
 *   - generation via runGeneration() / runPersonalization()
 *   - prompt personalization via personalizePrompt()
 *   - client CRUD via clientProfile helpers
 *   - Image/Video Studio handoffs via writeHandoff() + next/navigation
 *   - Publish via SocialPublishProvider
 *   - Shared Media registration via sharedMedia
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
  Copy,
  Download,
  RefreshCw,
  Loader2,
  Save,
  Trash2,
  AlertTriangle,
  Share2,
} from 'lucide-react'
import { useDemoPersonalize } from './DemoPersonalizeProvider'
import type { PersonalizationAsset } from './types'

// Niche-specific CTA copy
import { NICHE_CTA_BY_ID } from '@/components/landing/landingData'

// ── Design tokens (mirror the approved HTML CSS variables) ──────────────────

const C = {
  bg: '#080b0f',
  modal: '#101419',
  panel: '#151a20',
  panelSoft: '#12171c',
  field: '#0d1116',
  border: 'rgba(255,255,255,.10)',
  borderStrong: 'rgba(255,255,255,.16)',
  text: '#f7f9fb',
  muted: 'rgba(255,255,255,.58)',
  muted2: 'rgba(255,255,255,.36)',
  cyan: '#29d3f2',
  cyanSoft: 'rgba(41,211,242,.12)',
  cyanBorder: 'rgba(41,211,242,.45)',
  green: '#28c98b',
  danger: '#ef5b67',
} as const

// ── Domain constants ────────────────────────────────────────────────────────

const VIDEO_MODES = [
  { key: 'face_only', label: 'Face Only', description: 'Keep the original body, clothing, movement, scene and timing. Change face.' },
  { key: 'full_body', label: 'Full Presenter', description: 'Replace the presenter with the uploaded person where supported.' },
  { key: 'recreate', label: 'Recreate For Client', description: 'Recreate the viral concept using this client\'s assets and personalized prompt.' },
  { key: 'complete', label: 'Complete Personalization', description: 'Person + products + brand + logo + CTA + prompt.' },
] as const

const IMAGE_MODES = [
  { key: 'keep_design', label: 'Keep This Design', description: 'Use the original image as the visual base.' },
  { key: 'replace_face', label: 'Replace Face', description: 'Keep the design and replace the face.' },
  { key: 'replace_person', label: 'Replace Person', description: 'Replace or recreate the person while preserving the composition.' },
  { key: 'recreate', label: 'Recreate For Client', description: 'Use the original concept and personalized prompt for a fresh client-specific image.' },
  { key: 'complete', label: 'Complete Personalization', description: 'Use client identity, products, brand references, logo, and exact text/logo overlays.' },
] as const

const OUTPUT_OPTIONS_VIDEO = [
  { key: 'prompt', label: 'Prompt', description: 'Create a personalized prompt only.' },
  { key: 'video', label: 'Video', description: 'Generate a personalized video.' },
  { key: 'everything', label: 'Everything', description: 'Prompt + Video + Assets + CTA.' },
] as const

const OUTPUT_OPTIONS_IMAGE = [
  { key: 'prompt', label: 'Prompt', description: 'Create a personalized prompt only.' },
  { key: 'image', label: 'Image', description: 'Generate a personalized image.' },
  { key: 'everything', label: 'Everything', description: 'Prompt + Image + Assets + CTA.' },
] as const

const OUTPUT_OPTIONS_PROMPT = [
  { key: 'prompt', label: 'Prompt', description: 'Create a personalized prompt only.' },
] as const

// ── Helpers ──────────────────────────────────────────────────────────────────

function classNames(...classes: (string | boolean | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

function Field({ label, value, placeholder, onChange, full = false }: { label: string; value: any; placeholder: string; onChange: (v: string) => void; full?: boolean }) {
  return (
    <div className={full ? 'col-span-full' : ''}>
      <label style={{ display: 'block', marginBottom: 6, color: C.muted, fontSize: 10 }}>{label}</label>
      <input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full outline-none"
        style={{
          minHeight: 40,
          padding: '0 11px',
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          background: C.field,
          color: C.text,
        }}
      />
    </div>
  )
}

// ── Reusable sub-components ──────────────────────────────────────────────────

/** Upload drop zone matching the approved HTML design. */
function UploadZone({
  primary,
  secondary,
  onFiles,
  multiple = false,
  disabled,
}: {
  primary: string
  secondary?: string
  onFiles: (files: FileList | null) => void
  multiple?: boolean
  disabled?: boolean
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
        'grid place-items-center text-center rounded-[12px] border border-dashed transition-colors cursor-pointer min-h-[106px] px-3 py-3',
        isDragOver
          ? 'border-[var(--cyan-border)] bg-[rgba(41,211,242,.04)]'
          : 'border-[rgba(255,255,255,.22)] bg-[rgba(0,0,0,.16)] hover:border-[var(--cyan-border)] hover:bg-[rgba(41,211,242,.04)]',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
      style={{ ['--cyan-border' as any]: C.cyanBorder }}
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
      <div>
        <div style={{ fontSize: 24, marginBottom: 4, color: 'rgba(255,255,255,.72)' }}>⇧</div>
        <div className="text-[11px] font-extrabold uppercase tracking-wide text-white">{primary}</div>
        {secondary && <div className="text-[10px] text-[rgba(255,255,255,.36)] mt-0.5">{secondary}</div>}
      </div>
    </div>
  )
}

/** Thumb pill for placeholder slots in the asset cards. */
function ThumbPlaceholder({ label, add = false }: { label: string; add?: boolean }) {
  return (
    <div
      className={classNames(
        'w-[82px] min-h-[86px] rounded-[9px] border overflow-hidden flex items-end justify-center p-1.5 text-[9px] font-extrabold',
      )}
      style={{
        borderColor: add ? 'rgba(255,255,255,.22)' : C.border,
        background: add ? 'rgba(0,0,0,.10)' : 'linear-gradient(145deg, #3b4652, #151a20)',
        color: add ? C.muted : 'white',
        alignItems: add ? 'center' : 'flex-end',
        justifyContent: 'center',
        fontSize: add ? 22 : 9,
        borderStyle: add ? 'dashed' : 'solid',
      }}
    >
      {label}
    </div>
  )
}

/** Uploaded asset thumb with status overlays and actions. */
function ThumbUploaded({
  asset,
  label,
  onRemove,
  onRetry,
  light = false,
}: {
  asset: PersonalizationAsset
  label?: string
  onRemove?: () => void
  onRetry?: () => void
  light?: boolean
}) {
  const status = asset.uploadStatus
  const isUploading = status === 'uploading'
  const isError = status === 'error'
  const isReady = status === 'ready'
  const displayUrl = asset.uploadedUrl || asset.url

  return (
    <div
      className="relative w-[82px] min-h-[86px] rounded-[9px] border overflow-hidden flex items-end justify-center p-1.5 group"
      style={{
        borderColor: C.border,
        background: light ? '#f6f7f9' : 'linear-gradient(145deg, #3b4652, #151a20)',
        color: light ? '#101820' : 'white',
      }}
    >
      {isUploading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
          <Loader2 size={14} className="animate-spin text-white" />
        </div>
      )}
      {isError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-red-900/40 p-1">
          {onRetry && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRetry() }}
              className="rounded bg-white/20 px-1.5 py-0.5 text-[8px] text-white hover:bg-white/30"
            >
              Retry
            </button>
          )}
        </div>
      )}
      {isReady && (
        <div className="absolute top-0.5 right-0.5 z-10 flex items-center gap-0.5 rounded-full bg-emerald-500/90 px-1.5 py-0.5">
          <span className="text-[7px] font-bold text-white">✓</span>
        </div>
      )}
      {displayUrl ? (
        <img src={displayUrl} alt={asset.name} className="absolute inset-0 w-full h-full object-cover" />
      ) : null}
      {label && (
        <span className="relative text-[9px] font-extrabold z-[1]" style={{ color: light ? '#101820' : 'white' }}>
          {label}
        </span>
      )}
      {onRemove && !isError && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="absolute top-0.5 right-0.5 z-20 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(239,91,103,.85)' }}
        >
          <X size={8} className="text-white" />
        </button>
      )}
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
    retryBranding,
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
  const previousActiveElementRef = useRef<HTMLElement | null>(null)

  // ── Focus trap & Escape ──────────────────────────────────────────────────

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

  const isVideo = source.mediaType === 'video'
  const isImage = source.mediaType === 'image'
  const isPromptOnly = source.mediaType === 'prompt-only'
  const eligibleModes: readonly any[] = isVideo ? VIDEO_MODES : isImage ? IMAGE_MODES : []
  const outputOptions = isVideo ? OUTPUT_OPTIONS_VIDEO : isImage ? OUTPUT_OPTIONS_IMAGE : OUTPUT_OPTIONS_PROMPT
  const showModes = outputType !== 'prompt' && eligibleModes.length > 0

  // Niche CTA copy
  const nicheId = typeof (source as any)?.sourceMetadata?.nicheId === 'string'
    ? ((source as any).sourceMetadata.nicheId as string)
    : null
  const nicheCta = nicheId ? NICHE_CTA_BY_ID[nicheId] : null
  const headerTitle = nicheCta?.ctaHeading ?? 'PERSONALIZE THIS DEMO'
  const headerSubtitle = nicheCta?.ctaBody ?? 'Turn this demo into a custom version for yourself, your business, or a customer. Personalize the person, branding, products, prompt, offer and CTA.'

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
    try { await personalizePrompt() } finally { setIsPersonalizing(false) }
  }, [personalizePrompt])

  const handleRegenerate = useCallback(async () => {
    setIsRegenerating(true)
    try { await personalizePrompt() } finally { setIsRegenerating(false) }
  }, [personalizePrompt])

  const personalizationInProgress =
    generation.status === 'generating' || generation.status === 'personalizing-prompt'

  const generateLabel = outputType === 'prompt'
    ? '✦ Personalize Prompt'
    : outputType === 'image'
    ? '✦ Generate Image'
    : outputType === 'video'
    ? '✦ Personalize Video'
    : '✦ Generate Everything'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5"
      style={{
        background: 'radial-gradient(circle at top, rgba(41,211,242,.07), transparent 30%), #07090d',
      }}
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
        className="w-full max-w-[1240px] overflow-hidden shadow-2xl flex flex-col"
        style={{
          background: C.modal,
          border: `1px solid ${C.borderStrong}`,
          borderRadius: 22,
          maxHeight: '94vh',
          boxShadow: '0 30px 90px rgba(0,0,0,.65), 0 0 0 1px rgba(255,255,255,.025)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <header
          className="flex items-start justify-between gap-6 flex-shrink-0"
          style={{ padding: '24px 28px', borderBottom: `1px solid ${C.border}` }}
        >
          <div className="flex gap-3.5 min-w-0">
            <div
              className="w-[42px] h-[42px] rounded-[13px] flex items-center justify-center flex-shrink-0"
              style={{ background: C.cyanSoft, color: C.cyan, fontSize: 20 }}
            >
              ✦
            </div>
            <div>
              <h1
                id="personalize-title"
                className="text-[19px] leading-[1.1] tracking-tight font-bold m-0"
                style={{ color: C.text }}
              >
                {headerTitle}
              </h1>
              <p
                className="mt-1.5 max-w-[760px] text-[13px] leading-[1.55]"
                style={{ color: C.muted }}
              >
                {headerSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closePersonalize}
            disabled={personalizationInProgress}
            className="w-[38px] h-[38px] border-0 rounded-[10px] text-[22px] flex items-center justify-center transition-colors disabled:opacity-50 flex-shrink-0"
            style={{ background: 'transparent', color: C.muted }}
            aria-label="Close personalization modal"
          >
            ×
          </button>
        </header>

        {/* ── BODY ──────────────────────────────────────────────────── */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ padding: '0 26px' }}
        >
          {generation.status === 'complete' && result ? (
            <ResultView
              result={result}
              resultTab={resultTab}
              setResultTab={setResultTab}
              source={source}
              promptState={promptState}
              generateAgain={generateAgain}
              retryBranding={retryBranding}
              outputType={outputType}
              setOutputType={setOutputType}
              download={download}
              editInImageStudio={editInImageStudio}
              editInVideoStudio={editInVideoStudio}
              publish={publish}
              sharedMediaCount={sharedMediaEntries?.length || 0}
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
              source={source}
              sourceTypeLabel={sourceTypeLabel}
              clients={clients}
              selectedClientId={selectedClientId}
              clientForm={clientForm}
              selectClient={selectClient}
              saveClient={saveClient}
              deleteClient={deleteClient}
              updateClientForm={updateClientForm}
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
              outputOptions={outputOptions as any}
              outputType={outputType}
              setOutputType={setOutputType}
              isPromptOnly={isPromptOnly}
              showModes={showModes}
              eligibleModes={eligibleModes as any}
              mode={mode}
              setMode={setMode}
              showAdvanced={showAdvanced}
              setShowAdvanced={setShowAdvanced}
              genOptions={genOptions}
              updateGenOptions={updateGenOptions}
              generate={generate}
              closePersonalize={closePersonalize}
              isReadyToGenerate={Boolean((clientForm.businessName || clientForm.name) && (outputType === 'prompt' || mode))}
            />
          )}
        </main>

        {/* ── STICKY FOOTER ────────────────────────────────────────── */}
        {!personalizationInProgress && generation.status !== 'complete' && generation.status !== 'error' && (
          <footer
            className="flex justify-end gap-2.5 flex-shrink-0"
            style={{
              padding: '18px 26px 22px',
              borderTop: `1px solid ${C.border}`,
              background: '#0e1216',
            }}
          >
            <button
              onClick={closePersonalize}
              className="rounded-[10px] text-[11px] font-extrabold uppercase tracking-wide"
              style={{
                minHeight: 42,
                padding: '0 19px',
                border: `1px solid ${C.border}`,
                background: C.panel,
                color: 'white',
              }}
            >
              Cancel
            </button>
            <button
              onClick={generate}
              disabled={!Boolean((clientForm.businessName || clientForm.name) && (outputType === 'prompt' || mode))}
              className="rounded-[10px] text-[11px] font-extrabold uppercase tracking-wide disabled:opacity-50"
              style={{
                minWidth: 190,
                minHeight: 42,
                padding: '0 19px',
                border: `1px solid ${C.cyan}`,
                background: C.cyan,
                color: '#041014',
                boxShadow: '0 8px 26px rgba(41,211,242,.18)',
              }}
            >
              {generateLabel}
            </button>
          </footer>
        )}
      </div>
    </div>
  )
}

// ── Sub-views ────────────────────────────────────────────────────────────────

function ProgressView({ status, progress, message }: { status: string; progress: number; message: string }) {
  return (
    <div className="px-6 py-16 text-center space-y-4">
      <Loader2 size={40} className="mx-auto animate-spin" style={{ color: C.cyan }} />
      <h3 className="text-lg font-bold text-white">{message || (status === 'personalizing-prompt' ? 'Personalizing Prompt...' : 'Generating...')}</h3>
      <div className="max-w-xs mx-auto">
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: `linear-gradient(to right, ${C.cyan}, #a855f7)` }} />
        </div>
        <p className="text-xs text-white/40 mt-1">{progress}%</p>
      </div>
    </div>
  )
}

function ErrorView({ errorMessage, retry, generate }: { errorMessage: string | null; retry: () => void; generate: () => void }) {
  return (
    <div className="px-6 py-16 text-center space-y-4">
      <AlertTriangle size={40} style={{ color: C.danger }} className="mx-auto" />
      <h3 className="text-lg font-bold text-white">We Could Not Complete This Personalization</h3>
      <p className="text-sm text-white/60 max-w-md mx-auto">{errorMessage || 'An unexpected error occurred.'}</p>
      <p className="text-xs text-white/40">Your client, assets, and settings have been preserved.</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={retry}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"
          style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: C.cyan }}
        >
          <RefreshCw size={14} /> Retry
        </button>
        <button
          onClick={generate}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"
          style={{ background: C.cyan, color: '#041014' }}
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

function ResultView(props: any) {
  const {
    result, resultTab, setResultTab, source, promptState,
    generateAgain, retryBranding, outputType, setOutputType, download,
    editInImageStudio, editInVideoStudio, publish,
    sharedMediaCount, isVideo, eligibleModes, mode, setMode,
  } = props

  return (
    <div className="py-6 space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white">Your Personalized Content Is Ready</h3>
        <p className="text-xs mt-1 text-white/40">Original on the left, personalized result on the right.</p>
      </div>
      <div className="flex gap-2 border-b border-white/10 pb-px">
        {(result.type === 'prompt' ? ['prompt'] : result.type === 'image' ? ['prompt', 'images'] : ['prompt', 'videos']).map((tab: string) => (
          <button
            key={tab}
            onClick={() => setResultTab(tab)}
            className={classNames('px-4 py-2 text-sm font-medium transition-colors', resultTab === tab ? 'text-cyan-300' : 'text-white/50 hover:text-white/80')}
            style={{ borderBottom: resultTab === tab ? `2px solid ${C.cyan}` : '2px solid transparent' }}
          >
            {tab === 'prompt' ? 'Prompt' : tab === 'images' ? 'Images' : 'Videos'}
          </button>
        ))}
      </div>

      {resultTab === 'prompt' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/40">Original Prompt</span>
              <button
                onClick={async () => { try { await navigator.clipboard.writeText(promptState.original) } catch { /* ignore */ } }}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10"
              >
                <Copy size={12} /> Copy
              </button>
            </div>
            <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-white/70">{promptState.original}</pre>
          </div>
          <div className="rounded-xl border border-cyan-400/20 bg-black/30 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>Personalized Prompt</span>
            <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-white/90 mt-2">
              {promptState.edited || promptState.personalized || promptState.original}
            </pre>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={generateAgain} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: C.cyan }}>
              <RefreshCw size={14} /> Generate Again
            </button>
          </div>
        </div>
      )}

      {resultTab === 'images' && result.type === 'image' && result.url && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <div className="p-2 border-b border-white/10"><span className="text-xs font-semibold text-white/40">ORIGINAL</span></div>
              {source.sourceMedia && <img src={source.sourceMedia} alt="Original" className="w-full object-contain" style={{ maxHeight: '50vh' }} />}
            </div>
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: C.cyanBorder }}>
              <div className="p-2 border-b" style={{ borderColor: C.cyanBorder }}><span className="text-xs font-semibold" style={{ color: C.cyan }}>PERSONALIZED</span></div>
              <img src={result.url} alt="Personalized" className="w-full object-contain" style={{ maxHeight: '50vh' }} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={download} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border border-white/10 text-white hover:bg-white/5">
              <Download size={14} /> Download
            </button>
            <button onClick={editInImageStudio} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border border-white/10 text-white hover:bg-white/5">
              Edit in Image Studio
            </button>
            <button onClick={publish} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: C.cyan }}>
              <Share2 size={14} /> Publish
            </button>
            <button onClick={generateAgain} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border border-white/10 text-white hover:bg-white/5">
              <RefreshCw size={14} /> Generate Again
            </button>
          </div>
        </div>
      )}

      {resultTab === 'videos' && result.type === 'video' && result.url && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <div className="p-2 border-b border-white/10"><span className="text-xs font-semibold text-white/40">ORIGINAL</span></div>
              {source.sourceMedia && <video src={source.sourceMedia} controls className="w-full" style={{ maxHeight: '50vh' }} />}
            </div>
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: C.cyanBorder }}>
              <div className="p-2 border-b" style={{ borderColor: C.cyanBorder }}><span className="text-xs font-semibold" style={{ color: C.cyan }}>PERSONALIZED</span></div>
              <video src={result.url} controls autoPlay className="w-full" style={{ maxHeight: '50vh' }} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={download} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border border-white/10 text-white hover:bg-white/5">
              <Download size={14} /> Download
            </button>
            <button onClick={editInVideoStudio} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border border-white/10 text-white hover:bg-white/5">
              Edit in Video Studio
            </button>
            <button onClick={publish} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: C.cyan }}>
              <Share2 size={14} /> Publish
            </button>
            <button onClick={generateAgain} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border border-white/10 text-white hover:bg-white/5">
              <RefreshCw size={14} /> Generate Again
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/60">✓ Saved to Shared Media ({sharedMediaCount} total entries)</span>
        </div>
      </div>

      {result.metadata?.postProcessingFailed && retryBranding && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-yellow-400" />
            <span className="text-sm font-bold text-yellow-300">Branding Could Not Be Applied</span>
          </div>
          <p className="text-xs text-white/60 mb-3">
            Your media was generated, but the exact logo or CTA overlay failed. Your original generation is preserved.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={retryBranding}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
              style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: C.cyan }}
            >
              <RefreshCw size={14} /> Retry Branding
            </button>
            {result.metadata?.originalUrl && (
              <button
                onClick={() => { window.open(result.metadata.originalUrl, '_blank') }}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold border border-white/10 text-white hover:bg-white/5"
              >
                <Download size={14} /> Download Unbranded Version
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Configuration view (main editing UI) ─────────────────────────────────────

function ConfigurationView(props: any) {
  const {
    source, clients, selectedClientId, clientForm,
    selectClient, saveClient, deleteClient, updateClientForm,
    assets,
    addIdentityFiles, removeIdentity, setPrimaryIdentity,
    addLogoFiles, removeLogo, setPrimaryLogo,
    addProductFiles, removeProduct,
    addBrandReferenceFiles, removeBrandReference,
    setFirstFrameFile, removeFirstFrame,
    setLastFrameFile, removeLastFrame,
    setCtaGraphicFile, removeCtaGraphic,
    retryAssetUpload,
    promptState, updatePersonalizedPrompt, resetPrompt,
    isPersonalizing, isRegenerating,
    handlePersonalize, handleRegenerate, handleCopyPrompt, copiedPrompt,
    canPersonalize,
    outputOptions, outputType, setOutputType, isPromptOnly,
    showModes, eligibleModes, mode, setMode,
    showAdvanced, setShowAdvanced, genOptions, updateGenOptions,
  } = props

  return (
    <div>
      {/* ── TOP OVERVIEW: Source Demo | Client Profile ────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2" style={{ padding: '26px 0', gap: 18, borderBottom: `1px solid ${C.border}` }}>
        {/* Source Demo */}
        <div className="panel" style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
          <h2 style={{ margin: '0 0 13px', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em' }}>Source Demo</h2>
          <div
            className="relative"
            style={{
              aspectRatio: '16 / 10',
              borderRadius: 13,
              overflow: 'hidden',
              background: 'linear-gradient(rgba(0,0,0,.24), rgba(0,0,0,.38)), linear-gradient(135deg, #303944, #12171c 70%)',
              border: `1px solid ${C.border}`,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {source.aspectRatio && (
              <div className="absolute" style={{ right: 10, top: 10, fontSize: 10, padding: '4px 6px', borderRadius: 6, background: 'rgba(0,0,0,.55)' }}>
                {source.aspectRatio}
              </div>
            )}
            <button
              className="w-[62px] h-[62px] rounded-full flex items-center justify-center text-2xl"
              style={{ border: '1px solid rgba(255,255,255,.3)', background: 'rgba(255,255,255,.18)', color: 'white', backdropFilter: 'blur(8px)' }}
              aria-label="Play source preview"
            >
              ▶
            </button>
          </div>
          <div className="mt-3 text-base font-bold">{source.title}</div>
          <div className="mt-1 text-[11px] uppercase" style={{ color: C.muted }}>
            {source.mediaType?.toUpperCase()} {source.aspectRatio ? `• ${source.aspectRatio}` : ''}
          </div>
        </div>

        {/* Client Profile */}
        <div className="panel" style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
          <h2 style={{ margin: '0 0 13px', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em' }}>Who Is This For?</h2>
          <div className="grid grid-cols-3" style={{ gap: 8, marginBottom: 18 }}>
            {[
              { key: 'me', label: 'Me' },
              { key: 'my-business', label: 'My Business' },
              { key: 'customer', label: 'Client' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => updateClientForm({ ...clientForm, audience: key })}
                className="rounded-lg text-[11px] font-extrabold uppercase tracking-wide"
                style={{
                  minHeight: 38,
                  border: `1px solid ${clientForm.audience === key ? C.cyan : C.border}`,
                  background: clientForm.audience === key ? C.cyan : '#11161b',
                  color: clientForm.audience === key ? '#051014' : C.text,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <h2 style={{ margin: '0 0 13px', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em' }}>Client Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 12 }}>
            <div className="col-span-full">
              <label style={{ display: 'block', marginBottom: 6, color: C.muted, fontSize: 10 }}>Select Existing Client</label>
              <div className="flex gap-2">
                <select
                  value={selectedClientId}
                  onChange={(e) => selectClient(e.target.value)}
                  className="flex-1 outline-none"
                  style={{
                    minHeight: 40,
                    padding: '0 11px',
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    background: C.field,
                    color: C.text,
                  }}
                >
                  <option value="">Select Existing Client</option>
                  {clients?.map?.((c: any) => (
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
            </div>
            <Field label="Business Name" value={clientForm.businessName} placeholder="ABC Roofing" onChange={(v) => updateClientForm({ ...clientForm, businessName: v })} />
            <Field label="Industry" value={clientForm.industry} placeholder="Roofing" onChange={(v) => updateClientForm({ ...clientForm, industry: v })} />
            <Field label="Location" value={clientForm.location} placeholder="Tampa, Florida" onChange={(v) => updateClientForm({ ...clientForm, location: v })} />
            <Field label="Phone" value={clientForm.phone} placeholder="555-555-5555" onChange={(v) => updateClientForm({ ...clientForm, phone: v })} />
            <Field label="Website" value={clientForm.website} placeholder="abcroofing.com" onChange={(v) => updateClientForm({ ...clientForm, website: v })} full />
            <div className="col-span-full flex gap-2">
              <button
                onClick={saveClient}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold"
                style={{ background: 'rgba(41,211,242,.12)', border: `1px solid ${C.cyanBorder}`, color: C.cyan }}
              >
                <Save size={14} /> {selectedClientId ? 'Update Client' : 'Save Client'}
              </button>
              {selectedClientId && (
                <button
                  onClick={() => deleteClient(selectedClientId)}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium border"
                  style={{ color: C.danger, borderColor: 'rgba(239,91,103,.25)' }}
                >
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── CLIENT ASSETS (full width, 6 numbered cards) ──────────── */}
      <section style={{ padding: '26px 0', borderBottom: `1px solid ${C.border}` }}>
        <h2 style={{ margin: 0, fontSize: 13, letterSpacing: '.05em', fontWeight: 800, textTransform: 'uppercase' }}>Client Assets</h2>
        <p style={{ margin: '6px 0 18px', color: C.muted, fontSize: 12, lineHeight: 1.5 }}>
          Add the people, products, branding and visual references SmartVideo should use when personalizing this demo.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14 }}>
          {/* 1. Person / Presenter */}
          <article className="asset-card" style={{ minHeight: 280, padding: 18, background: C.panelSoft, border: `1px solid ${C.border}`, borderRadius: 16 }}>
            <div className="flex gap-2.5 items-start" style={{ marginBottom: 14 }}>
              <div className="w-[35px] h-[35px] rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: C.cyanSoft, color: C.cyan, fontSize: 16 }}>👤</div>
              <div>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, textTransform: 'uppercase' }}>1. Person / Presenter</h3>
                <p style={{ margin: '5px 0 0', color: C.muted, fontSize: 11, lineHeight: 1.4 }}>Upload one or more photos of the person who should appear in the content.</p>
              </div>
            </div>
            <UploadZone primary="Add Photos" secondary="Drag & drop or browse" onFiles={addIdentityFiles} multiple />
            <div className="asset-label" style={{ marginTop: 13, marginBottom: 8, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: C.muted }}>Your Photos</div>
            <div className="flex flex-wrap gap-2">
              {assets.identities.length > 0 ? (
                assets.identities.map((asset: PersonalizationAsset) => (
                  <ThumbUploaded
                    key={asset.id}
                    asset={asset}
                    label={asset.name?.split('.')?.[0]?.toUpperCase()?.slice(0, 8) || 'PHOTO'}
                    onRemove={() => removeIdentity(asset.id)}
                    onRetry={() => retryAssetUpload(asset.id)}
                  />
                ))
              ) : (
                <>
                  <ThumbPlaceholder label="FACE" />
                  <ThumbPlaceholder label="BODY" />
                  <ThumbPlaceholder label="SIDE" />
                </>
              )}
              <ThumbPlaceholder label="+" add />
            </div>
            {assets.primaryIdentity && (
              <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px', borderRadius: 7, marginTop: 8, marginRight: 4, background: C.cyan, color: '#071014', fontSize: 9, fontWeight: 800, textTransform: 'uppercase' }}>★ Primary</span>
            )}
            <div style={{ marginTop: 9, color: C.muted2, fontSize: 10 }}>Recommended: Face + Full Body + 3/4</div>
          </article>

          {/* 2. Logo */}
          <article className="asset-card" style={{ minHeight: 280, padding: 18, background: C.panelSoft, border: `1px solid ${C.border}`, borderRadius: 16 }}>
            <div className="flex gap-2.5 items-start" style={{ marginBottom: 14 }}>
              <div className="w-[35px] h-[35px] rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: C.cyanSoft, color: C.cyan, fontSize: 16 }}>🏷</div>
              <div>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, textTransform: 'uppercase' }}>2. Logo</h3>
                <p style={{ margin: '5px 0 0', color: C.muted, fontSize: 11, lineHeight: 1.4 }}>Upload the client&apos;s exact logo for exact branding.</p>
              </div>
            </div>
            <UploadZone primary="Upload Logo" secondary="Drag & drop or browse" onFiles={addLogoFiles} />
            <div
              className="logo-preview"
              style={{
                marginTop: 12,
                height: 105,
                display: 'grid',
                placeItems: 'center',
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                background: assets.primaryLogo?.url ? '#fff' : '#f6f7f9',
                color: '#101820',
                fontSize: 12,
                fontWeight: 800,
                textAlign: 'center',
                padding: 8,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {assets.primaryLogo?.url ? (
                <img src={assets.primaryLogo.uploadedUrl || assets.primaryLogo.url} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900 }}>{clientForm.businessName?.toUpperCase() || 'LOGO PREVIEW'}</div>
                  {clientForm.businessName && <small style={{ fontSize: 10, fontWeight: 600, color: '#444' }}>Built on Trust</small>}
                </div>
              )}
            </div>
            {assets.primaryLogo && (
              <>
                <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px', borderRadius: 7, marginTop: 8, marginRight: 4, background: C.cyan, color: '#071014', fontSize: 9, fontWeight: 800, textTransform: 'uppercase' }}>★ Primary</span>
                <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px', borderRadius: 7, marginTop: 8, marginRight: 4, background: C.cyan, color: '#071014', fontSize: 9, fontWeight: 800, textTransform: 'uppercase' }}>Final Overlay</span>
              </>
            )}
          </article>

          {/* 3. Products / Services */}
          <article className="asset-card" style={{ minHeight: 280, padding: 18, background: C.panelSoft, border: `1px solid ${C.border}`, borderRadius: 16 }}>
            <div className="flex gap-2.5 items-start" style={{ marginBottom: 14 }}>
              <div className="w-[35px] h-[35px] rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: C.cyanSoft, color: C.cyan, fontSize: 16 }}>📦</div>
              <div>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, textTransform: 'uppercase' }}>3. Products / Services</h3>
                <p style={{ margin: '5px 0 0', color: C.muted, fontSize: 11, lineHeight: 1.4 }}>Add products, finished work, locations or service images.</p>
              </div>
            </div>
            <UploadZone primary="Add Images" secondary="Drag & drop or browse" onFiles={addProductFiles} multiple />
            <div className="asset-label" style={{ marginTop: 13, marginBottom: 8, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: C.muted }}>Uploaded Images</div>
            <div className="flex flex-wrap gap-2">
              {assets.products.length > 0 ? (
                assets.products.map((asset: PersonalizationAsset, i: number) => (
                  <ThumbUploaded
                    key={asset.id}
                    asset={asset}
                    label={String(i + 1)}
                    onRemove={() => removeProduct(asset.id)}
                    onRetry={() => retryAssetUpload(asset.id)}
                  />
                ))
              ) : (
                <>
                  <ThumbPlaceholder label="1" />
                  <ThumbPlaceholder label="2" />
                  <ThumbPlaceholder label="3" />
                </>
              )}
              <ThumbPlaceholder label="+" add />
            </div>
          </article>

          {/* 4. Brand References */}
          <article className="asset-card" style={{ minHeight: 280, padding: 18, background: C.panelSoft, border: `1px solid ${C.border}`, borderRadius: 16 }}>
            <div className="flex gap-2.5 items-start" style={{ marginBottom: 14 }}>
              <div className="w-[35px] h-[35px] rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: C.cyanSoft, color: C.cyan, fontSize: 16 }}>🏢</div>
              <div>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, textTransform: 'uppercase' }}>4. Brand References</h3>
                <p style={{ margin: '5px 0 0', color: C.muted, fontSize: 11, lineHeight: 1.4 }}>Show SmartVideo what the client&apos;s business and brand look like.</p>
              </div>
            </div>
            <UploadZone primary="Add Images" secondary="Drag & drop or browse" onFiles={addBrandReferenceFiles} multiple />
            <div className="asset-label" style={{ marginTop: 13, marginBottom: 8, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: C.muted }}>Brand Images</div>
            <div className="flex flex-wrap gap-2">
              {assets.brandReferences.length > 0 ? (
                assets.brandReferences.map((asset: PersonalizationAsset) => (
                  <ThumbUploaded
                    key={asset.id}
                    asset={asset}
                    label={asset.name?.split('.')?.[0]?.toUpperCase()?.slice(0, 10) || 'BRAND'}
                    onRemove={() => removeBrandReference(asset.id)}
                    onRetry={() => retryAssetUpload(asset.id)}
                  />
                ))
              ) : (
                <>
                  <ThumbPlaceholder label="TRUCK" />
                  <ThumbPlaceholder label="OFFICE" />
                  <ThumbPlaceholder label="UNIFORM" />
                </>
              )}
            </div>
            <div style={{ marginTop: 9, color: C.muted2, fontSize: 10 }}>Store • Office • Truck • Uniform • Packaging • Brand Photography</div>
          </article>

          {/* 5. First Frame */}
          <article className="asset-card" style={{ minHeight: 280, padding: 18, background: C.panelSoft, border: `1px solid ${C.border}`, borderRadius: 16 }}>
            <div className="flex gap-2.5 items-start" style={{ marginBottom: 14 }}>
              <div className="w-[35px] h-[35px] rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: C.cyanSoft, color: C.cyan, fontSize: 16 }}>🎬</div>
              <div>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, textTransform: 'uppercase' }}>5. First Frame</h3>
                <p style={{ margin: '5px 0 0', color: C.muted, fontSize: 11, lineHeight: 1.4 }}>Control how the personalized video begins.</p>
              </div>
            </div>
            <UploadZone primary="Upload Image" onFiles={setFirstFrameFile} />
            <div
              className="frame-preview"
              style={{
                marginTop: 12,
                height: 105,
                display: 'grid',
                placeItems: 'center',
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                background: assets.firstFrame?.url ? '#000' : 'linear-gradient(145deg, #2d3740, #10151a)',
                fontSize: 12,
                fontWeight: 800,
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                color: 'white',
              }}
            >
              {assets.firstFrame?.url ? (
                <img src={assets.firstFrame.uploadedUrl || assets.firstFrame.url} alt="First Frame" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                'First Frame'
              )}
            </div>
            <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px', borderRadius: 7, marginTop: 8, marginRight: 4, background: C.cyan, color: '#071014', fontSize: 9, fontWeight: 800, textTransform: 'uppercase' }}>First Frame</span>
          </article>

          {/* 6. Last Frame / CTA */}
          <article className="asset-card" style={{ minHeight: 280, padding: 18, background: C.panelSoft, border: `1px solid ${C.border}`, borderRadius: 16 }}>
            <div className="flex gap-2.5 items-start" style={{ marginBottom: 14 }}>
              <div className="w-[35px] h-[35px] rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: C.cyanSoft, color: C.cyan, fontSize: 16 }}>🎯</div>
              <div>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, textTransform: 'uppercase' }}>6. Last Frame / CTA</h3>
                <p style={{ margin: '5px 0 0', color: C.muted, fontSize: 11, lineHeight: 1.4 }}>Control how the personalized video ends.</p>
              </div>
            </div>
            <UploadZone primary="Upload Image" onFiles={setLastFrameFile} />
            <div
              className="frame-preview"
              style={{
                marginTop: 12,
                height: 105,
                display: 'grid',
                placeItems: 'center',
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                background: assets.lastFrame?.url ? '#000' : 'linear-gradient(145deg, #2d3740, #10151a)',
                fontSize: 12,
                fontWeight: 800,
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                padding: 8,
                color: 'white',
              }}
            >
              {assets.lastFrame?.url ? (
                <img src={assets.lastFrame.uploadedUrl || assets.lastFrame.url} alt="Last Frame" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div>
                  {clientForm.ctaHeadline || 'Protect Your Home Today'}
                  <br /><br />
                  <span style={{ color: C.cyan }}>{clientForm.callToAction || 'Book Your Inspection'}</span>
                </div>
              )}
            </div>
            <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px', borderRadius: 7, marginTop: 8, marginRight: 4, background: C.cyan, color: '#071014', fontSize: 9, fontWeight: 800, textTransform: 'uppercase' }}>Last Frame</span>
          </article>
        </div>
      </section>

      {/* ── CTA & BUSINESS CONTENT ────────────────────────────── */}
      <section style={{ padding: '26px 0', borderBottom: `1px solid ${C.border}` }}>
        <h2 style={{ margin: 0, fontSize: 13, letterSpacing: '.05em', fontWeight: 800, textTransform: 'uppercase' }}>CTA &amp; Business Content</h2>
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ marginTop: 18, gap: 12 }}>
          <Field label="Product / Service" value={clientForm.productService} placeholder="Residential Roof Replacement" onChange={(v) => updateClientForm({ ...clientForm, productService: v })} />
          <Field label="Offer" value={clientForm.offer} placeholder="Free Roof Inspection" onChange={(v) => updateClientForm({ ...clientForm, offer: v })} />
          <Field label="CTA Headline" value={clientForm.ctaHeadline} placeholder="Protect Your Home Today" onChange={(v) => updateClientForm({ ...clientForm, ctaHeadline: v })} />
          <Field label="Button / Action" value={clientForm.callToAction} placeholder="Book Your Inspection" onChange={(v) => updateClientForm({ ...clientForm, callToAction: v })} />
          <Field label="Phone" value={clientForm.phone} placeholder="555-555-5555" onChange={(v) => updateClientForm({ ...clientForm, phone: v })} />
          <Field label="Website" value={clientForm.website} placeholder="abcroofing.com" onChange={(v) => updateClientForm({ ...clientForm, website: v })} />
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>CTA Graphic</div>
          <UploadZone primary="Upload CTA Graphic" secondary="Drag & drop or browse" onFiles={setCtaGraphicFile} />
          {assets.ctaGraphic?.url && (
            <div className="mt-3" style={{ maxWidth: 200 }}>
              <ThumbUploaded
                asset={assets.ctaGraphic}
                onRemove={removeCtaGraphic}
                onRetry={() => assets.ctaGraphic && retryAssetUpload(assets.ctaGraphic.id)}
              />
            </div>
          )}
        </div>
      </section>

      {/* ── PERSONALIZE THE PROMPT ──────────────────────────── */}
      <section style={{ padding: '26px 0', borderBottom: `1px solid ${C.border}` }}>
        <h2 style={{ margin: 0, fontSize: 13, letterSpacing: '.05em', fontWeight: 800, textTransform: 'uppercase' }}>Personalize The Prompt</h2>
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ marginTop: 18, gap: 14 }}>
          <div className="prompt-box" style={{ minHeight: 150, border: `1px solid ${C.border}`, borderRadius: 12, background: C.field, padding: 14 }}>
            <h4 style={{ margin: '0 0 9px', fontSize: 11, textTransform: 'uppercase' }}>Original Prompt</h4>
            <p style={{ margin: 0, color: 'rgba(255,255,255,.72)', fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {promptState.original || 'No original prompt available.'}
            </p>
          </div>
          <div className="prompt-box" style={{ minHeight: 150, border: `1px solid ${C.border}`, borderRadius: 12, background: C.field, padding: 14 }}>
            <h4 style={{ margin: '0 0 9px', fontSize: 11, textTransform: 'uppercase' }}>Personalized Prompt</h4>
            <textarea
              value={promptState.edited || promptState.personalized}
              onChange={(e) => updatePersonalizedPrompt(e.target.value)}
              rows={6}
              placeholder="Click Personalize Prompt to generate a client-specific version."
              className="w-full text-[12px] leading-[1.5] outline-none resize-y"
              style={{ background: 'transparent', color: 'rgba(255,255,255,.9)', border: 'none', padding: 0, caretColor: C.cyan }}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-end" style={{ marginTop: 12 }}>
          <button
            onClick={handlePersonalize}
            disabled={!canPersonalize || isPersonalizing}
            className="rounded-[9px] text-[11px] font-extrabold uppercase tracking-wide disabled:opacity-50"
            style={{ minHeight: 38, padding: '0 15px', border: `1px solid ${C.cyan}`, background: C.cyan, color: '#051014' }}
          >
            {isPersonalizing ? <Loader2 size={12} className="animate-spin inline" /> : '✦'} Personalize Prompt
          </button>
          <button
            onClick={handleRegenerate}
            disabled={!canPersonalize || isRegenerating || !promptState.personalized}
            className="rounded-[9px] text-[11px] font-extrabold uppercase tracking-wide disabled:opacity-50"
            style={{ minHeight: 38, padding: '0 15px', border: `1px solid ${C.border}`, background: C.panel, color: 'white' }}
          >
            Regenerate
          </button>
          <button
            onClick={handleCopyPrompt}
            disabled={!promptState.personalized}
            className="rounded-[9px] text-[11px] font-extrabold uppercase tracking-wide disabled:opacity-50"
            style={{ minHeight: 38, padding: '0 15px', border: `1px solid ${C.border}`, background: C.panel, color: 'white' }}
          >
            {copiedPrompt ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={resetPrompt}
            disabled={!promptState.personalized}
            className="rounded-[9px] text-[11px] font-extrabold uppercase tracking-wide disabled:opacity-50"
            style={{ minHeight: 38, padding: '0 15px', border: `1px solid ${C.border}`, background: C.panel, color: 'white' }}
          >
            Reset
          </button>
        </div>
      </section>

      {/* ── OUTPUT ────────────────────────────────────────── */}
      {!isPromptOnly && (
        <section style={{ padding: '26px 0', borderBottom: `1px solid ${C.border}` }}>
          <h2 style={{ margin: 0, fontSize: 13, letterSpacing: '.05em', fontWeight: 800, textTransform: 'uppercase' }}>What Do You Want To Create?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ marginTop: 18, gap: 12 }}>
            {outputOptions.map(({ key, label, description }: any) => {
              const active = outputType === key
              return (
                <button
                  key={key}
                  onClick={() => setOutputType(key)}
                  className="text-left p-4 rounded-[12px] border relative"
                  style={{
                    minHeight: 95,
                    padding: 16,
                    borderColor: active ? C.cyan : C.border,
                    background: active ? 'rgba(41,211,242,.045)' : C.panelSoft,
                    boxShadow: active ? 'inset 0 0 0 1px rgba(41,211,242,.25)' : 'none',
                  }}
                >
                  {active && (
                    <div className="absolute" style={{ right: 10, top: 10, width: 18, height: 18, borderRadius: '50%', display: 'grid', placeItems: 'center', background: C.cyan, color: '#071014', fontSize: 11, fontWeight: 900 }}>✓</div>
                  )}
                  <h4 style={{ margin: '0 0 6px', fontSize: 12, textTransform: 'uppercase' }}>{label}</h4>
                  <p style={{ margin: 0, color: C.muted, fontSize: 10, lineHeight: 1.45 }}>{description}</p>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* ── PERSONALIZATION MODE ────────────────────────────── */}
      {showModes && (
        <section style={{ padding: '26px 0', borderBottom: `1px solid ${C.border}` }}>
          <h2 style={{ margin: 0, fontSize: 13, letterSpacing: '.05em', fontWeight: 800, textTransform: 'uppercase' }}>Personalization Mode</h2>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ marginTop: 18, gap: 12 }}>
            {eligibleModes.map((m: any) => {
              const active = mode === m.key
              return (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className="text-left p-4 rounded-[12px] border relative"
                  style={{
                    minHeight: 95,
                    padding: 16,
                    borderColor: active ? C.cyan : C.border,
                    background: active ? 'rgba(41,211,242,.045)' : C.panelSoft,
                    boxShadow: active ? 'inset 0 0 0 1px rgba(41,211,242,.25)' : 'none',
                  }}
                >
                  {active && (
                    <div className="absolute" style={{ right: 10, top: 10, width: 18, height: 18, borderRadius: '50%', display: 'grid', placeItems: 'center', background: C.cyan, color: '#071014', fontSize: 11, fontWeight: 900 }}>✓</div>
                  )}
                  <h4 style={{ margin: '0 0 6px', fontSize: 12, textTransform: 'uppercase' }}>{m.label}</h4>
                  <p style={{ margin: 0, color: C.muted, fontSize: 10, lineHeight: 1.45 }}>{m.description}</p>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* ── ENGINE: SmartVideo Recommended ────────────────────── */}
      <section style={{ padding: '26px 0', borderBottom: `1px solid ${C.border}` }}>
        <h2 style={{ margin: 0, fontSize: 13, letterSpacing: '.05em', fontWeight: 800, textTransform: 'uppercase' }}>Engine</h2>
        <div
          className="flex items-center justify-between gap-5"
          style={{
            marginTop: 18,
            border: `1px solid ${C.cyan}`,
            borderRadius: 14,
            padding: '18px 20px',
            background: 'linear-gradient(90deg, rgba(41,211,242,.10), rgba(41,211,242,.03))',
            boxShadow: '0 0 26px rgba(41,211,242,.08), inset 0 0 0 1px rgba(41,211,242,.08)',
          }}
        >
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ background: 'rgba(41,211,242,.15)', color: C.cyan }}>✦</div>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 850, letterSpacing: '.02em' }}>
                SmartVideo <span style={{ color: C.cyan }}>Recommended</span>
              </h3>
              <div style={{ marginTop: 5, color: C.muted, fontSize: 11 }}>
                SmartVideo automatically chooses the best generation path for your selected content, personalization mode and assets.
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[11px] whitespace-nowrap"
            style={{ color: 'rgba(255,255,255,.75)' }}
          >
            Advanced Settings ›
          </button>
        </div>
        {showAdvanced && (
          <div className="grid grid-cols-2 gap-3 p-4 mt-2 rounded-xl border" style={{ borderColor: C.border, background: '#0c1014' }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>Engine</label>
              <select
                value={genOptions?.engine || 'smartvideo-recommended'}
                onChange={(e) => updateGenOptions({ ...genOptions, engine: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ borderColor: C.border, background: C.field, color: C.text }}
              >
                <option value="smartvideo-recommended">SmartVideo Recommended</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: C.muted }}>
                <input
                  type="checkbox"
                  checked={genOptions?.preserveAudio ?? true}
                  onChange={(e) => updateGenOptions({ ...genOptions, preserveAudio: e.target.checked })}
                  className="rounded"
                />
                Preserve Audio
              </label>
            </div>
          </div>
        )}
        {mode && ['face_only', 'full_body', 'replace_face', 'replace_person'].includes(mode) && (
          <label className="flex gap-2 items-center pt-[18px] text-[11px]" style={{ color: 'rgba(255,255,255,.72)' }}>
            <input
              type="checkbox"
              checked={genOptions?.consentGiven ?? false}
              onChange={(e) => updateGenOptions({ ...genOptions, consentGiven: e.target.checked })}
            />
            I confirm that I have permission to use this person&apos;s likeness.
          </label>
        )}
      </section>
    </div>
  )
}
