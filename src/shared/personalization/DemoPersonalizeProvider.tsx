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

/** Safe accessor for SocialPublishContext — returns null when not wrapped in a provider. */
function useOptionalSocialPublish() {
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
  getSharedMedia,
  registerSharedMedia,
} from './sharedMedia'
import { personalizePrompt, regeneratePrompt } from './promptPersonalizer'
import { runGeneration } from './generationRouter'
import { resolveModelCapabilities, resolveAssetsForModel } from './modelCapabilityResolver'
import { uploadFile } from 'studio/src/muapi'

// ── Constants ────────────────────────────────────────────────────────────────

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
  removeIdentity: (id: string) => void
  setPrimaryIdentity: (id: string) => void
  addLogoFiles: (files: FileList | null) => void
  removeLogo: (id: string) => void
  setPrimaryLogo: (id: string) => void
  addProductFiles: (files: FileList | null) => void
  removeProduct: (id: string) => void
  addBrandReferenceFiles: (files: FileList | null) => void
  removeBrandReference: (id: string) => void
  setFirstFrameFile: (file: File | null) => void
  removeFirstFrame: () => void
  setLastFrameFile: (file: File | null) => void
  removeLastFrame: () => void
  setCtaGraphicFile: (file: File | null) => void
  removeCtaGraphic: () => void
  retryAssetUpload: (id: string) => Promise<void>

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
}

const PersonalizationContext = createContext<DemoPersonalizeContextValue | null>(null)

export function useDemoPersonalize(): DemoPersonalizeContextValue {
  const ctx = useContext(PersonalizationContext)
  if (!ctx) throw new Error('useDemoPersonalize must be used within DemoPersonalizeProvider')
  return ctx
}

interface DemoPersonalizeProviderProps {
  apiKey?: string
  children: ReactNode
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function createAsset(file: File, role: PersonalizationAsset['role'], opts: Partial<PersonalizationAsset> = {}): PersonalizationAsset {
  return {
    id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    role,
    name: file.name,
    url: URL.createObjectURL(file),
    isPrimary: false,
    mimeType: file.type,
    createdAt: new Date().toISOString(),
    uploadStatus: 'local',
    uploadError: null,
    file,
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

// ── Provider ─────────────────────────────────────────────────────────────────

export function DemoPersonalizeProvider({ apiKey, children }: DemoPersonalizeProviderProps) {
  // Navigation & publish integration
  const router = useRouter()
  const socialPublish = useOptionalSocialPublish()
  // Modal
  const [isOpen, setIsOpen] = useState(false)
  const [source, setSource] = useState<PersonalizationSource | null>(null)
  const [sourceTypeLabel, setSourceTypeLabel] = useState<string | undefined>(undefined)
  const triggerRef = useRef<HTMLElement | null>(null)

  // Client
  const [clients, setClients] = useState<ClientProfile[]>(loadClients)
  const [selectedClientId, setSelectedClientId] = useState<string>(() => getCurrentClientId() || '')
  const [clientForm, setClientForm] = useState<Partial<ClientProfile>>({})

  // Assets
  const [assets, setAssets] = useState<AssetLibrary>({ ...EMPTY_ASSET_LIBRARY })

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

  const currentClient = clients.find((c) => c.id === selectedClientId) || null

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
  }, [source?.id])

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

  const deleteClientRecord = useCallback((id: string) => {
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

  // ── Asset upload helpers ───────────────────────────────────────────────────

  const updateAsset = useCallback((asset: PersonalizationAsset) => {
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
      const url = await uploadFile(apiKey, asset.file, (percent) => {
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

  const removeCtaGraphic = useCallback(() => {
    setAssets((prev) => {
      revokeAssetUrl(prev.ctaGraphic)
      return { ...prev, ctaGraphic: null }
    })
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
    console.log('blobAssets:', blobAssets.length, blobAssets.map(a => ({ url: a.url })));
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
      const resolved = resolveAssetsForModel(source, assets, mode, genOptions, capabilities)

      const finalPrompt = promptState.edited || promptState.personalized || promptState.original

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
        mode: mode as any,
        options: genOptions,
        apiKey,
        onProgress: (percent, message) => {
          setGeneration((prev) => ({ ...prev, progress: percent, progressMessage: message }))
        },
      })

      lastResultRef.current = genResult
      setResult(genResult)
      setResultTab('prompt')
      setGeneration({ ...EMPTY_GENERATION_STATE, status: 'complete', progress: 100, progressMessage: 'Complete' })

      // Register shared media
      const entry = registerSharedMedia({
        sourceType: source.sourceType,
        sourceDemoId: source.id,
        sourceMedia: source.sourceMedia,
        personalizationMode: mode || undefined,
        model: genResult.metadata?.model as string | undefined,
        originalPrompt: promptState.original,
        personalizedPrompt: finalPrompt,
        identityAssetIds: assets.identities.map((i) => i.id),
        logoAssetIds: assets.logos.map((l) => l.id),
        productAssetIds: assets.products.map((p) => p.id),
        brandReferenceAssetIds: assets.brandReferences.map((b) => b.id),
        firstFrameAssetId: assets.firstFrame?.id || null,
        lastFrameAssetId: assets.lastFrame?.id || null,
        outputUrls: genResult.urls || (genResult.url ? [genResult.url] : []),
        outputType: genResult.type,
        clientId: selectedClientId || undefined,
      })
      setSharedMediaEntries(getSharedMedia())
    } catch (error) {
      setGeneration({
        ...EMPTY_GENERATION_STATE,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Generation failed',
      })
    }
  }, [source, apiKey, assets, mode, genOptions, promptState, clientForm, selectedClientId, uploadAsset])

  const retry = useCallback(async () => {
    await generate()
  }, [generate])

  const generateAgain = useCallback(async () => {
    await generate()
  }, [generate])

  // ── Result actions ─────────────────────────────────────────────────────────

  const editInImageStudio = useCallback(() => {
    if (!lastResultRef.current || !lastProjectRef.current || lastResultRef.current.type !== 'image') return
    const result = lastResultRef.current
    const project = lastProjectRef.current
    const prompt = result.prompt || project.personalizedPrompt || project.source.originalPrompt || ''

    writeHandoff({
      version: 1,
      target: 'image',
      from: 'storyboard',
      projectName: project.source.title || 'Personalized Image',
      aspectRatio: (project.source.aspectRatio as '16:9' | '9:16' | '1:1' | null) || '1:1',
      episodeDuration: 0,
      videoUrl: null,
      referenceImageUrl: result.url || project.source.sourceMedia || null,
      characterNames: project.assets.identities.map((i) => i.name).filter(Boolean),
      shots: prompt
        ? [{ scene: project.source.title || 'Personalized', prompt, duration: 0, characterNames: [] }]
        : [],
      combinedPrompt: prompt,
      firstFrameUrl: result.url || project.source.sourceMedia || null,
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
    deleteClient: deleteClientRecord,
    updateClientForm,

    // Assets
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
