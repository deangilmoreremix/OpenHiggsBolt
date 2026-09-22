/**
 * DemoPersonalizeProvider + useDemoPersonalize
 *
 * Complete workflow state layer for the SmartVideo Personalization system.
 */

'use client'

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import PersonalizationModal from './PersonalizationModal'
import { writeHandoff } from '@/shared/crossStudio'
import { SocialPublishContext } from '@/components/SocialPublishProvider'
import { useAuthConfig } from '@/lib/authConfig'

/** Safe accessor for SocialPublishContext — returns null when not wrapped in a provider. */
function useOptionalSocialPublish(): null | { openPublish: (opts: { mediaUrl: string; mediaType?: 'image' | 'video'; title?: string; caption?: string }) => void; closePublish: () => void; openSocialPublisher: (opts: { asset: unknown }) => void } {
  return useContext(SocialPublishContext)
}
import type {
  PersonalizationSource,
  ClientProfile,
  AssetLibrary,
  PersonalizationAsset,
  PromptState,
  OutputType,
  VideoPersonalizationMode,
  ImagePersonalizationMode,
  GenerationOptions,
  GenerationState,
  GenerationResult,
  SharedMediaEntry,
  PersonalizationEligibility,
  DiscoveredAsset,
  DiscoveredAssetCategory,
  AssignedSection,
  PersonalizationVisionAnalysis,
  PersonalizationVisionValidation,
} from './types'
import { EMPTY_GENERATION_STATE } from './types'
import { normalizePersonalizationSource, getEligibility } from './sourceNormalizer'
import {
  loadClients,
  saveClient as saveClientRecord,
  createClient,
  deleteClient as deleteClientRecord,
  getCurrentClientId,
  setCurrentClientId,
} from './clientProfile'
import {
  loadClientAssets,
  saveClientAssets,
  deleteClientAssets,
  removeAssetFromClientLibrary,
  setPrimaryInClientLibrary,
  type ClientAssetLibrary,
  EMPTY_CLIENT_ASSET_LIBRARY,
} from './clientAssets'
import {
  getSharedMedia,
  registerSharedMedia,
} from './sharedMedia'
import { registerSupabaseSharedMedia } from './supabaseSharedMedia'
import { personalizePrompt } from './promptPersonalizer'
import { runGeneration } from './generationRouter'
import { resolveModelCapabilities, resolveAssetsForModel } from './modelCapabilityResolver'
import { applyPostProcessing, generateEndCardImage } from './postProcessor'
import { uploadFile } from 'studio/src/muapi'
import type { BusinessDiscoveryRecord } from './types'

// ── Constants ────────────────────────────────────────────────────────────────

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    let normalized = `${parsed.protocol}://${parsed.hostname}${parsed.pathname}`
    if (parsed.port && !['80', '443'].includes(parsed.port)) {
      normalized += `:${parsed.port}`
    }
    return normalized.toLowerCase()
  } catch {
    return url.toLowerCase().replace(/\/+$/, '')
  }
}

const EMPTY_ASSET_LIBRARY: AssetLibrary = {
  identities: [],
  primaryIdentity: null,
  logos: [],
  primaryLogo: null,
  products: [],
  brandReferences: [],
  firstFrame: null,
  lastFrame: null,
  ctaGraphic: null,
  audio: [],
  savedReferences: [],
}

const EMPTY_PROMPT_STATE: PromptState = {
  original: '',
  personalized: '',
  edited: '',
}

