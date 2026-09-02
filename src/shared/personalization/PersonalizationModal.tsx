/**
 * PersonalizationModal
 *
 * The main modal for the personalization workflow.
 */

'use client'

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import {
  X,
  Upload,
  Plus,
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
  type LucideIcon,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type PersonalizationModalProps = {
  isOpen: boolean
  source: any
  onClose: () => void
  apiKey?: string
  clients?: any[]
  selectedClientId?: string
  clientForm?: any
  onSaveClient?: () => void
  onSelectClient?: (id: string) => void
  onDeleteClient?: (id: string) => void
  onClientFormChange?: (form: any) => void
  identities?: any[]
  onAddIdentities?: (assets: any[]) => void
  onSetPrimaryIdentity?: (id: string) => void
  logos?: any[]
  onAddLogos?: (assets: any[]) => void
  onSetPrimaryLogo?: (id: string) => void
  products?: any[]
  onAddProducts?: (assets: any[]) => void
  brandRefs?: any[]
  onAddBrandRefs?: (assets: any[]) => void
  firstFrame?: any
  onSetFirstFrame?: (asset: any) => void
  lastFrame?: any
  onSetLastFrame?: (asset: any) => void
  ctaGraphic?: any
  onSetCtaGraphic?: (asset: any) => void
  promptState?: { original: string; personalized: string; edited: string }
  onPromptStateChange?: (state: { original: string; personalized: string; edited: string }) => void
  onPersonalizePrompt?: () => void
  outputType?: string
  onOutputTypeChange?: (type: string) => void
  mode?: string | null
  onModeChange?: (mode: string | null) => void
  genOptions?: any
  onGenOptionsChange?: (opts: any) => void
  generation?: any
  onGenerate?: () => void
  onRetry?: () => void
  result?: any
  resultTab?: string
  onResultTabChange?: (tab: string) => void
  onEditInImageStudio?: () => void
  onEditInVideoStudio?: () => void
  onPublish?: () => void
  onDownload?: () => void
  onGenerateAgain?: () => void
  sharedMediaEntries?: any[]
  sourceTypeLabel?: string
  setMode?: (mode: string | null) => void
}

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

// ── Modal ────────────────────────────────────────────────────────────────────

export default function PersonalizationModal({
  isOpen,
  source,
  onClose,
  apiKey,
  clients = [],
  selectedClientId = '',
  clientForm = {},
  onSaveClient = () => {},
  onSelectClient = () => {},
  onDeleteClient = () => {},
  onClientFormChange = () => {},
  identities = [],
  onAddIdentities = () => {},
  onSetPrimaryIdentity = () => {},
  logos = [],
  onAddLogos = () => {},
  onSetPrimaryLogo = () => {},
  products = [],
  onAddProducts = () => {},
  brandRefs = [],
  onAddBrandRefs = () => {},
  firstFrame = null,
  onSetFirstFrame = () => {},
  lastFrame = null,
  onSetLastFrame = () => {},
  ctaGraphic = null,
  onSetCtaGraphic = () => {},
  promptState = { original: '', personalized: '', edited: '' },
  onPromptStateChange = () => {},
  onPersonalizePrompt = () => {},
  outputType = 'prompt',
  onOutputTypeChange = () => {},
  mode = null,
  onModeChange = () => {},
  genOptions = {},
  onGenOptionsChange = () => {},
  generation = { status: 'idle', progress: 0, progressMessage: '', errorMessage: null },
  onGenerate = () => {},
  onRetry = () => {},
  result = null,
  resultTab = 'prompt',
  onResultTabChange = () => {},
  onEditInImageStudio = () => {},
  onEditInVideoStudio = () => {},
  onPublish = () => {},
  onDownload = () => {},
  onGenerateAgain = () => {},
  sharedMediaEntries = [],
  sourceTypeLabel = undefined,
  setMode = () => {},
}: PersonalizationModalProps) {
  // Type-safe locals derived from props (with safe defaults)
  const safeClients = clients ?? []
  const safeSelectedClientId = selectedClientId ?? ''
  const safeClientForm = clientForm ?? {}
  const safeIdentities = identities ?? []
  const safeLogos = logos ?? []
  const safeProducts = products ?? []
  const safeBrandRefs = brandRefs ?? []
  const safeFirstFrame = firstFrame ?? null
  const safeLastFrame = lastFrame ?? null
  const safeCtaGraphic = ctaGraphic ?? null
  const safePromptState = promptState ?? { original: '', personalized: '', edited: '' }
  const safeOutputType = outputType ?? 'prompt'
  const safeMode = mode ?? null
  const safeGenOptions = genOptions ?? {}
  const safeGeneration = generation ?? { status: 'idle', progress: 0, progressMessage: '', errorMessage: null }
  const safeResult = result ?? null
  const safeResultTab = resultTab ?? 'prompt'
  const safeSharedMediaEntries = sharedMediaEntries ?? []

  // Non-null assertions for callbacks (defaults provided in destructuring)
  const _onAddIdentities = onAddIdentities!
  const _onSetPrimaryIdentity = onSetPrimaryIdentity!
  const _onAddLogos = onAddLogos!
  const _onSetPrimaryLogo = onSetPrimaryLogo!
  const _onAddProducts = onAddProducts!
  const _onAddBrandRefs = onAddBrandRefs!
  const _onSetFirstFrame = onSetFirstFrame!
  const _onSetLastFrame = onSetLastFrame!
  const _onSetCtaGraphic = onSetCtaGraphic!
  const _onClientFormChange = onClientFormChange!
  const _onSaveClient = onSaveClient!
  const _onSelectClient = onSelectClient!
  const _onDeleteClient = onDeleteClient!
  const _onPromptStateChange = onPromptStateChange!
  const _onPersonalizePrompt = onPersonalizePrompt!
  const _onOutputTypeChange = onOutputTypeChange!
  const _onModeChange = onModeChange!
  const _onGenOptionsChange = onGenOptionsChange!
  const _onGenerate = onGenerate!
  const _onRetry = onRetry!
  const _onEditInImageStudio = onEditInImageStudio!
  const _onEditInVideoStudio = onEditInVideoStudio!
  const _onPublish = onPublish!
  const _onDownload = onDownload!
  const _onGenerateAgain = onGenerateAgain!

  // Expose safe locals under original names for the rest of the component
  const _clients = safeClients
  const _selectedClientId = safeSelectedClientId
  const _clientForm = safeClientForm
  const _identities = safeIdentities
  const _logos = safeLogos
  const _products = safeProducts
  const _brandRefs = safeBrandRefs
  const _firstFrame = safeFirstFrame
  const _lastFrame = safeLastFrame
  const _ctaGraphic = safeCtaGraphic
  const _promptState = safePromptState
  const _outputType = safeOutputType
  const _mode = safeMode
  const _genOptions = safeGenOptions
  const _generation = safeGeneration
  const _result = safeResult
  const _resultTab = safeResultTab
  const _sharedMediaEntries = safeSharedMediaEntries

  const [activeSection, setActiveSection] = useState<string>('client')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadMessage, setUploadMessage] = useState('')
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [activeAssetTab, setActiveAssetTab] = useState<string>('identities')
  const dialogRef = useRef<HTMLDivElement>(null)
  const identityInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const productInputRef = useRef<HTMLInputElement>(null)
  const brandRefInputRef = useRef<HTMLInputElement>(null)
  const firstFrameInputRef = useRef<HTMLInputElement>(null)
  const lastFrameInputRef = useRef<HTMLInputElement>(null)
  const ctaInputRef = useRef<HTMLInputElement>(null)

  // Reset on source change
  useEffect(() => {
    setActiveSection('client')
    onModeChange?.(null)
  }, [source?.id])

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
      const newAssets = Array.from(files).map((file) => ({
        id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        role: 'presenter_identity',
        name: file.name,
        url: URL.createObjectURL(file),
        isPrimary: identities.length === 0,
        createdAt: new Date().toISOString(),
      }))
      _onAddIdentities([...identities, ...newAssets])
    },
    [identities, onAddIdentities],
  )

  const handleLogoUpload = useCallback(
    (files: FileList | null) => {
      if (!files) return
      const newAssets = Array.from(files).map((file) => ({
        id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        role: 'logo',
        name: file.name,
        url: URL.createObjectURL(file),
        isPrimary: logos.length === 0,
        createdAt: new Date().toISOString(),
      }))
      _onAddLogos([...logos, ...newAssets])
    },
    [logos, onAddLogos],
  )

  const handleProductUpload = useCallback(
    (files: FileList | null) => {
      if (!files) return
      const newAssets = Array.from(files).map((file) => ({
        id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        role: 'product_reference',
        name: file.name,
        url: URL.createObjectURL(file),
        isPrimary: false,
        createdAt: new Date().toISOString(),
      }))
      _onAddProducts([...products, ...newAssets])
    },
    [products, onAddProducts],
  )

  const handleBrandRefUpload = useCallback(
    (files: FileList | null) => {
      if (!files) return
      const newAssets = Array.from(files).map((file) => ({
        id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        role: 'brand_reference',
        name: file.name,
        url: URL.createObjectURL(file),
        isPrimary: false,
        createdAt: new Date().toISOString(),
      }))
      _onAddBrandRefs([...brandRefs, ...newAssets])
    },
    [brandRefs, onAddBrandRefs],
  )

  const handleFirstFrameUpload = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      const file = files[0]
      _onSetFirstFrame({
        id: `asset_${Date.now()}`,
        role: 'first_frame',
        name: file.name,
        url: URL.createObjectURL(file),
        isPrimary: true,
        createdAt: new Date().toISOString(),
      })
    },
    [onSetFirstFrame],
  )

  const handleLastFrameUpload = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      const file = files[0]
      _onSetLastFrame({
        id: `asset_${Date.now()}`,
        role: 'last_frame',
        name: file.name,
        url: URL.createObjectURL(file),
        isPrimary: true,
        createdAt: new Date().toISOString(),
      })
    },
    [onSetLastFrame],
  )

  const handleCtaUpload = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      const file = files[0]
      _onSetCtaGraphic({
        id: `asset_${Date.now()}`,
        role: 'cta_graphic',
        name: file.name,
        url: URL.createObjectURL(file),
        isPrimary: true,
        createdAt: new Date().toISOString(),
      })
    },
    [onSetCtaGraphic],
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
    _onPromptStateChange({ ...promptState, personalized: '', edited: '' })
  }, [promptState, onPromptStateChange])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
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
          border: '1px solid rgba(255,255,255,0.08)',
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
            onClick={onClose}
            disabled={generation.status === 'generating' || generation.status === 'personalizing-prompt'}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            aria-label="Close personalization modal"
          >
            <X size={16} />
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
                    onClick={() => onResultTabChange(tab)}
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
                    <button onClick={onGenerateAgain} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee' }}>
                      <RefreshCw size={14} /> Generate Again
                    </button>
                    {result.type !== 'video' && (
                      <button onClick={() => _onOutputTypeChange('video')} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white' }}>
                        <Video size={14} /> Generate Video
                      </button>
                    )}
                    {result.type !== 'image' && (
                      <button onClick={() => _onOutputTypeChange('image')} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white' }}>
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
                    <button onClick={onDownload} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white' }}>
                      <Download size={14} /> Download
                    </button>
                    <button onClick={onEditInImageStudio} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white' }}>
                      <Image size={14} /> Edit in Image Studio
                    </button>
                    <button onClick={onPublish} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee' }}>
                      <Share2 size={14} /> Publish
                    </button>
                    <button onClick={onGenerateAgain} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white' }}>
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
                    <button onClick={onDownload} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white' }}>
                      <Download size={14} /> Download
                    </button>
                    <button onClick={onEditInVideoStudio} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white' }}>
                      <Video size={14} /> Edit in Video Studio
                    </button>
                    <button onClick={onPublish} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee' }}>
                      <Share2 size={14} /> Publish
                    </button>
                    <button onClick={onGenerateAgain} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white' }}>
                      <RefreshCw size={14} /> Generate Again
                    </button>
                  </div>
                  {isVideo && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                      <span className="text-xs text-white/40 self-center mr-2">Switch mode:</span>
                      {VIDEO_MODES.filter((m: any) => m.key !== mode).map((m: any) => (
                        <button
                          key={m.key}
                          onClick={() => { _onModeChange(m.key); _onGenerateAgain() }}
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
                <button onClick={onRetry} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold" style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee' }}>
                  <RefreshCw size={14} /> Retry
                </button>
                <button onClick={onGenerate} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold" style={{ background: 'linear-gradient(to right, #22d3ee, #a855f7)', color: 'black' }}>
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
              {isUploading && (
                <div className="max-w-xs mx-auto">
                  <p className="text-xs text-white/60">{uploadMessage}</p>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mt-1">
                    <div className="h-full rounded-full transition-all" style={{ width: `${uploadProgress}%`, background: '#22d3ee' }} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── Configuration View ───────────────────────────────────────── */
            <div className="flex flex-col lg:flex-row">
              {/* Left column - Source */}
              <div className="w-full lg:w-1/2 p-6 border-b lg:border-b-0 lg:border-r border-white/10">
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

                {/* Prompt section */}
                <div className="mt-6 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Original Prompt</h3>
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <pre className="whitespace-pre-wrap break-words text-[13px] leading-6 text-white/70">{source.originalPrompt || source.fullPrompt || source.shortPrompt || ''}</pre>
                  </div>
                </div>

                {/* Personalized prompt section */}
                {promptState.personalized && (
                  <div className="mt-4 space-y-3">
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
                      onChange={(e) => _onPromptStateChange({ ...promptState, edited: e.target.value })}
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
                        onClick={() => _onClientFormChange({ ...clientForm, audience: key })}
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
                      onChange={(e) => _onSelectClient(e.target.value)}
                      className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                    >
                      <option value="">Select Existing Client</option>
                      {clients.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.businessName || c.name || c.id}</option>
                      ))}
                    </select>
                    <button onClick={() => { _onSelectClient(''); _onClientFormChange({ ...clientForm, id: '', name: '', businessName: '' }) }} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/70 hover:bg-white/10 transition-colors">
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
                          onChange={(e) => _onClientFormChange({ ...clientForm, [key]: e.target.value })}
                          placeholder={placeholder}
                          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20"
                        />
                      </div>
                    ))}
                    <div className="col-span-2">
                      <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1">Brand Description</label>
                      <textarea
                        value={clientForm.brandDescription}
                        onChange={(e) => _onClientFormChange({ ...clientForm, brandDescription: e.target.value })}
                        rows={2}
                        placeholder="Describe the brand style, colors, mood..."
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none resize-y placeholder:text-white/20"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={onSaveClient} className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee' }}>
                      <Save size={14} /> {selectedClientId ? 'Update Client' : 'Save Client'}
                    </button>
                    {selectedClientId && (
                      <button onClick={() => _onDeleteClient(selectedClientId)} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-400/10 transition-colors" style={{ border: '1px solid rgba(248,113,113,0.2)' }}>
                        <Trash2 size={14} /> Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Assets */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Client Assets</h3>
                  <p className="text-xs text-white/40">Add people, branding, and visual references for personalization.</p>

                  {/* Asset tabs */}
                  <div className="flex flex-wrap gap-1 border-b border-white/10 pb-px">
                    {[
                      { key: 'identities', label: 'Person' },
                      { key: 'logos', label: 'Logo' },
                      { key: 'products', label: 'Products' },
                      { key: 'brandRefs', label: 'Brand' },
                      { key: 'frames', label: 'Frames' },
                      { key: 'cta', label: 'CTA' },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setActiveAssetTab(key)}
                        className={classNames(
                          'px-3 py-1.5 text-xs font-medium transition-colors',
                          activeAssetTab === key ? 'text-cyan-300' : 'text-white/50 hover:text-white/80',
                        )}
                        style={{ borderBottom: activeAssetTab === key ? '2px solid #22d3ee' : '2px solid transparent' }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Person / Presenter */}
                  {activeAssetTab === 'identities' && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <input type="file" ref={identityInputRef} accept="image/*" multiple className="hidden" onChange={(e) => { handleIdentityUpload(e.target.files); e.target.value = '' }} />
                        <button onClick={() => identityInputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors" style={{ border: '1px dashed rgba(255,255,255,0.15)' }}>
                          <Upload size={12} /> Upload Photos
                        </button>
                      </div>
                      {identities.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {identities.map((asset: any) => (
                            <div
                              key={asset.id}
                              className={classNames(
                                'relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all',
                                asset.isPrimary ? 'border-cyan-400' : 'border-white/10 hover:border-white/30',
                              )}
                              onClick={() => _onSetPrimaryIdentity(asset.id)}
                            >
                              <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                                <p className="text-[10px] text-white/80 truncate">{asset.name}</p>
                              </div>
                              {asset.isPrimary && (
                                <div className="absolute top-1.5 right-1.5 rounded-full bg-cyan-400 p-0.5">
                                  <Check size={10} className="text-black" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {identities.length > 0 && (
                        <p className="text-[11px] text-white/40">Click an image to set it as Primary Identity.</p>
                      )}
                    </div>
                  )}

                  {/* Logos */}
                  {activeAssetTab === 'logos' && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <input type="file" ref={logoInputRef} accept="image/*" className="hidden" onChange={(e) => { handleLogoUpload(e.target.files); e.target.value = '' }} />
                        <button onClick={() => logoInputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors" style={{ border: '1px dashed rgba(255,255,255,0.15)' }}>
                          <Upload size={12} /> Upload Logo
                        </button>
                      </div>
                      {logos.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {logos.map((asset: any) => (
                            <div
                              key={asset.id}
                              className={classNames(
                                'relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all',
                                asset.isPrimary ? 'border-cyan-400' : 'border-white/10 hover:border-white/30',
                              )}
                              onClick={() => _onSetPrimaryLogo(asset.id)}
                            >
                              <img src={asset.url} alt={asset.name} className="w-full h-full object-contain p-2" style={{ background: 'rgba(255,255,255,0.05)' }} />
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                                <p className="text-[10px] text-white/80 truncate">{asset.name}</p>
                              </div>
                              {asset.isPrimary && (
                                <div className="absolute top-1.5 right-1.5 rounded-full bg-cyan-400 p-0.5">
                                  <Check size={10} className="text-black" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Products */}
                  {activeAssetTab === 'products' && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <input type="file" ref={productInputRef} accept="image/*" multiple className="hidden" onChange={(e) => { handleProductUpload(e.target.files); e.target.value = '' }} />
                        <button onClick={() => productInputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors" style={{ border: '1px dashed rgba(255,255,255,0.15)' }}>
                          <Upload size={12} /> Upload Products
                        </button>
                      </div>
                      {products.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {products.map((asset: any) => (
                            <div key={asset.id} className="relative aspect-square rounded-xl overflow-hidden border border-white/10">
                              <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                                <p className="text-[10px] text-white/80 truncate">{asset.name}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Brand References */}
                  {activeAssetTab === 'brandRefs' && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <input type="file" ref={brandRefInputRef} accept="image/*" multiple className="hidden" onChange={(e) => { handleBrandRefUpload(e.target.files); e.target.value = '' }} />
                        <button onClick={() => brandRefInputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors" style={{ border: '1px dashed rgba(255,255,255,0.15)' }}>
                          <Upload size={12} /> Upload Brand References
                        </button>
                      </div>
                      {brandRefs.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {brandRefs.map((asset: any) => (
                            <div key={asset.id} className="relative aspect-square rounded-xl overflow-hidden border border-white/10">
                              <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                                <p className="text-[10px] text-white/80 truncate">{asset.name}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* First / Last Frame & CTA */}
                  {activeAssetTab === 'frames' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-2">First Frame</label>
                        <div className="flex flex-wrap gap-2">
                          <input type="file" ref={firstFrameInputRef} accept="image/*" className="hidden" onChange={(e) => { handleFirstFrameUpload(e.target.files); e.target.value = '' }} />
                          <button onClick={() => firstFrameInputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors" style={{ border: '1px dashed rgba(255,255,255,0.15)' }}>
                            <Upload size={12} /> Upload First Frame
                          </button>
                        </div>
                        {firstFrame && (
                          <div className="mt-2 relative inline-block">
                            <img src={firstFrame.url} alt="First Frame" className="h-20 w-auto rounded-lg border border-cyan-400/30 object-cover" />
                            <button onClick={() => _onSetFirstFrame(null)} className="absolute -top-1.5 -right-1.5 rounded-full bg-red-500 p-0.5">
                              <X size={10} className="text-white" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-2">Last Frame / End Card</label>
                        <div className="flex flex-wrap gap-2">
                          <input type="file" ref={lastFrameInputRef} accept="image/*" className="hidden" onChange={(e) => { handleLastFrameUpload(e.target.files); e.target.value = '' }} />
                          <button onClick={() => lastFrameInputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors" style={{ border: '1px dashed rgba(255,255,255,0.15)' }}>
                            <Upload size={12} /> Upload Last Frame
                          </button>
                        </div>
                        {lastFrame && (
                          <div className="mt-2 relative inline-block">
                            <img src={lastFrame.url} alt="Last Frame" className="h-20 w-auto rounded-lg border border-cyan-400/30 object-cover" />
                            <button onClick={() => _onSetLastFrame(null)} className="absolute -top-1.5 -right-1.5 rounded-full bg-red-500 p-0.5">
                              <X size={10} className="text-white" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  {activeAssetTab === 'cta' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1">CTA Headline</label>
                        <input
                          value={clientForm.callToAction}
                          onChange={(e) => _onClientFormChange({ ...clientForm, callToAction: e.target.value })}
                          placeholder="Free Roof Inspection"
                          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1">Offer</label>
                        <input
                          value={clientForm.offer}
                          onChange={(e) => _onClientFormChange({ ...clientForm, offer: e.target.value })}
                          placeholder="Book Your Free Inspection"
                          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1">Phone</label>
                          <input
                            value={clientForm.phone}
                            onChange={(e) => _onClientFormChange({ ...clientForm, phone: e.target.value })}
                            placeholder="555-555-5555"
                            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1">Website</label>
                          <input
                            value={clientForm.website}
                            onChange={(e) => _onClientFormChange({ ...clientForm, website: e.target.value })}
                            placeholder="abcroofing.com"
                            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1">CTA Graphic (optional)</label>
                        <div className="flex flex-wrap gap-2">
                          <input type="file" ref={ctaInputRef} accept="image/*" className="hidden" onChange={(e) => { handleCtaUpload(e.target.files); e.target.value = '' }} />
                          <button onClick={() => ctaInputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors" style={{ border: '1px dashed rgba(255,255,255,0.15)' }}>
                            <Upload size={12} /> Upload CTA Graphic
                          </button>
                        </div>
                        {ctaGraphic && (
                          <div className="mt-2 relative inline-block">
                            <img src={ctaGraphic.url} alt="CTA" className="h-16 w-auto rounded-lg border border-cyan-400/30 object-cover" />
                            <button onClick={() => _onSetCtaGraphic(null)} className="absolute -top-1.5 -right-1.5 rounded-full bg-red-500 p-0.5">
                              <X size={10} className="text-white" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Output selector */}
                {!isPromptOnly && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">What Do You Want To Create?</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {outputOptions.map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => _onOutputTypeChange(key)}
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
                          onClick={() => _onModeChange(m.key)}
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
                          onChange={(e) => _onGenOptionsChange({ ...genOptions, engine: e.target.value })}
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
                            onChange={(e) => _onGenOptionsChange({ ...genOptions, preserveAudio: e.target.checked })}
                            className="rounded border-white/20 bg-black/30"
                          />
                          <span className="text-xs text-white/70">Preserve Audio</span>
                        </label>
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1">Logo Handling</label>
                        <select
                          value={genOptions.exactLogoHandling}
                          onChange={(e) => _onGenOptionsChange({ ...genOptions, exactLogoHandling: e.target.value })}
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
                          onChange={(e) => _onGenOptionsChange({ ...genOptions, exactCtaHandling: e.target.value })}
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
                      onChange={(e) => _onGenOptionsChange({ ...genOptions, consentGiven: e.target.checked })}
                      className="mt-0.5 rounded border-white/20 bg-black/30"
                    />
                    <label htmlFor="likeness-consent" className="text-xs text-white/60 cursor-pointer">
                      I confirm that I have permission to use this person&apos;s image or likeness.
                    </label>
                  </div>
                )}

                {/* Prompt personalization */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Personalize The Prompt</h3>
                    <button
                      onClick={onPersonalizePrompt}
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

                {/* Review summary */}
                <div className="p-4 rounded-xl border border-white/10 bg-black/20 space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Personalization Summary</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-white/40">Source:</span> <span className="text-white/80">{sourceTypeLabel || 'Landing Demo'}</span></div>
                    <div><span className="text-white/40">Client:</span> <span className="text-white/80">{clientForm.businessName || clientForm.name || 'None selected'}</span></div>
                    <div><span className="text-white/40">Mode:</span> <span className="text-white/80">{mode ? (eligibleModes.find((m: any) => m.key === mode)?.label || mode) : 'Not selected'}</span></div>
                    <div><span className="text-white/40">Identities:</span> <span className="text-white/80">{identities.length}</span></div>
                    <div><span className="text-white/40">Logos:</span> <span className="text-white/80">{logos.length}</span></div>
                    <div><span className="text-white/40">Products:</span> <span className="text-white/80">{products.length}</span></div>
                    <div><span className="text-white/40">Brand Refs:</span> <span className="text-white/80">{brandRefs.length}</span></div>
                    <div><span className="text-white/40">First Frame:</span> <span className="text-white/80">{firstFrame ? 'Yes' : 'No'}</span></div>
                    <div><span className="text-white/40">Last Frame:</span> <span className="text-white/80">{lastFrame ? 'Yes' : 'No'}</span></div>
                    <div><span className="text-white/40">CTA:</span> <span className="text-white/80">{ctaGraphic ? 'Yes' : (clientForm.callToAction ? 'Text only' : 'None')}</span></div>
                  </div>
                </div>

                {/* Generate button */}
                <button
                  onClick={onGenerate}
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
          <div className="flex items-center justify-between border-t border-white/10 p-4">
            <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <Sparkles size={12} />
              <span className="text-xs">SMARTVIDEO PERSONALIZATION</span>
            </div>
            <button onClick={onClose} className="text-xs font-medium text-white/40 hover:text-white transition-colors">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