const EMPTY_GENERATION_OPTIONS: GenerationOptions = {
  engine: 'smartvideo-recommended',
  preserveAudio: true,
  exactLogoHandling: 'final-overlay',
  exactCtaHandling: 'final-end-card',
  firstFrameMode: 'none',
  lastFrameMode: 'none',
  consentGiven: false,
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getGenerationAssetUrl(asset: PersonalizationAsset | null | undefined): string | undefined {
  if (!asset) return undefined
  if (asset.uploadStatus !== 'ready') return undefined
  const url = asset.uploadedUrl || asset.url
  if (!url || url.startsWith('blob:')) return undefined
  return url
}

function revokeAssetUrl(asset: PersonalizationAsset | null | undefined) {
  if (!asset) return
  const url = asset.url
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

// ── Context ──────────────────────────────────────────────────────────────────

type OpenPersonalizeOptions = {
  source: unknown
  trigger?: HTMLElement | null
}

type DemoPersonalizeContextValue = {
  // Modal
  isOpen: boolean
  source: PersonalizationSource | null
  sourceTypeLabel?: string
  openPersonalize: (opts: OpenPersonalizeOptions) => void
  closePersonalize: () => void

  // Client
  clients: ClientProfile[]
  selectedClientId: string
  clientForm: Partial<ClientProfile>
  selectClient: (id: string) => void
  createClient: (partial: Partial<ClientProfile>) => ClientProfile
  saveClient: () => Promise<ClientProfile | null>
  updateClient: (client: ClientProfile) => void
  deleteClient: (id: string) => void
  updateClientForm: (patch: Partial<ClientProfile>) => void

  // Assets
  assets: AssetLibrary
  addIdentityFiles: (files: FileList | null) => void
  addIdentityUrl: (url: string) => void
  removeIdentity: (id: string) => void
  setPrimaryIdentity: (id: string) => void
  addLogoFiles: (files: FileList | null) => void
  addLogoUrl: (url: string) => void
  removeLogo: (id: string) => void
  setPrimaryLogo: (id: string) => void
  addProductFiles: (files: FileList | null) => void
  addProductUrl: (url: string) => void
  removeProduct: (id: string) => void
  addBrandReferenceFiles: (files: FileList | null) => void
  addBrandReferenceUrl: (url: string) => void
  removeBrandReference: (id: string) => void
  setFirstFrameFile: (file: File | null) => void
  setFirstFrameUrl: (url: string) => void
  removeFirstFrame: () => void
  setLastFrameFile: (file: File | null) => void
  setLastFrameUrl: (url: string) => void
  removeLastFrame: () => void
  setCtaGraphicFile: (file: File | null) => void
  setCtaGraphicUrl: (url: string) => void
  removeCtaGraphic: () => void
  retryAssetUpload: (id: string) => Promise<void>
  applyEditedPersonalizationAsset: (
    assetId: string,
    dataUrl: string,
    meta: {
      operation: string
      prompt: string
      model: string
      quality: string
      transparent: boolean
      videoReady: boolean
      responseId?: string | null
      imageGenerationCallId?: string | null
      revisedPrompt?: string | null
      outputFormat?: 'png' | 'jpeg' | 'webp'
      outputCompression?: number | null
      inputFidelity?: 'high' | 'low'
      visionAnalysis?: PersonalizationVisionAnalysis
      visionValidation?: PersonalizationVisionValidation
    },
  ) => Promise<void>

  // Discovered assets
  discoveredAssets: DiscoveredAsset[]
  discoveryStatus: 'idle' | 'discovering' | 'reviewing' | 'importing'
  discoveryError: string | null
  importConfirmation: { count: number; clientName?: string } | null
  setDiscoveredAssets: (assets: DiscoveredAsset[]) => void
  toggleDiscoveredAssetSelection: (id: string) => void
  rejectDiscoveredAsset: (id: string) => void
  restoreDiscoveredAsset: (id: string) => void
  updateDiscoveredAssetCategory: (id: string, category: DiscoveredAssetCategory) => void
  removeDiscoveredAssetFromSection: (id: string) => void
  moveDiscoveredAssetToSection: (id: string, section: AssignedSection) => void
  selectRecommendedDiscoveredAssets: () => void
  importDiscoveredAssets: () => Promise<void>
  cancelDiscovery: () => void
  discoverAssets: (websiteUrl: string) => Promise<void>
  visionStatus: 'idle' | 'analyzing' | 'complete' | 'error'
  visionError: string | null
  analyzeDiscoveredAssets: () => Promise<void>

  // Business search
  businessSearchMode: 'idle' | 'searching' | 'results' | 'selected' | 'error'
  businessSearchResults: BusinessDiscoveryRecord[]
  businessSearchError: string | null
  businessSearchQuery: { niche: string; location: string; radiusMiles: number } | null
  selectedBusiness: BusinessDiscoveryRecord | null
  businessResearch: {
    status: 'idle' | 'researching' | 'done' | 'error'
    result?: {
      canonicalUrl?: string
      reachable: boolean
      title?: string
      description?: string
      logoUrl?: string
      socialLinks?: Record<string, string>
      contactInfo?: { phones: string[]; emails: string[] }
    }
    error?: string
  }
  findBusinesses: (niche: string, location: string, radiusMiles: number) => Promise<void>
  selectBusiness: (business: BusinessDiscoveryRecord) => void
  researchBusiness: () => Promise<void>
  clearBusinessSearch: () => void
  setBusinessSearchMode: (mode: 'idle' | 'searching' | 'results' | 'selected' | 'error') => void

  // Prompt
  promptState: PromptState
  personalizePrompt: () => Promise<void>
  updatePersonalizedPrompt: (text: string) => void
  resetPrompt: () => void

  // Output / mode / options
  outputType: OutputType
  setOutputType: (type: OutputType) => void
  mode: VideoPersonalizationMode | ImagePersonalizationMode | null
  setMode: (mode: VideoPersonalizationMode | ImagePersonalizationMode | null) => void
  genOptions: GenerationOptions
  updateGenOptions: (patch: Partial<GenerationOptions>) => void
  consent: boolean
  setConsent: (value: boolean) => void

  // Generation
  generate: () => Promise<void>
  retry: () => Promise<void>
  generateAgain: () => Promise<void>
  retryBranding: () => Promise<void>
  generation: GenerationState

  // Result
  result: GenerationResult | null
  resultTab: 'prompt' | 'images' | 'videos'
  setResultTab: (tab: 'prompt' | 'images' | 'videos') => void
  editInImageStudio: () => void
  editInVideoStudio: () => void
  publish: () => void
  download: () => void

  // Shared media
  sharedMediaEntries: SharedMediaEntry[]
  eligibility: PersonalizationEligibility

  // Saved client assets
  savedClientAssets: ClientAssetLibrary
  savedAssetLibraryTab: 'identities' | 'logos' | 'products' | 'brandReferences'
  setSavedAssetLibraryTab: (tab: 'identities' | 'logos' | 'products' | 'brandReferences') => void
  useSavedClient: (id: string) => void
  deleteSavedClient: (id: string) => void
  selectSavedAsset: (asset: PersonalizationAsset) => void
  setPrimarySavedAsset: (role: 'identity' | 'logo', assetId: string) => void
  removeSavedAsset: (assetId: string) => void
}

const PersonalizationContext = createContext<DemoPersonalizeContextValue | null>(null)

export function useDemoPersonalize(): DemoPersonalizeContextValue {
  const ctx = useContext(PersonalizationContext)
  if (!ctx) throw new Error('useDemoPersonalize must be used within DemoPersonalizeProvider')
  return ctx
}

interface DemoPersonalizeProviderProps {
  children: ReactNode
  testMode?: boolean
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const [header, base64] = dataUrl.split(',')
    const mimeMatch = header.match(/:(.*?);/)
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream'
    const binary =
      typeof globalThis.atob === 'function'
        ? globalThis.atob(base64)
        : (() => {
            const buf = Buffer.from(base64, 'base64')
            let str = ''
            for (let i = 0; i < buf.length; i++) str += String.fromCharCode(buf[i])
            return str
          })()
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return new Blob([bytes], { type: mime })
  } catch {
    return null
  }
}

function createAsset(file: File | Blob, role: PersonalizationAsset['role'], opts: Partial<PersonalizationAsset> = {}): PersonalizationAsset {
  const fileObj = file as File
  return {
    id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    role,
    name: fileObj.name || 'discovered',
    url: URL.createObjectURL(file),
    isPrimary: false,
    mimeType: fileObj.type || '',
    createdAt: new Date().toISOString(),
    uploadStatus: 'local',
    uploadError: null,
    file: fileObj as File,
    ...opts,
  }
}

function createAssetFromUrl(url: string, role: PersonalizationAsset['role'], opts: Partial<PersonalizationAsset> = {}): PersonalizationAsset {
  return {
    id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    role,
    name: url.split('/').pop() || url,
    url,
    uploadedUrl: url,
    isPrimary: false,
    mimeType: '',
    createdAt: new Date().toISOString(),
    uploadStatus: 'ready',
    uploadError: null,
    file: null,
    ...opts,
  }
}

function updateAssetInLibrary(library: AssetLibrary, asset: PersonalizationAsset): AssetLibrary {
  switch (asset.role) {
    case 'presenter_identity':
    case 'face_identity':
    case 'character_identity':
      return {
        ...library,
        identities: [...library.identities, asset],
        primaryIdentity: library.primaryIdentity || asset,
      }
    case 'logo':
      return {
        ...library,
        logos: [...library.logos, asset],
        primaryLogo: library.primaryLogo || asset,
      }
    case 'product_reference':
      return { ...library, products: [...library.products, asset] }
    case 'brand_reference':
      return { ...library, brandReferences: [...library.brandReferences, asset] }
    case 'first_frame':
      return { ...library, firstFrame: asset }
    case 'last_frame':
      return { ...library, lastFrame: asset }
    case 'cta_graphic':
      return { ...library, ctaGraphic: asset }
    default:
      return library
  }
}


function replaceAssetInLibrary(library: AssetLibrary, asset: PersonalizationAsset): AssetLibrary {
  switch (asset.role) {
    case 'presenter_identity':
    case 'face_identity':
    case 'character_identity':
      return {
        ...library,
        identities: library.identities.map((a) => (a.id === asset.id ? asset : a)),
        primaryIdentity: library.primaryIdentity?.id === asset.id ? asset : library.primaryIdentity,
      }
    case 'logo':
      return {
        ...library,
        logos: library.logos.map((a) => (a.id === asset.id ? asset : a)),
        primaryLogo: library.primaryLogo?.id === asset.id ? asset : library.primaryLogo,
      }
    case 'product_reference':
      return { ...library, products: library.products.map((a) => (a.id === asset.id ? asset : a)) }
    case 'brand_reference':
      return { ...library, brandReferences: library.brandReferences.map((a) => (a.id === asset.id ? asset : a)) }
    case 'first_frame':
      return { ...library, firstFrame: asset }
    case 'last_frame':
      return { ...library, lastFrame: asset }
    case 'cta_graphic':
      return { ...library, ctaGraphic: asset }
    default:
      return library
  }
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function DemoPersonalizeProvider({ children, testMode }: DemoPersonalizeProviderProps) {
  // Navigation & publish integration
  const router = useRouter()
  const socialPublish = useOptionalSocialPublish()
  const { apiKey } = useAuthConfig()
  // Modal
  const [isOpen, setIsOpen] = useState(false)
  const [source, setSource] = useState<PersonalizationSource | null>(null)
  const [sourceTypeLabel, setSourceTypeLabel] = useState<string | undefined>(undefined)
  const triggerRef = useRef<HTMLElement | null>(null)

  // Client
  const [clients, setClients] = useState<ClientProfile[]>(loadClients)
  const [selectedClientId, setSelectedClientId] = useState<string>(() => getCurrentClientId() || '')
  const [clientForm, setClientForm] = useState<Partial<ClientProfile>>({})

  // Saved client assets (persisted per-client library)
  const [savedClientAssets, setSavedClientAssets] = useState<ClientAssetLibrary>(() =>
    loadClientAssets(getCurrentClientId() || ''),
  )
  const [savedAssetLibraryTab, setSavedAssetLibraryTab] = useState<'identities' | 'logos' | 'products' | 'brandReferences'>('identities')

  // Assets
  const [assets, setAssets] = useState<AssetLibrary>({ ...EMPTY_ASSET_LIBRARY })

  // Discovered assets (temporary review state — NOT part of permanent AssetLibrary)
  const [discoveredAssets, setDiscoveredAssetsState] = useState<DiscoveredAsset[]>([])
  const [discoveryStatus, setDiscoveryStatus] = useState<'idle' | 'discovering' | 'reviewing' | 'importing'>('idle')
  const [discoveryError, setDiscoveryError] = useState<string | null>(null)
  const [importConfirmation, setImportConfirmation] = useState<{ count: number; failedCount?: number; clientName?: string } | null>(null)
  const [visionStatus, setVisionStatus] = useState<'idle' | 'analyzing' | 'complete' | 'error'>('idle')
  const [visionError, setVisionError] = useState<string | null>(null)

  useEffect(() => {
    if (!importConfirmation) return
    const timer = setTimeout(() => setImportConfirmation(null), 5000)
    return () => clearTimeout(timer)
  }, [importConfirmation])

  // Business search state
  const [businessSearchMode, setBusinessSearchMode] = useState<'idle' | 'searching' | 'results' | 'selected' | 'error'>('idle')
  const [businessSearchResults, setBusinessSearchResults] = useState<BusinessDiscoveryRecord[]>([])
  const [businessSearchError, setBusinessSearchError] = useState<string | null>(null)
  const [businessSearchQuery, setBusinessSearchQuery] = useState<{ niche: string; location: string; radiusMiles: number } | null>(null)
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessDiscoveryRecord | null>(null)
  const [businessResearch, setBusinessResearch] = useState<{
    status: 'idle' | 'researching' | 'done' | 'error'
    result?: {
      canonicalUrl?: string
      reachable: boolean
      title?: string
      description?: string
      logoUrl?: string
      socialLinks?: Record<string, string>
      contactInfo?: { phones: string[]; emails: string[] }
    }
    error?: string
  }>({ status: 'idle' })

  // Prompt
  const [promptState, setPromptState] = useState<PromptState>({ ...EMPTY_PROMPT_STATE })

  // Output / mode / options
  const [outputType, setOutputType] = useState<OutputType>('prompt')
  const [mode, setMode] = useState<VideoPersonalizationMode | ImagePersonalizationMode | null>(null)
  const [genOptions, setGenOptions] = useState<GenerationOptions>({ ...EMPTY_GENERATION_OPTIONS })
  const [consent, setConsent] = useState(false)

  // Generation
  const [generation, setGeneration] = useState<GenerationState>({ ...EMPTY_GENERATION_STATE })

  // Result
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [resultTab, setResultTab] = useState<'prompt' | 'images' | 'videos'>('prompt')

  // Shared media
  const [sharedMediaEntries, setSharedMediaEntries] = useState<SharedMediaEntry[]>(getSharedMedia)

  // Eligibility
  const [eligibility, setEligibility] = useState<PersonalizationEligibility>({
    enabled: false,
    outputs: ['prompt'],
    videoModes: [],
    imageModes: [],
    recommendedMode: undefined,
  })

  // Refs for studio handoff persistence
  const lastResultRef = useRef<GenerationResult | null>(null)
  const lastProjectRef = useRef<{
    source: PersonalizationSource
    client: Partial<ClientProfile>
    assets: AssetLibrary
    mode: VideoPersonalizationMode | ImagePersonalizationMode | null
    personalizedPrompt?: string
  } | null>(null)

  // ── Derived ────────────────────────────────────────────────────────────────

  const _currentClient = clients.find((c) => c.id === selectedClientId) || null

  // ── Reset on source change ─────────────────────────────────────────────────

  useEffect(() => {
    if (!source) return
    // Revoke any outstanding blob URLs before resetting state
    setAssets((prev) => {
      const all = [
        ...prev.identities,
        ...prev.logos,
        ...prev.products,
        ...prev.brandReferences,
        prev.firstFrame,
        prev.lastFrame,
        prev.ctaGraphic,
        ...prev.audio,
        ...prev.savedReferences,
      ]
      all.forEach((a) => { if (a) revokeAssetUrl(a) })
      return { ...EMPTY_ASSET_LIBRARY }
    })
    setPromptState({
      original: source.originalPrompt || source.fullPrompt || source.shortPrompt || '',
      personalized: '',
      edited: '',
    })
    setOutputType('prompt')
    setMode(null)
    setGenOptions({ ...EMPTY_GENERATION_OPTIONS })
    setConsent(false)
    setGeneration({ ...EMPTY_GENERATION_STATE })
    setResult(null)
    setResultTab('prompt')
    setClientForm({})
    setEligibility(getEligibility(source))
  }, [source?.id, source])

  // ── Saved client assets sync ────────────────────────────────────────────────

  useEffect(() => {
    const library = loadClientAssets(selectedClientId)
    setSavedClientAssets(library)
  }, [selectedClientId])

  useEffect(() => {
    if (!selectedClientId) return
    saveClientAssets(selectedClientId, savedClientAssets)
  }, [savedClientAssets, selectedClientId])

  // Persist current reusable assets to saved client library whenever they change
  useEffect(() => {
    if (!selectedClientId) return
    const library: ClientAssetLibrary = {
      identities: assets.identities,
      primaryIdentity: assets.primaryIdentity,
      logos: assets.logos,
      primaryLogo: assets.primaryLogo,
      products: assets.products,
      brandReferences: assets.brandReferences,
    }
    setSavedClientAssets(library)
  }, [
    assets.identities,
    assets.primaryIdentity,
    assets.logos,
    assets.primaryLogo,
    assets.products,
    assets.brandReferences,
    selectedClientId,
  ])

  // ── Modal actions ──────────────────────────────────────────────────────────

  const openPersonalize = useCallback((opts: OpenPersonalizeOptions) => {
    const normalized = normalizePersonalizationSource(opts.source)
    if (normalized) {
      const label =
        normalized.sourceType === 'go-ai-viral-prompt' || normalized.sourceType === 'go-ai-viral-video'
          ? 'GO AI Viral'
          : undefined
      setSourceTypeLabel(label)
      triggerRef.current = opts.trigger || null
      setSource(normalized)
      setIsOpen(true)
    }
  }, [])

  const closePersonalize = useCallback(() => {
    // Revoke outstanding blob URLs
    setAssets((prev) => {
      const all = [
        ...prev.identities,
        ...prev.logos,
        ...prev.products,
        ...prev.brandReferences,
        prev.firstFrame,
        prev.lastFrame,
        prev.ctaGraphic,
        ...prev.audio,
        ...prev.savedReferences,
      ]
      all.forEach((a) => { if (a) revokeAssetUrl(a) })
      return prev
    })
    setIsOpen(false)
    setSource(null)
    setSourceTypeLabel(undefined)
    setResult(null)
    setGeneration({ ...EMPTY_GENERATION_STATE })
    triggerRef.current?.focus()
    triggerRef.current = null
  }, [])

  // ── Client actions ─────────────────────────────────────────────────────────

  const selectClient = useCallback((id: string) => {
    setSelectedClientId(id)
    if (!id) {
      setCurrentClientId(null)
      setClientForm({})
      return
    }
    const found = clients.find((c) => c.id === id)
    if (found) {
      setCurrentClientId(id)
      setClientForm({ ...found })
    }
  }, [clients])

  const createClientRecord = useCallback((partial: Partial<ClientProfile>): ClientProfile => {
    return createClient(partial)
  }, [])

  const saveClient = useCallback(async (): Promise<ClientProfile | null> => {
    try {
      const partial = clientForm as Partial<ClientProfile>
      let saved: ClientProfile
      if (selectedClientId && clients.some((c) => c.id === selectedClientId)) {
        saved = saveClientRecord({ ...partial, id: selectedClientId } as ClientProfile)
      } else {
        saved = createClient(partial)
      }
      setClients(loadClients())
      setSelectedClientId(saved.id)
      setCurrentClientId(saved.id)
      return saved
    } catch {
      return null
    }
  }, [clientForm, selectedClientId, clients])

  const updateClient = useCallback((client: ClientProfile) => {
    saveClientRecord(client)
    setClients(loadClients())
  }, [])

  const deleteClient = useCallback((id: string) => {
    deleteClientRecord(id)
    setClients(loadClients())
    if (selectedClientId === id) {
      setSelectedClientId('')
      setCurrentClientId(null)
      setClientForm({})
    }
  }, [selectedClientId])

  const updateClientForm = useCallback((patch: Partial<ClientProfile>) => {
    setClientForm((prev) => ({ ...prev, ...patch }))
  }, [])

  // ── Saved client assets actions ─────────────────────────────────────────────

  const useSavedClient = useCallback((id: string) => {
    selectClient(id)
    const library = loadClientAssets(id)
    setSavedClientAssets(library)
  }, [selectClient])

  const deleteSavedClient = useCallback((id: string) => {
    deleteClientAssets(id)
    setSavedClientAssets({ ...EMPTY_CLIENT_ASSET_LIBRARY })
    if (selectedClientId === id) {
      deleteClientRecord(id)
      setClients(loadClients())
      setSelectedClientId('')
      setCurrentClientId(null)
      setClientForm({})
    }
  }, [selectedClientId])

  const selectSavedAsset = useCallback((asset: PersonalizationAsset) => {
    setAssets((prev) => updateAssetInLibrary(prev, asset))
  }, [])

  const setPrimarySavedAsset = useCallback((role: 'identity' | 'logo', assetId: string) => {
    if (!selectedClientId) return
    const next = setPrimaryInClientLibrary(selectedClientId, role, assetId)
    setSavedClientAssets(next)
  }, [selectedClientId])

  const removeSavedAsset = useCallback((assetId: string) => {
    if (!selectedClientId) return
    const next = removeAssetFromClientLibrary(selectedClientId, assetId)
    setSavedClientAssets(next)
    // Also remove from current job if present
    setAssets((prev) => {
      const all = [
        ...prev.identities,
        ...prev.logos,
        ...prev.products,
        ...prev.brandReferences,
      ].filter(Boolean) as PersonalizationAsset[]
      const exists = all.some((a) => a.id === assetId)
      if (!exists) return prev
      const filtered = all.filter((a) => a.id !== assetId)
      const rebuilt: AssetLibrary = { ...EMPTY_ASSET_LIBRARY }
      for (const a of filtered) {
        rebuilt.identities = [...rebuilt.identities, a]
        if (rebuilt.primaryIdentity?.id === a.id) rebuilt.primaryIdentity = a
      }
      return rebuilt
    })
  }, [selectedClientId])

  // ── Asset upload helpers ───────────────────────────────────────────────────

  const _updateAsset = useCallback((asset: PersonalizationAsset) => {
    setAssets((prev) => updateAssetInLibrary(prev, asset))
  }, [])

  const setAssetUploadStatus = useCallback((id: string, status: PersonalizationAsset['uploadStatus'], error?: string | null) => {
    setAssets((prev) => {
      const all = [
        ...prev.identities,
        ...prev.logos,
        ...prev.products,
        ...prev.brandReferences,
        prev.firstFrame,
        prev.lastFrame,
        prev.ctaGraphic,
        ...prev.audio,
        ...prev.savedReferences,
      ].filter(Boolean) as PersonalizationAsset[]

      const target = all.find((a) => a.id === id)
      if (!target) return prev

      const updated = { ...target, uploadStatus: status, uploadError: error || null }

      switch (target.role) {
        case 'presenter_identity':
        case 'face_identity':
        case 'character_identity':
          return {
            ...prev,
            identities: prev.identities.map((a) => (a.id === id ? updated : a)),
            primaryIdentity: prev.primaryIdentity?.id === id ? updated : prev.primaryIdentity,
          }
        case 'logo':
          return {
            ...prev,
            logos: prev.logos.map((a) => (a.id === id ? updated : a)),
            primaryLogo: prev.primaryLogo?.id === id ? updated : prev.primaryLogo,
          }
        case 'product_reference':
          return { ...prev, products: prev.products.map((a) => (a.id === id ? updated : a)) }
        case 'brand_reference':
          return { ...prev, brandReferences: prev.brandReferences.map((a) => (a.id === id ? updated : a)) }
        case 'first_frame':
          return { ...prev, firstFrame: updated }
        case 'last_frame':
          return { ...prev, lastFrame: updated }
        case 'cta_graphic':
          return { ...prev, ctaGraphic: updated }
        default:
          return prev
      }
    })
  }, [])

  const uploadAsset = useCallback(async (asset: PersonalizationAsset): Promise<string> => {
    if (!asset.file) throw new Error('Missing file for upload')
    if (!apiKey) throw new Error('Missing API key')

    setAssetUploadStatus(asset.id, 'uploading')
    try {
      const url = await uploadFile(apiKey, asset.file, (_percent) => {
        // optional progress hook
      })
      setAssetUploadStatus(asset.id, 'ready', null)
      // Update URL to durable uploaded URL and revoke old blob
      setAssets((prev) => {
        const updater = (list: PersonalizationAsset[]) => list.map((a) => (a.id === asset.id ? { ...a, url, uploadedUrl: url } : a))
        const old = [
          ...prev.identities,
          ...prev.logos,
          ...prev.products,
          ...prev.brandReferences,
          prev.firstFrame,
          prev.lastFrame,
          prev.ctaGraphic,
        ].find((a) => a?.id === asset.id)
        if (old) revokeAssetUrl(old)
        return {
          ...prev,
          identities: updater(prev.identities),
          logos: updater(prev.logos),
          products: updater(prev.products),
          brandReferences: updater(prev.brandReferences),
          firstFrame: prev.firstFrame?.id === asset.id ? { ...prev.firstFrame, url, uploadedUrl: url } : prev.firstFrame,
          lastFrame: prev.lastFrame?.id === asset.id ? { ...prev.lastFrame, url, uploadedUrl: url } : prev.lastFrame,
          ctaGraphic: prev.ctaGraphic?.id === asset.id ? { ...prev.ctaGraphic, url, uploadedUrl: url } : prev.ctaGraphic,
        }
      })
      return url
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed'
      setAssetUploadStatus(asset.id, 'error', message)
      throw error
    }
  }, [apiKey, setAssetUploadStatus])

  const retryAssetUpload = useCallback(async (id: string) => {
    const all = [
      ...assets.identities,
      ...assets.logos,
      ...assets.products,
      ...assets.brandReferences,
      assets.firstFrame,
      assets.lastFrame,
      assets.ctaGraphic,
    ].filter(Boolean) as PersonalizationAsset[]
    const asset = all.find((a) => a.id === id)
    if (!asset || !asset.file) return
    await uploadAsset(asset)
  }, [assets, uploadAsset])

  const applyEditedPersonalizationAsset = useCallback(async (
    assetId: string,
    dataUrl: string,
    meta: {
      operation: string
      prompt: string
      model: string
      quality: string
      transparent: boolean
      videoReady: boolean
      responseId?: string | null
      imageGenerationCallId?: string | null
      revisedPrompt?: string | null
      outputFormat?: 'png' | 'jpeg' | 'webp'
      outputCompression?: number | null
      inputFidelity?: 'high' | 'low'
      visionAnalysis?: PersonalizationVisionAnalysis
      visionValidation?: PersonalizationVisionValidation
    },
  ) => {
    const all = [
      ...assets.identities,
      ...assets.logos,
      ...assets.products,
      ...assets.brandReferences,
      assets.firstFrame,
      assets.lastFrame,
      assets.ctaGraphic,
    ].filter(Boolean) as PersonalizationAsset[]

    const target = all.find((a) => a.id === assetId)
    if (!target) throw new Error('Asset not found')
    const blob = dataUrlToBlob(dataUrl)
    if (!blob) throw new Error('Edited image could not be read')

    const extension = blob.type === 'image/webp' ? 'webp' : 'png'
    const baseName = (target.name || 'edited-image').replace(/\.[^.]+$/, '')
    const file = new File([blob], baseName + '-edited.' + extension, { type: blob.type || 'image/png' })
    const localUrl = URL.createObjectURL(file)
    const originalUrl = target.originalUrl || target.uploadedUrl || target.url

    const editedAsset: PersonalizationAsset = {
      ...target,
      name: file.name,
      url: localUrl,
      uploadedUrl: undefined,
      file,
      mimeType: file.type,
      uploadStatus: 'local',
      uploadError: null,
      originalUrl,
      edited: true,
      videoReady: meta.videoReady,
      hasTransparency: meta.transparent,
      editMetadata: {
        operation: meta.operation,
        prompt: meta.prompt,
        model: meta.model,
        quality: meta.quality,
        responseId: meta.responseId,
        imageGenerationCallId: meta.imageGenerationCallId,
        revisedPrompt: meta.revisedPrompt,
        outputFormat: meta.outputFormat,
        outputCompression: meta.outputCompression,
        inputFidelity: meta.inputFidelity,
      },
      visionAnalysis: meta.visionAnalysis || target.visionAnalysis,
      visionValidation: meta.visionValidation,
    }

    setAssets((prev) => replaceAssetInLibrary(prev, editedAsset))
    await uploadAsset(editedAsset)
  }, [assets, uploadAsset])

  // ── Asset actions ──────────────────────────────────────────────────────────

  const addIdentityFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const newAssets = Array.from(files).map((file) => createAsset(file, 'presenter_identity', {
      isPrimary: assets.identities.length === 0,
    }))
    newAssets.forEach((asset) => {
      setAssets((prev) => updateAssetInLibrary(prev, asset))
      uploadAsset(asset).catch(() => {/* upload status handled in state */})
    })
  }, [assets.identities.length, uploadAsset])

  const addIdentityUrl = useCallback((url: string) => {
    const asset = createAssetFromUrl(url, 'presenter_identity', {
      isPrimary: assets.identities.length === 0,
    })
    setAssets((prev) => updateAssetInLibrary(prev, asset))
  }, [assets.identities.length])

  const removeIdentity = useCallback((id: string) => {
    setAssets((prev) => {
      const asset = prev.identities.find((a) => a.id === id) || prev.primaryIdentity
      revokeAssetUrl(asset)
      return {
        ...prev,
        identities: prev.identities.filter((a) => a.id !== id),
        primaryIdentity: prev.primaryIdentity?.id === id ? null : prev.primaryIdentity,
      }
    })
  }, [])

  const setPrimaryIdentity = useCallback((id: string) => {
    setAssets((prev) => ({
      ...prev,
      identities: prev.identities.map((a) => ({ ...a, isPrimary: a.id === id })),
      primaryIdentity: prev.identities.find((a) => a.id === id) || prev.primaryIdentity,
    }))
  }, [])

  const addLogoFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const newAssets = Array.from(files).map((file) => createAsset(file, 'logo', {
      isPrimary: assets.logos.length === 0,
    }))
    newAssets.forEach((asset) => {
      setAssets((prev) => updateAssetInLibrary(prev, asset))
      uploadAsset(asset).catch(() => {/* upload status handled in state */})
    })
  }, [assets.logos.length, uploadAsset])

  const addLogoUrl = useCallback((url: string) => {
    const asset = createAssetFromUrl(url, 'logo', {
      isPrimary: assets.logos.length === 0,
    })
    setAssets((prev) => updateAssetInLibrary(prev, asset))
  }, [assets.logos.length])

  const removeLogo = useCallback((id: string) => {
    setAssets((prev) => {
      const asset = prev.logos.find((a) => a.id === id) || prev.primaryLogo
      revokeAssetUrl(asset)
      return {
        ...prev,
        logos: prev.logos.filter((a) => a.id !== id),
        primaryLogo: prev.primaryLogo?.id === id ? null : prev.primaryLogo,
      }
    })
  }, [])

  const setPrimaryLogo = useCallback((id: string) => {
    setAssets((prev) => ({
      ...prev,
      logos: prev.logos.map((a) => ({ ...a, isPrimary: a.id === id })),
      primaryLogo: prev.logos.find((a) => a.id === id) || prev.primaryLogo,
    }))
  }, [])

  const addProductFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const newAssets = Array.from(files).map((file) => createAsset(file, 'product_reference'))
    newAssets.forEach((asset) => {
      setAssets((prev) => updateAssetInLibrary(prev, asset))
      uploadAsset(asset).catch(() => {/* upload status handled in state */})
    })
  }, [uploadAsset])

  const addProductUrl = useCallback((url: string) => {
    const asset = createAssetFromUrl(url, 'product_reference')
    setAssets((prev) => updateAssetInLibrary(prev, asset))
  }, [])

  const removeProduct = useCallback((id: string) => {
    setAssets((prev) => {
      const asset = prev.products.find((a) => a.id === id)
      revokeAssetUrl(asset)
      return {
        ...prev,
        products: prev.products.filter((a) => a.id !== id),
      }
    })
  }, [])

  const addBrandReferenceFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const newAssets = Array.from(files).map((file) => createAsset(file, 'brand_reference'))
    newAssets.forEach((asset) => {
      setAssets((prev) => updateAssetInLibrary(prev, asset))
      uploadAsset(asset).catch(() => {/* upload status handled in state */})
    })
  }, [uploadAsset])

  const addBrandReferenceUrl = useCallback((url: string) => {
    const asset = createAssetFromUrl(url, 'brand_reference')
    setAssets((prev) => updateAssetInLibrary(prev, asset))
  }, [])

  const removeBrandReference = useCallback((id: string) => {
    setAssets((prev) => {
      const asset = prev.brandReferences.find((a) => a.id === id)
      revokeAssetUrl(asset)
      return {
        ...prev,
        brandReferences: prev.brandReferences.filter((a) => a.id !== id),
      }
    })
  }, [])

  const setFirstFrameFile = useCallback((file: File | null) => {
    if (!file) {
      setAssets((prev) => ({ ...prev, firstFrame: null }))
      return
    }
    const asset = createAsset(file, 'first_frame', { isPrimary: true })
    setAssets((prev) => ({ ...prev, firstFrame: asset }))
    uploadAsset(asset).catch(() => {/* upload status handled in state */})
  }, [uploadAsset])

  const setFirstFrameUrl = useCallback((url: string) => {
    const asset = createAssetFromUrl(url, 'first_frame', { isPrimary: true })
    setAssets((prev) => ({ ...prev, firstFrame: asset }))
  }, [])

  const removeFirstFrame = useCallback(() => {
    setAssets((prev) => {
      revokeAssetUrl(prev.firstFrame)
      return { ...prev, firstFrame: null }
    })
  }, [])

  const setLastFrameFile = useCallback((file: File | null) => {
    if (!file) {
      setAssets((prev) => ({ ...prev, lastFrame: null }))
      return
    }
    const asset = createAsset(file, 'last_frame', { isPrimary: true })
    setAssets((prev) => ({ ...prev, lastFrame: asset }))
    uploadAsset(asset).catch(() => {/* upload status handled in state */})
  }, [uploadAsset])

  const setLastFrameUrl = useCallback((url: string) => {
    const asset = createAssetFromUrl(url, 'last_frame', { isPrimary: true })
    setAssets((prev) => ({ ...prev, lastFrame: asset }))
  }, [])

  const removeLastFrame = useCallback(() => {
    setAssets((prev) => {
      revokeAssetUrl(prev.lastFrame)
      return { ...prev, lastFrame: null }
    })
  }, [])

  const setCtaGraphicFile = useCallback((file: File | null) => {
    if (!file) {
      setAssets((prev) => ({ ...prev, ctaGraphic: null }))
      return
    }
    const asset = createAsset(file, 'cta_graphic', { isPrimary: true })
    setAssets((prev) => ({ ...prev, ctaGraphic: asset }))
    uploadAsset(asset).catch(() => {/* upload status handled in state */})
  }, [uploadAsset])

  const setCtaGraphicUrl = useCallback((url: string) => {
    const asset = createAssetFromUrl(url, 'cta_graphic', { isPrimary: true })
    setAssets((prev) => ({ ...prev, ctaGraphic: asset }))
  }, [])

  const removeCtaGraphic = useCallback(() => {
    setAssets((prev) => {
      revokeAssetUrl(prev.ctaGraphic)
      return { ...prev, ctaGraphic: null }
    })
  }, [])

  // ── Discovered assets actions ───────────────────────────────────────────────

  const setDiscoveredAssets = useCallback((assets: DiscoveredAsset[]) => {
    setDiscoveredAssetsState(assets)
    setDiscoveryStatus('reviewing')
    setDiscoveryError(null)
  }, [])

  const toggleDiscoveredAssetSelection = useCallback((id: string) => {
    setDiscoveredAssetsState((prev) =>
      prev.map((a) => (a.id === id ? { ...a, selected: !a.selected } : a)),
    )
  }, [])

  const rejectDiscoveredAsset = useCallback((id: string) => {
    setDiscoveredAssetsState((prev) =>
      prev.map((a) => (a.id === id ? { ...a, rejected: true, selected: false } : a)),
    )
  }, [])

  const restoreDiscoveredAsset = useCallback((id: string) => {
    setDiscoveredAssetsState((prev) =>
      prev.map((a) => (a.id === id ? { ...a, rejected: false } : a)),
    )
  }, [])

  const updateDiscoveredAssetCategory = useCallback((id: string, category: DiscoveredAssetCategory) => {
    setDiscoveredAssetsState((prev) =>
      prev.map((a) => (a.id === id ? { ...a, category } : a)),
    )
  }, [])

  const selectRecommendedDiscoveredAssets = useCallback(() => {
    setDiscoveredAssetsState((prev) =>
      prev.map((a) => ({ ...a, selected: a.recommended })),
    )
  }, [])

  const removeDiscoveredAssetFromSection = useCallback((id: string) => {
    setDiscoveredAssetsState((prev) =>
      prev.map((a) => (a.id === id ? { ...a, assignedSection: null, autoAssigned: false } : a)),
    )
  }, [])

  const moveDiscoveredAssetToSection = useCallback((id: string, section: AssignedSection) => {
    setDiscoveredAssetsState((prev) =>
      prev.map((a) => (a.id === id ? { ...a, assignedSection: section, autoAssigned: false } : a)),
    )
  }, [])

  const importDiscoveredAssets = useCallback(async () => {
    setDiscoveryStatus('importing')
    setDiscoveryError(null)

    const toImport = discoveredAssets.filter((a) => a.selected && !a.rejected)
    if (toImport.length === 0) {
      setDiscoveryStatus('reviewing')
      return
    }

    const sectionRoleMap: Record<string, PersonalizationAsset['role']> = {
      person: 'presenter_identity',
      logo: 'logo',
      products: 'product_reference',
      brand: 'brand_reference',
      firstFrame: 'first_frame',
      lastFrame: 'last_frame',
      ctaGraphic: 'cta_graphic',
    }

    const categoryRoleMap: Record<string, PersonalizationAsset['role']> = {
      person: 'presenter_identity',
      logo: 'logo',
      product: 'product_reference',
      service: 'product_reference',
      completed_work: 'product_reference',
      storefront: 'brand_reference',
      office: 'brand_reference',
      branded_vehicle: 'brand_reference',
      team: 'brand_reference',
      brand: 'brand_reference',
    }

    // 1. Download only untouched remote assets. Edited assets already carry
    // an in-memory data URL produced by the editor and should not be sent to
    // the server-side downloader.
    const remoteItems = toImport.filter((item) => !item.editedDataUrl)
    const downloadedByUrl = new Map<string, string>()
    let partialDownloadError: string | null = null

    if (remoteItems.length > 0) {
      let downloadRes: Response
      try {
        downloadRes = await fetch('/api/personalization/download-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: remoteItems.map((a) => a.previewUrl) }),
          credentials: 'same-origin',
        })
      } catch (err) {
        setDiscoveryError(err instanceof Error ? err.message : 'Failed to reach download service')
        setDiscoveryStatus('reviewing')
        return
      }

      if (!downloadRes.ok) {
        const data = await downloadRes.json().catch(() => ({}))
        const status = downloadRes.status
        if (status === 401) {
          setDiscoveryError('Authentication required. Please sign in to continue.')
        } else if (status === 403) {
          setDiscoveryError('You do not have access to this feature. Contact your administrator.')
        } else {
          setDiscoveryError(data?.error || `Download failed (HTTP ${status})`)
        }
        setDiscoveryStatus('reviewing')
        return
      }

      const downloadData = await downloadRes.json()
      const results = Array.isArray(downloadData?.results) ? downloadData.results : []
      const failedDownloads: string[] = []
      for (const result of results) {
        if (result?.ok && result?.url && result?.dataUrl) {
          downloadedByUrl.set(result.url, result.dataUrl)
        } else if (result?.url) {
          failedDownloads.push(result.url)
        }
      }
      if (failedDownloads.length > 0 && failedDownloads.length < remoteItems.length) {
        partialDownloadError = `${failedDownloads.length} of ${remoteItems.length} assets failed to download. ${downloadedByUrl.size} assets were imported.`
      } else if (failedDownloads.length === remoteItems.length) {
        setDiscoveryError('All assets failed to download. Please try again.')
        setDiscoveryStatus('reviewing')
        return
      }
    }

    // 2. Build assets from either edited data URLs or downloaded originals.
    const assetsToCreate: { item: DiscoveredAsset; blob: Blob; role: PersonalizationAsset['role']; isPrimary: boolean }[] = []

    for (const item of toImport) {
      const dataUrl = item.editedDataUrl || downloadedByUrl.get(item.previewUrl)
      if (!dataUrl) continue

      const role = sectionRoleMap[item.assignedSection || ''] || categoryRoleMap[item.category] || 'brand_reference'
      if (!role) continue

      const blob = dataUrlToBlob(dataUrl)
      if (!blob) continue

      const isPrimary =
        role === 'presenter_identity' ? true :
        role === 'logo' ? true :
        false

      assetsToCreate.push({ item, blob, role, isPrimary })
    }

    if (assetsToCreate.length === 0) {
      setDiscoveryError(partialDownloadError || 'No valid images could be downloaded.')
      setDiscoveryStatus('reviewing')
      return
    }

    // 3. Build asset objects before updating library so upload can reference them.
    const createdAssets: PersonalizationAsset[] = []
    for (const { item, blob, role, isPrimary } of assetsToCreate) {
      const asset = createAsset(blob, role, {
        isPrimary,
        name: `discovered_${Date.now()}`,
        originalUrl: item.originalPreviewUrl || item.previewUrl,
        edited: item.edited || false,
        videoReady: item.videoReady || false,
        hasTransparency: item.hasTransparency || false,
        editMetadata: item.editMetadata,
        visionAnalysis: item.visionAnalysis,
        visionValidation: item.visionValidation,
        sourceCategory: item.category,
        sourceType: item.sourceType,
        sourceDiscoveredAssetId: item.id,
      })
      createdAssets.push(asset)
    }

    // 3a. Add assets to library
    setAssets((prev) => {
      let next = { ...prev }
      for (const asset of createdAssets) {
        next = updateAssetInLibrary(next, asset)
      }
      return next
    })

    // 4. Upload each asset to get durable URLs
    const uploadErrors: string[] = []
    for (const asset of createdAssets) {
      try {
        await uploadAsset(asset)
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Upload failed'
        uploadErrors.push(`${asset.name}: ${message}`)
        setAssetUploadStatus(asset.id, 'error', message)
      }
    }

    setDiscoveredAssetsState([])
    setDiscoveryStatus('idle')

    const totalAttempted = createdAssets.length
    const successCount = totalAttempted - uploadErrors.length
    if (uploadErrors.length > 0) {
      const summary = uploadErrors.length === totalAttempted
        ? `All ${totalAttempted} asset(s) failed to upload.`
        : `${uploadErrors.length} of ${totalAttempted} asset(s) failed to upload. ${successCount} succeeded.`
      setDiscoveryError(partialDownloadError
        ? `${partialDownloadError} ${summary}`
        : summary)
    } else if (partialDownloadError) {
      setDiscoveryError(partialDownloadError)
    }

    setImportConfirmation({
      count: successCount,
      failedCount: uploadErrors.length,
      clientName: clientForm.businessName || clientForm.name || undefined,
    })
  }, [discoveredAssets, setAssets, uploadAsset, clientForm])

  const cancelDiscovery = useCallback(() => {
    setDiscoveredAssetsState([])
    setDiscoveryStatus('idle')
    setDiscoveryError(null)
    setVisionStatus('idle')
    setVisionError(null)
  }, [])

  const discoverAssets = useCallback(async (websiteUrl: string) => {
    setDiscoveryError(null)
    setVisionError(null)
    setVisionStatus('idle')
    setDiscoveryStatus('discovering')

    try {
      const res = await fetch('/api/personalization/discover-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl, testMode }),
        credentials: 'same-origin',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const status = res.status
        if (status === 401) {
          throw new Error('Authentication required. Please sign in to continue.')
        }
        if (status === 403) {
          throw new Error('You do not have access to this feature. Contact your administrator.')
        }
        throw new Error(data?.error || `Discovery failed (HTTP ${status})`)
      }

      const data = await res.json()
      const discoveredAssets: DiscoveredAsset[] = Array.isArray(data?.discoveredAssets) ? data.discoveredAssets : []
      const providerUsed = typeof data?.providerUsed === 'string' ? data.providerUsed : 'UNKNOWN'

      if (discoveredAssets.length === 0) {
        setDiscoveryError('No useful assets were found on that website.')
        setDiscoveryStatus('idle')
        return
      }

      setDiscoveredAssetsState(discoveredAssets)
      setDiscoveryStatus('reviewing')
      console.log(`[discovery] completed via ${providerUsed}: ${discoveredAssets.length} assets`)
    } catch (error) {
      setDiscoveryError(error instanceof Error ? error.message : 'Discovery failed')
      setDiscoveryStatus('idle')
    }
  }, [setDiscoveredAssetsState, setDiscoveryError, setDiscoveryStatus, testMode])


  const analyzeDiscoveredAssets = useCallback(async () => {
    if (discoveredAssets.length === 0) return
    setVisionStatus('analyzing')
    setVisionError(null)

    const sectionForCategory = (category: DiscoveredAssetCategory): AssignedSection => {
      if (category === 'person') return 'person'
      if (category === 'logo') return 'logo'
      if (category === 'product' || category === 'service' || category === 'completed_work') return 'products'
      if (category === 'storefront' || category === 'office' || category === 'branded_vehicle' || category === 'team' || category === 'brand') return 'brand'
      return null
    }

    try {
      const analysesById = new Map<string, PersonalizationVisionAnalysis>()
      const candidates = discoveredAssets.filter((asset) => !asset.rejected && asset.previewUrl)

      for (let index = 0; index < candidates.length; index += 8) {
        const batch = candidates.slice(index, index + 8)
        const res = await fetch('/api/personalization/image-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            mode: 'analyze',
            images: batch.map((asset) => ({
              id: asset.id,
              imageUrl: asset.editedDataUrl || asset.previewUrl,
              categoryHint: asset.category,
              roleHint: asset.assignedSection || undefined,
            })),
            businessContext: {
              businessName: clientForm.businessName || clientForm.name,
              industry: clientForm.industry,
              productService: clientForm.productService,
              brandDescription: clientForm.brandDescription,
            },
            targetVideoFormat: genOptions.aspectRatio || source?.aspectRatio || undefined,
          }),
        })

        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          const status = res.status
          if (status === 401) {
            throw new Error('Authentication required. Please sign in to use SmartVideo GO Vision.')
          }
          if (status === 403) {
            throw new Error('You do not have the SmartVideo GO entitlement. Contact your administrator.')
          }
          throw new Error(data?.message || data?.error || `Vision analysis failed (HTTP ${status})`)
        }

        const analyses = Array.isArray(data?.analyses) ? data.analyses : []
        if (analyses.length === 0 && candidates.length > 0) {
          throw new Error('Vision analysis returned no results. Please try again or check your images.')
        }

        for (const analysis of analyses) {
          if (analysis?.id) analysesById.set(analysis.id, analysis as PersonalizationVisionAnalysis)
        }
      }

      setDiscoveredAssetsState((previous) => previous.map((asset) => {
        const analysis = analysesById.get(asset.id)
        if (!analysis) return asset

        const useVisionCategory = analysis.confidence >= 75
        const category = useVisionCategory ? analysis.category : asset.category
        const recommended =
          category !== 'irrelevant' &&
          !analysis.duplicateLikely &&
          analysis.relevanceScore >= 60 &&
          analysis.qualityScore >= 35

        return {
          ...asset,
          category,
          confidence: analysis.confidence,
          qualityScore: analysis.qualityScore,
          relevanceScore: analysis.relevanceScore,
          recommended,
          selected: analysis.duplicateLikely ? false : (asset.selected || recommended),
          assignedSection:
            asset.autoAssigned && useVisionCategory
              ? sectionForCategory(category)
              : asset.assignedSection,
          visionAnalysis: analysis,
        }
      }))

      // Cross-batch duplicate detection: propagate duplicateLikely to assets
      // with normalized matching URLs across all batches.
      const normalizedUrlIndex = new Map<string, string>()
      for (const asset of discoveredAssets) {
        const url = asset.editedDataUrl || asset.previewUrl
        if (!url) continue
        const normalized = normalizeUrl(url)
        if (normalizedUrlIndex.has(normalized)) {
          normalizedUrlIndex.set(normalized, asset.id)
        } else {
          normalizedUrlIndex.set(normalized, asset.id)
        }
      }

      setDiscoveredAssetsState((previous) => previous.map((asset) => {
        const analysis = analysesById.get(asset.id)
        if (!analysis) return asset
        const url = asset.editedDataUrl || asset.previewUrl
        if (!url) return asset
        const normalized = normalizeUrl(url)
        const duplicateOf = normalizedUrlIndex.get(normalized)
        if (duplicateOf && duplicateOf !== asset.id) {
          return {
            ...asset,
            selected: false,
            recommended: false,
            visionAnalysis: {
              ...analysis,
              duplicateLikely: true,
              duplicateOf,
            },
          }
        }
        return asset
      }))

      setVisionStatus('complete')
    } catch (error) {
      setVisionStatus('error')
      setVisionError(error instanceof Error ? error.message : 'Vision analysis failed')
    }
  }, [
    clientForm.brandDescription,
    clientForm.businessName,
    clientForm.industry,
    clientForm.name,
    clientForm.productService,
    discoveredAssets,
    genOptions.aspectRatio,
    source?.aspectRatio,
  ])

  // ── Business search actions ────────────────────────────────────────────────

  const findBusinesses = useCallback(async (niche: string, location: string, radiusMiles: number) => {
    setBusinessSearchError(null)
    setBusinessSearchMode('searching')
    setBusinessSearchQuery({ niche, location, radiusMiles })
    setSelectedBusiness(null)

    try {
      const res = await fetch('/api/personalization/find-businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, location, radiusMiles }),
        credentials: 'same-origin',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || `Business search failed (HTTP ${res.status})`)
      }

      const data = await res.json()
      const businesses = Array.isArray(data?.businesses) ? data.businesses : []
      const query = data?.query || { niche, location, radiusMiles }

      setBusinessSearchQuery(query)
      setBusinessSearchResults(businesses)
      setBusinessSearchMode(businesses.length > 0 ? 'results' : 'error')
      if (businesses.length === 0) {
        setBusinessSearchError('No businesses found for this niche and location. Try a wider radius or different niche.')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Business search failed'
      setBusinessSearchError(message)
      setBusinessSearchMode('error')
    }
  }, [])

  const selectBusiness = useCallback((business: BusinessDiscoveryRecord) => {
    setSelectedBusiness(business)
    setBusinessSearchMode('selected')
    setBusinessResearch({ status: 'idle' })

    // Populate client form from business
    const clientFormPatch: Partial<ClientProfile> = {
      businessName: business.name,
      industry: business.category,
      location: [business.city, business.region].filter(Boolean).join(', ') || undefined,
      phone: business.phone,
      website: business.website,
    }

    updateClientForm(clientFormPatch)

    // Do NOT auto-trigger asset discovery here.
    // User must explicitly click "Research Business" then "Find Business Assets".
  }, [updateClientForm])

  const researchBusiness = useCallback(async () => {
    const website = clientForm.website || selectedBusiness?.website
    if (!website) {
      setBusinessResearch({ status: 'error', error: 'No website available to research.' })
      return
    }

    setBusinessResearch({ status: 'researching' })

    try {
      const res = await fetch('/api/personalization/research-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl: website }),
        credentials: 'same-origin',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || `Research failed (HTTP ${res.status})`)
      }

      const data = (await res.json()) as { research?: { canonicalUrl?: string; reachable?: boolean; title?: string; description?: string; logoUrl?: string; socialLinks?: Record<string, string>; contactInfo?: { phones?: string[]; emails?: string[] } } }
      const research = data?.research

      if (!research) {
        throw new Error('No research data returned')
      }

      // Update business research state
      setBusinessResearch({
        status: 'done',
        result: {
          canonicalUrl: research.canonicalUrl,
          reachable: research.reachable ?? false,
          title: research.title,
          description: research.description,
          logoUrl: research.logoUrl,
          socialLinks: research.socialLinks,
          contactInfo: research.contactInfo
            ? {
                phones: research.contactInfo.phones ?? [],
                emails: research.contactInfo.emails ?? [],
              }
            : undefined,
        },
      })

      // Update website field with canonical URL if different
      if (research.canonicalUrl && research.canonicalUrl !== clientForm.website) {
        updateClientForm({ website: research.canonicalUrl })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Research failed'
      setBusinessResearch({ status: 'error', error: message })
    }
  }, [clientForm.website, selectedBusiness, updateClientForm])

  const clearBusinessSearch = useCallback(() => {
    setBusinessSearchMode('idle')
    setBusinessSearchResults([])
    setBusinessSearchError(null)
    setBusinessSearchQuery(null)
    setSelectedBusiness(null)
    setBusinessResearch({ status: 'idle' })
  }, [])

  // ── Prompt actions ─────────────────────────────────────────────────────────

  const personalizePromptFn = useCallback(async () => {
    if (!source || !clientForm) return
    setGeneration((prev) => ({ ...prev, status: 'personalizing-prompt', progress: 10, progressMessage: 'Personalizing prompt...' }))
    try {
      const personalized = await personalizePrompt({
        originalPrompt: promptState.original,
        client: clientForm as ClientProfile,
        assets,
        outputType,
      })
      setPromptState((prev) => ({ ...prev, personalized }))
      setGeneration((prev) => ({ ...prev, status: 'idle', progress: 100, progressMessage: 'Prompt personalized' }))
    } catch (error) {
      setGeneration((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Failed to personalize prompt',
      }))
    }
  }, [source, clientForm, promptState.original, assets, outputType])

  const updatePersonalizedPrompt = useCallback((text: string) => {
    setPromptState((prev) => ({ ...prev, edited: text }))
  }, [])

  const resetPrompt = useCallback(() => {
    setPromptState((prev) => ({ ...prev, personalized: '', edited: '' }))
  }, [])

  // ── Generation actions ─────────────────────────────────────────────────────

  const generate = useCallback(async () => {
    if (!source || !apiKey) return

    // Guard: block blob URLs from reaching generation
    const allAssets: PersonalizationAsset[] = [
      ...assets.identities,
      ...assets.logos,
      ...assets.products,
      ...assets.brandReferences,
      assets.firstFrame,
      assets.lastFrame,
      assets.ctaGraphic,
    ].filter(Boolean) as PersonalizationAsset[]

    const uploadingAssets = allAssets.filter((a) => a.uploadStatus === 'uploading')
    if (uploadingAssets.length > 0) {
      setGeneration({
        ...EMPTY_GENERATION_STATE,
        status: 'error',
        errorMessage: `${uploadingAssets.length} asset(s) are still uploading. Please wait.`,
      })
      return
    }

    const failedAssets = allAssets.filter((a) => a.uploadStatus === 'error')
    if (failedAssets.length > 0) {
      setGeneration({
        ...EMPTY_GENERATION_STATE,
        status: 'error',
        errorMessage: `${failedAssets.length} asset(s) failed to upload. Please retry or remove them.`,
      })
      return
    }

    const blobAssets = allAssets.filter((a) => a.url.startsWith('blob:'))
    if (blobAssets.length > 0) {
      setGeneration({
        ...EMPTY_GENERATION_STATE,
        status: 'error',
        errorMessage: 'Some assets are not uploaded yet. Please wait for uploads to complete.',
      })
      return
    }

    setGeneration({ ...EMPTY_GENERATION_STATE, status: 'generating', progress: 5, progressMessage: 'Preparing assets...' })
    setResult(null)

    try {
      const capabilities = resolveModelCapabilities(source, genOptions)
      let resolved = resolveAssetsForModel(source, assets, mode, genOptions, capabilities)

      const finalPrompt = promptState.edited || promptState.personalized || promptState.original

      // Pre-generate CTA end card if exact end-card handling is requested
      if (genOptions.exactCtaHandling === 'final-end-card' && source.mediaType !== 'prompt-only') {
        setGeneration((prev) => ({ ...prev, progress: 3, progressMessage: 'Preparing branding assets...' }))
        const endCardUrl = await generateEndCardImage(clientForm as Record<string, unknown> | undefined, assets.primaryLogo?.file || null, apiKey)
        if (endCardUrl) {
          resolved = {
            ...resolved,
            postProcessing: {
              ...resolved.postProcessing,
              endCard: endCardUrl,
            },
          }
        }
      }

      const project = {
        source,
        client: clientForm || {},
        assets,
        mode,
        personalizedPrompt: finalPrompt,
      }
      lastProjectRef.current = project

      const genResult = await runGeneration({
        source,
        client: clientForm || {},
        assets,
        resolved,
        prompt: finalPrompt,
        mode,
        options: genOptions,
        apiKey,
        onProgress: (percent, message) => {
          setGeneration((prev) => ({ ...prev, progress: percent, progressMessage: message }))
        },
      })

      // Apply deterministic post-processing (logo overlay, CTA end card)
      setGeneration((prev) => ({ ...prev, progress: 90, progressMessage: 'Applying branding...' }))
      const postResult = await applyPostProcessing({
        generatedUrl: genResult.url || '',
        type: genResult.type as 'image' | 'video',
        postProcessing: resolved.postProcessing,
        apiKey,
      })

      const finalUrl = postResult.finalUrl || genResult.url || ''
      const resultWithPostProcessing: GenerationResult = {
        ...genResult,
        url: finalUrl,
        metadata: {
          ...genResult.metadata,
          postProcessing: postResult.applied,
          postProcessingFailed: postResult.failed,
          originalUrl: postResult.originalUrl,
          postProcessingInput: resolved.postProcessing,
        },
      }

      lastResultRef.current = resultWithPostProcessing
      setResult(resultWithPostProcessing)
      setResultTab('prompt')
      setGeneration({ ...EMPTY_GENERATION_STATE, status: 'complete', progress: 100, progressMessage: 'Complete' })

      // Register shared media
      const entry = registerSharedMedia({
        sourceType: source.sourceType,
        sourceDemoId: source.id,
        sourceMedia: source.sourceMedia,
        personalizationMode: mode || undefined,
        model: resultWithPostProcessing.metadata?.model as string | undefined,
        originalPrompt: promptState.original,
        personalizedPrompt: finalPrompt,
        identityAssetIds: assets.identities.map((i) => i.id),
        logoAssetIds: assets.logos.map((l) => l.id),
        productAssetIds: assets.products.map((p) => p.id),
        brandReferenceAssetIds: assets.brandReferences.map((b) => b.id),
        firstFrameAssetId: assets.firstFrame?.id || null,
        lastFrameAssetId: assets.lastFrame?.id || null,
        outputUrls: resultWithPostProcessing.urls || (finalUrl ? [finalUrl] : []),
        outputType: resultWithPostProcessing.type,
        clientId: selectedClientId || undefined,
      })
      setSharedMediaEntries(getSharedMedia())

      // Also persist to Supabase server-side so history survives
      // across devices and browser clears. Best-effort: do not block UI.
      registerSupabaseSharedMedia({
        originStudio: 'demo-personalization',
        sourceType: source.sourceType,
        sourceDemoId: source.id,
         sourceDemoSlug: (source as { slug?: string }).slug ?? null,
        sourceMedia: source.sourceMedia,
        sourceUrl: source.sourceUrl,
        personalizationMode: mode || null,
        model: resultWithPostProcessing.metadata?.model as string | undefined,
        originalPrompt: promptState.original,
        personalizedPrompt: finalPrompt,
        identityAssetIds: assets.identities.map((i) => i.id),
        logoAssetIds: assets.logos.map((l) => l.id),
        productAssetIds: assets.products.map((p) => p.id),
        brandReferenceAssetIds: assets.brandReferences.map((b) => b.id),
        firstFrameAssetId: assets.firstFrame?.id || null,
        lastFrameAssetId: assets.lastFrame?.id || null,
        outputUrls: resultWithPostProcessing.urls || (finalUrl ? [finalUrl] : []),
        outputType: resultWithPostProcessing.type,
        clientId: selectedClientId || undefined,
      }).catch(() => {
        // Supabase persistence is best-effort; localStorage remains the source of truth
      })
    } catch (error) {
      setGeneration({
        ...EMPTY_GENERATION_STATE,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Generation failed',
      })
    }
  }, [source, apiKey, assets, mode, genOptions, promptState, clientForm, selectedClientId])

  const retry = useCallback(async () => {
    await generate()
  }, [generate])

  const generateAgain = useCallback(async () => {
    await generate()
  }, [generate])

  const retryBranding = useCallback(async () => {
    const lastResult = lastResultRef.current
    const lastProject = lastProjectRef.current
    if (!lastResult || !lastProject || !apiKey) return

    const originalUrl = lastResult.metadata?.originalUrl as string | undefined
    const postProcessingInput = (lastResult.metadata?.postProcessingInput || null) as Record<string, unknown> | null
    if (!originalUrl || !postProcessingInput) return

    setGeneration({ ...EMPTY_GENERATION_STATE, status: 'generating', progress: 85, progressMessage: 'Retrying branding...' })

    try {
      const postResult = await applyPostProcessing({
        generatedUrl: originalUrl,
        type: lastResult.type as 'image' | 'video',
        postProcessing: postProcessingInput,
        apiKey,
      })

      const finalUrl = postResult.finalUrl || originalUrl
      const metadata: Record<string, unknown> = {
        ...(lastResult.metadata || {}),
        postProcessing: postResult.applied,
        postProcessingFailed: postResult.failed,
        originalUrl: postResult.originalUrl,
        postProcessingInput,
      }
      const updatedResult: GenerationResult = {
        ...lastResult,
        url: finalUrl,
        metadata,
      }

      lastResultRef.current = updatedResult
      setResult(updatedResult)
      setGeneration({ ...EMPTY_GENERATION_STATE, status: 'complete', progress: 100, progressMessage: 'Branding updated' })
    } catch (error) {
      setGeneration({
        ...EMPTY_GENERATION_STATE,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Branding retry failed',
      })
    }
  }, [apiKey])

  // ── Result actions ─────────────────────────────────────────────────────────

  const editInImageStudio = useCallback(() => {
    if (!lastResultRef.current || !lastProjectRef.current || lastResultRef.current.type !== 'image') return
    const result = lastResultRef.current
    const project = lastProjectRef.current
    const prompt = result.prompt || project.personalizedPrompt || project.source.originalPrompt || ''
    const safeUrl = result.url && !result.url.startsWith('blob:') ? result.url : (project.source.sourceMedia && !project.source.sourceMedia.startsWith('blob:') ? project.source.sourceMedia : null)

    writeHandoff({
      version: 1,
      target: 'image',
      from: 'storyboard',
      projectName: project.source.title || 'Personalized Image',
      aspectRatio: (project.source.aspectRatio as '16:9' | '9:16' | '1:1' | null) || '1:1',
      episodeDuration: 0,
      videoUrl: null,
      referenceImageUrl: safeUrl,
      characterNames: project.assets.identities.map((i) => i.name).filter(Boolean),
      shots: prompt
        ? [{ scene: project.source.title || 'Personalized', prompt, duration: 0, characterNames: [] }]
        : [],
      combinedPrompt: prompt,
      firstFrameUrl: safeUrl,
      createdAt: new Date().toISOString(),
    })

    closePersonalize()
    router.push('/studio/image')
  }, [closePersonalize, router])

  const editInVideoStudio = useCallback(() => {
    if (!lastResultRef.current || !lastProjectRef.current || lastResultRef.current.type !== 'video') return
    const result = lastResultRef.current
    const project = lastProjectRef.current
    const prompt = result.prompt || project.personalizedPrompt || project.source.originalPrompt || ''

    writeHandoff({
      version: 1,
      target: 'video',
      from: 'storyboard',
      projectName: project.source.title || 'Personalized Video',
      aspectRatio: (project.source.aspectRatio as '16:9' | '9:16' | '1:1' | null) || '16:9',
      episodeDuration: project.source.duration || 0,
      videoUrl: result.url || null,
      referenceImageUrl: getGenerationAssetUrl(project.assets.primaryIdentity) || null,
      characterNames: project.assets.identities.map((i) => i.name).filter(Boolean),
      shots: prompt
        ? [{ scene: project.source.title || 'Personalized', prompt, duration: project.source.duration || 0, characterNames: [] }]
        : [],
      combinedPrompt: prompt,
      firstFrameUrl: getGenerationAssetUrl(project.assets.firstFrame) || null,
      createdAt: new Date().toISOString(),
    })

    closePersonalize()
    router.push('/studio/video')
  }, [closePersonalize, router])

  const publish = useCallback(() => {
    if (!lastResultRef.current?.url) return
    if (!socialPublish) return
    const result = lastResultRef.current
    const project = lastProjectRef.current

    socialPublish.openPublish({
      mediaUrl: result.url || '',
      mediaType: result.type === 'video' ? 'video' : 'image',
      title: project?.source?.title || 'Personalized content',
      caption: result.prompt || project?.personalizedPrompt || project?.source?.originalPrompt || '',
    })
  }, [socialPublish])

  const download = useCallback(() => {
    if (!lastResultRef.current?.url) return
    const link = document.createElement('a')
    link.href = lastResultRef.current.url
    link.download = `personalized-${lastResultRef.current.type}-${Date.now()}.${lastResultRef.current.type === 'video' ? 'mp4' : 'png'}`
    link.click()
  }, [])

  // ── Context value ──────────────────────────────────────────────────────────

  const ctxValue: DemoPersonalizeContextValue = {
    // Modal
    isOpen,
    source,
    sourceTypeLabel,
    openPersonalize,
    closePersonalize,

    // Client
    clients,
    selectedClientId,
    clientForm,
    selectClient,
    createClient: createClientRecord,
    saveClient,
    updateClient,
    deleteClient,
    updateClientForm,

    // Saved client assets
    savedClientAssets,
    savedAssetLibraryTab,
    setSavedAssetLibraryTab,
    useSavedClient,
    deleteSavedClient,
    selectSavedAsset,
    setPrimarySavedAsset,
    removeSavedAsset,

    // Assets
    assets,
    addIdentityFiles,
    addIdentityUrl,
    removeIdentity,
    setPrimaryIdentity,
    addLogoFiles,
    addLogoUrl,
    removeLogo,
    setPrimaryLogo,
    addProductFiles,
    addProductUrl,
    removeProduct,
    addBrandReferenceFiles,
    addBrandReferenceUrl,
    removeBrandReference,
    setFirstFrameFile,
    setFirstFrameUrl,
    removeFirstFrame,
    setLastFrameFile,
    setLastFrameUrl,
    removeLastFrame,
    setCtaGraphicFile,
    setCtaGraphicUrl,
    removeCtaGraphic,
    retryAssetUpload,
    applyEditedPersonalizationAsset,

    // Discovered assets
    discoveredAssets,
    discoveryStatus,
    discoveryError,
    importConfirmation,
    setDiscoveredAssets,
    toggleDiscoveredAssetSelection,
    rejectDiscoveredAsset,
    restoreDiscoveredAsset,
    updateDiscoveredAssetCategory,
    removeDiscoveredAssetFromSection,
    moveDiscoveredAssetToSection,
    selectRecommendedDiscoveredAssets,
    importDiscoveredAssets,
    cancelDiscovery,
    discoverAssets,
    visionStatus,
    visionError,
    analyzeDiscoveredAssets,

    // Business search
    businessSearchMode,
    businessSearchResults,
    businessSearchError,
    businessSearchQuery,
    selectedBusiness,
    businessResearch,
    findBusinesses,
    selectBusiness,
    researchBusiness,
    clearBusinessSearch,
    setBusinessSearchMode,

    // Prompt
    promptState,
    personalizePrompt: personalizePromptFn,
    updatePersonalizedPrompt,
    resetPrompt,

    // Output / mode / options
    outputType,
    setOutputType,
    mode,
    setMode,
    genOptions,
    updateGenOptions: (patch: Partial<GenerationOptions>) => setGenOptions((prev) => ({ ...prev, ...patch })),
    consent,
    setConsent,

    // Generation
    generate,
    retry,
    generateAgain,
    retryBranding,
    generation,

    // Result
    result,
    resultTab,
    setResultTab,
    editInImageStudio,
    editInVideoStudio,
    publish,
    download,

    // Shared media
    sharedMediaEntries,
    eligibility,
  }

  return (
    <PersonalizationContext.Provider value={ctxValue}>
      {children}
      {isOpen && source && (
        <PersonalizationModal />
      )}
    </PersonalizationContext.Provider>
  )
}
