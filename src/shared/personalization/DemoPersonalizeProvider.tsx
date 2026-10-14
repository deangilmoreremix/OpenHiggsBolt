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
  useMemo,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import PersonalizationModal from './PersonalizationModal'
import { readHandoff, writeHandoff } from '@/shared/crossStudio'
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
  BusinessResearchResult,
  PersonalizationAccessMode,
  GuidedStep,
  PersonalizationViewMode,
  PersonalizationPreviewSettings,
  PreviewLayer,
  PreviewVideoRef,
  PreviewLayoutId,
  PreviewBrandColors,
  PreviewAspectRatio,
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
  updateAssetInClientLibrary,
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
import type { BusinessDiscoveryRecord } from './types'
import { uploadPersonalizationAsset } from './assetUploadService'
import { cancelActiveExport } from './webExport'
import { persistEditedPersonalizationAsset } from './editedAssetPersistence'

import { normalizeUrl, TRACKING_PARAMS } from './urlNormalizer'
import { createProjectPersistence, loadProject, type LoadProjectResult, type PersonalizationProjectState } from './supabaseProjectPersistence'
import { buildPreviewInput } from './guided/buildPreviewInput'
import { chooseFinalOutputPath } from './finalOutput'
import {
  createDefaultPreviewSettings,
  applyLayoutPreset,
  resetLayoutToDefaults,
  normalizePreviewSettings,
  getCompositionDimensions,
} from './preview/presets'

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

const MAX_REFERENCE_UPLOADS = 10

// ── Guided Simple Mode + free preview helpers ────────────────────────────────
//
// The preview is a free, local Remotion composition: it never calls MuAPI or
// OpenAI. Everything below only derives/clamps settings and reads/writes the
// browser mirror used when Supabase has no saved state.

function clampPreviewNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return Math.min(max, Math.max(min, n))
}

function clampPreviewFrame(value: unknown, fallback: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback
  return Math.max(0, n)
}

/** Keeps layer geometry/opacity/timing inside the ranges the renderer supports. */
function clampPreviewLayer(layer: PreviewLayer): PreviewLayer {
  return {
    ...layer,
    x: clampPreviewNumber(layer.x, 0, 1, 0),
    y: clampPreviewNumber(layer.y, 0, 1, 0),
    scale: clampPreviewNumber(layer.scale, 0.02, 2, 1),
    opacity: clampPreviewNumber(layer.opacity, 0, 1, 1),
    animationDelay: clampPreviewFrame(layer.animationDelay, 0),
    startFrame: clampPreviewFrame(layer.startFrame, 0),
    endFrame:
      typeof layer.endFrame === 'number' && Number.isFinite(layer.endFrame)
        ? clampPreviewFrame(layer.endFrame, clampPreviewFrame(layer.startFrame, 0))
        : undefined,
  }
}

/** The demo's own aspect ratio when it is one the preview can render. */
function sourceAspectRatio(source: PersonalizationSource): PreviewAspectRatio {
  const ratio = source.aspectRatio
  return ratio === '9:16' || ratio === '1:1' || ratio === '4:5' ? ratio : '16:9'
}

/** Default preview composition seeded from a freshly opened source. */
function sourcePreviewDefaults(source: PersonalizationSource): PersonalizationPreviewSettings {
  const aspectRatio = sourceAspectRatio(source)
  const { width, height } = getCompositionDimensions(aspectRatio)
  const seconds =
    typeof source.duration === 'number' && Number.isFinite(source.duration) && source.duration > 0
      ? source.duration
      : 5
  const fps = createDefaultPreviewSettings().fps
  return createDefaultPreviewSettings({
    aspectRatio,
    width,
    height,
    durationInFrames: Math.max(1, Math.round(fps * seconds)),
  })
}

interface PersistedPreviewState {
  previewSettings?: unknown
  previewVideo?: unknown
  guidedStep?: unknown
  viewMode?: unknown
}

const PREVIEW_STORAGE_PREFIX = 'smartvideo_preview_state_'

function previewStorageKey(sourceId: string): string {
  return `${PREVIEW_STORAGE_PREFIX}${sourceId}`
}

/** Defensive localStorage read — never throws and never returns garbage. */
function readPreviewStorage(sourceId: string): PersistedPreviewState | null {
  if (typeof window === 'undefined' || !sourceId) return null
  try {
    const raw = localStorage.getItem(previewStorageKey(sourceId))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    return parsed as PersistedPreviewState
  } catch {
    return null
  }
}

/** Defensive localStorage write — best-effort, never throws. */
function writePreviewStorage(sourceId: string, state: PersistedPreviewState): void {
  if (typeof window === 'undefined' || !sourceId) return
  try {
    localStorage.setItem(previewStorageKey(sourceId), JSON.stringify(state))
  } catch {
    /* best-effort; do not throw */
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getGenerationAssetUrl(asset: PersonalizationAsset | null | undefined): string | undefined {
  if (!asset) return undefined
  if (asset.uploadStatus !== 'ready') return undefined
  const url = asset.uploadedUrl || asset.url
  if (!url || typeof url !== 'string' || url.startsWith('blob:')) return undefined
  return url
}
function revokeAssetUrl(asset: PersonalizationAsset | null | undefined) {
  if (!asset) return
  const url = asset.url
  const uploaded = asset.uploadedUrl

  if (url && typeof url === 'string' && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
  if (uploaded && typeof uploaded === 'string' && uploaded.startsWith('blob:') && uploaded !== url) {
    URL.revokeObjectURL(uploaded)
  }
}

/**
 * Revoke a blob URL that was created locally for a file that has just been
 * uploaded, where `replacementUrl` is the durable URL that took its place.
 *
 * Only `blob:` URLs are ever revoked (never CDN/uploaded URLs) and only when
 * the blob is no longer the URL in use, which keeps double-revokes out.
 */
function revokeLocalBlobUrl(localUrl: string | null | undefined, replacementUrl?: string | null) {
  if (!localUrl || !localUrl.startsWith('blob:')) return
  if (replacementUrl && replacementUrl === localUrl) return
  URL.revokeObjectURL(localUrl)
}

// ── Context ──────────────────────────────────────────────────────────────────

type OpenPersonalizeOptions = {
  source: unknown
  trigger?: HTMLElement | null
  /**
   * Which backend the modal may call. Chosen by the caller that opens the
   * modal (the landing page asks for 'anonymous'), never inferred by the modal
   * and always re-checked server-side. Defaults to 'authenticated' so every
   * existing entry point keeps the full pipeline unchanged.
   */
  access?: PersonalizationAccessMode
}

export type DemoPersonalizeContextValue = {
  // Modal
  isOpen: boolean
  source: PersonalizationSource | null
  sourceTypeLabel?: string
  openPersonalize: (opts: OpenPersonalizeOptions) => void
  closePersonalize: () => void

  // Access mode (which discovery endpoint this session may call)
  access: PersonalizationAccessMode

  // Automated "Find My Brand" workflow: one call that populates the client
  // form (through the existing selectBusiness mapping), runs the shared
  // research path and then asset discovery for one website URL. `options.business`
  // is the OpenStreetMap record when the visitor picked a search result; without
  // it a minimal record is derived from the URL itself.
  runDiscoveryWorkflow: (
    websiteUrl: string,
    options?: { business?: BusinessDiscoveryRecord },
  ) => Promise<void>

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
  applyEditedSavedClientAsset: (
    clientId: string,
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
  revertDiscoveredAssetEdit: (id: string) => void
  selectRecommendedDiscoveredAssets: () => void
  importDiscoveredAssets: () => Promise<void>
  cancelDiscovery: () => void
  discoverAssets: (websiteUrl: string) => Promise<void>
  visionStatus: 'idle' | 'analyzing' | 'complete' | 'error'
  visionError: string | null
  analyzeDiscoveredAssets: () => Promise<void>

  // Library asset actions
  moveLibraryAssetToSection: (assetId: string, section: AssignedSection) => void
  removeLibraryAssetFromSection: (assetId: string) => void
  deleteLibraryAsset: (assetId: string) => void
  revertLibraryAssetToOriginal: (assetId: string) => void

  // Business search
  businessSearchMode: 'idle' | 'searching' | 'results' | 'selected' | 'error'
  businessSearchResults: BusinessDiscoveryRecord[]
  businessSearchError: string | null
  businessSearchQuery: { niche: string; location: string; radiusMiles: number } | null
  selectedBusiness: BusinessDiscoveryRecord | null
  businessResearch: {
    status: 'idle' | 'researching' | 'done' | 'error'
    result?: BusinessResearchResult
    error?: string
  }
  findBusinesses: (niche: string, location: string, radiusMiles: number) => Promise<void>
  selectBusiness: (business: BusinessDiscoveryRecord) => void
  researchBusiness: (retryUrl?: string) => Promise<void>
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
  openImageEditor?: (asset: {
    id: string
    name: string
    imageUrl: string
    originalImageUrl: string
    category: string | undefined
    role: string
    source: string
    businessName?: string
    industry?: string
    productService?: string
    brandDescription?: string
    referenceImages: string[]
    visionAnalysis?: any
  }, operation: string) => void
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

  // Project restore (Phase 14)
  loadedProject: {
    id: string
    sourceDemoId: string
    personalizedPrompt: string
    clientId: string | null
    status: string
    updatedAt: string
  } | null
  restoring: boolean

  // Guided Simple Mode + free Remotion preview
  viewMode: PersonalizationViewMode
  setViewMode: (mode: PersonalizationViewMode) => void
  guidedStep: GuidedStep
  setGuidedStep: (step: GuidedStep) => void
  previewSettings: PersonalizationPreviewSettings
  previewVideo: PreviewVideoRef | null
  setPreviewVideo: (video: PreviewVideoRef | null) => void
  setPreviewLayout: (layout: PreviewLayoutId) => void
  updatePreviewLayer: (layerId: string, patch: Partial<PreviewLayer>) => void
  updatePreviewBrandColors: (patch: Partial<PreviewBrandColors>) => void
   updatePreviewComposition: (patch: Partial<Pick<PersonalizationPreviewSettings, 'aspectRatio' | 'fps' | 'durationInFrames' | 'showEndCard'>>) => void
   resetPreviewLayout: () => void
   previewApproved: boolean
   approvePersonalization: () => void
   createFinalVideo: () => Promise<void>
   cancelExport: () => void
   apiKey: string
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
  /**
   * Access mode for this mount. The public landing surface mounts the provider
   * with `access="anonymous"` (free discovery only); every existing entry point
   * omits it and keeps the full authenticated pipeline. The server remains the
   * authority on every request — this only selects which endpoint the client
   * calls and which UI the modal offers.
   */
  access?: PersonalizationAccessMode
}

/**
 * The `?demo=1` landing-page flag: lets a public entry point open the shared
 * modal in anonymous mode by URL alone, without prop wiring. It selects the
 * client-side endpoint/UI only; each endpoint still enforces its own rules.
 */
function detectAnonymousAccessFlag(): PersonalizationAccessMode | null {
  if (typeof window === 'undefined') return null
  try {
    return new URLSearchParams(window.location.search).get('demo') === '1' ? 'anonymous' : null
  } catch {
    return null
  }
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
    return new Blob([''], { type: 'application/octet-stream' })
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

// ── Business → client form mapping (the ONLY one) ────────────────────────────
//
// `selectBusiness()` is the existing mapping used by the lead-finder result
// cards. The automated "Find My Brand" workflow must populate exactly the same
// fields with exactly the same values, so the mapping lives here once and both
// paths call it — there is no second implementation to drift.

/** Maps a business record onto the client profile fields, as `selectBusiness` does. */
export function clientFormFromBusiness(business: BusinessDiscoveryRecord): Partial<ClientProfile> {
  return {
    businessName: business.name,
    industry: business.category,
    location: [business.city, business.region].filter(Boolean).join(', ') || undefined,
    phone: business.phone,
    website: business.website,
  }
}

/** Hostname without `www.`, used to name a business before research resolves a title. */
function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** Adds a scheme when the visitor pasted a bare `example.com`. */
export function normalizeWebsiteInput(value: string): string {
  const trimmed = (value || '').trim()
  if (!trimmed) return ''
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

// ── Free (anonymous) discovery payload mapping ───────────────────────────────
//
// Structural subset of `POST /api/demo/discover`. Declared here instead of
// importing the server module so the client bundle never pulls the discovery
// pipeline (axios/cheerio/networkSafety) in, and so every field is validated
// the same defensive way the endpoint's own consumer expects.

interface DemoDiscoveryAssetPayload {
  kind?: unknown
  url?: unknown
  source?: unknown
}

interface DemoDiscoveryResponse {
  ok?: unknown
  cached?: unknown
  url?: unknown
  title?: unknown
  description?: unknown
  logo?: unknown
  assets?: unknown
}

/**
 * `/api/demo/discover` asset kind → the shared `DiscoveredAssetCategory`.
 *
 * The free pipeline has no vision model, so the section an asset is OFFERED in
 * comes from the pipeline's own signal:
 *   logo   → Logo (the page's declared brand mark)
 *   product→ Products (a JSON-LD/og product shot)
 *   photo  → Person (the page's own photos are the only free signal for a
 *            presenter/person shot; the visitor reviews and can re-categorise
 *            or move it, exactly like a paid discovery result)
 *   brand  → Brand (card/microdata brand imagery)
 */
const DEMO_ASSET_KIND_TO_CATEGORY: Record<string, DiscoveredAssetCategory> = {
  logo: 'logo',
  product: 'product',
  photo: 'person',
  brand: 'brand',
}

/** The client-asset section each demo kind is offered in. */
const DEMO_ASSET_KIND_TO_SECTION: Record<string, AssignedSection> = {
  logo: 'logo',
  product: 'products',
  photo: 'person',
  brand: 'brand',
}

function demoAssetId(index: number): string {
  return `demo_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Maps the free discovery payload onto the SAME `DiscoveredAsset` list the paid
 * pipeline produces, so the shared review UI, section assignment, re-category
 * and drag-and-drop behave identically in both modes.
 */
export function demoAssetsToDiscoveredAssets(payload: DemoDiscoveryResponse): DiscoveredAsset[] {
  const rawAssets = Array.isArray(payload.assets) ? payload.assets : []
  const mapped: DiscoveredAsset[] = []

  for (let index = 0; index < rawAssets.length; index += 1) {
    const raw = rawAssets[index] as DemoDiscoveryAssetPayload | null
    if (!raw || typeof raw !== 'object') continue
    const url = typeof raw.url === 'string' ? raw.url.trim() : ''
    if (!url) continue
    const kind = typeof raw.kind === 'string' ? raw.kind : ''
    const category = DEMO_ASSET_KIND_TO_CATEGORY[kind]
    if (!category) continue
    mapped.push({
      id: demoAssetId(index),
      sourceUrl: url,
      previewUrl: url,
      sourceType: 'WEBSITE',
      category,
      selected: true,
      recommended: true,
      rejected: false,
      assignedSection: DEMO_ASSET_KIND_TO_SECTION[kind] ?? null,
      autoAssigned: true,
    })
  }

  return mapped
}

/**
 * URL-only entry: the smallest business record the shared `selectBusiness`
 * mapping accepts. The hostname names the business until research resolves a
 * page title; every other field stays undefined rather than guessing.
 */
function businessRecordFromWebsite(website: string): BusinessDiscoveryRecord {
  return {
    id: `url:${website}`,
    source: 'OPENSTREETMAP',
    name: hostnameOf(website),
    category: '',
    website,
    websiteStatus: 'unknown',
    verificationStatus: 'verified',
  }
}

/**
 * Reuses the existing `BusinessResearchResult` shape (rendered by the Selected
 * Business Summary panel) so a free discovery result is displayed by the very
 * same research UI instead of a second results surface.
 */
function businessResearchFromDemoPayload(payload: DemoDiscoveryResponse): BusinessResearchResult {
  const website = typeof payload.url === 'string' && payload.url.trim() ? payload.url.trim() : ''
  const logo = typeof payload.logo === 'string' && payload.logo.trim() ? payload.logo.trim() : ''
  const assets = Array.isArray(payload.assets) ? payload.assets : []
  return {
    canonicalUrl: website,
    finalUrl: website,
    reachable: assets.length > 0 || Boolean(logo),
    title: typeof payload.title === 'string' && payload.title.trim() ? payload.title.trim() : undefined,
    description: typeof payload.description === 'string' && payload.description.trim() ? payload.description.trim() : undefined,
    logoUrl: logo || undefined,
    socialLinks: {},
    jsonLd: [],
    openGraph: {},
    twitterCard: {},
    contactInfo: { phones: [], emails: [], addresses: [] },
  }
}

/** Turns a shared research result into the business-record shape the mapping consumes. */
// ── Provider ─────────────────────────────────────────────────────────────────

export function DemoPersonalizeProvider({ children, testMode, access: accessProp }: DemoPersonalizeProviderProps) {
  // Navigation & publish integration
  const router = useRouter()
  const socialPublish = useOptionalSocialPublish()
  const { apiKey } = useAuthConfig()
  // Modal
  const [isOpen, setIsOpen] = useState(false)
  const [source, setSource] = useState<PersonalizationSource | null>(null)
  const [sourceTypeLabel, setSourceTypeLabel] = useState<string | undefined>(undefined)
  // Which discovery backend this session may call. Seeded from the mount prop
  // (or the ?demo=1 landing flag) and re-set by the caller of openPersonalize;
  // never inferred here and never used to grant permission on its own (every
  // endpoint enforces its own rules, and the 401 path below is unchanged).
  const [access, setAccess] = useState<PersonalizationAccessMode>(
    () => accessProp || detectAnonymousAccessFlag() || 'authenticated',
  )
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
    result?: BusinessResearchResult
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

  // Project restore (Phase 14)
  const [loadedProject, setLoadedProject] = useState<{
    id: string
    sourceDemoId: string
    personalizedPrompt: string
    clientId: string | null
    status: string
    updatedAt: string
  } | null>(null)
  const [restoring, setRestoring] = useState(false)

  // Guided Simple Mode + free Remotion preview
  const [viewMode, setViewMode] = useState<PersonalizationViewMode>('simple')
  const [guidedStep, setGuidedStepState] = useState<GuidedStep>(1)
  const [previewSettings, setPreviewSettings] = useState<PersonalizationPreviewSettings>(() =>
    createDefaultPreviewSettings(),
  )
  const [previewVideo, setPreviewVideo] = useState<PreviewVideoRef | null>(null)
  const [previewApproved, setPreviewApproved] = useState(false)
  // Set when the preview hands off to the existing generate() path after the
  // source has been patched with the selected preview video.
  const pendingFinalGenerateRef = useRef(false)

  // Refs for studio handoff persistence
  const lastResultRef = useRef<GenerationResult | null>(null)
  const lastProjectRef = useRef<{
    source: PersonalizationSource
    client: Partial<ClientProfile>
    assets: AssetLibrary
    mode: VideoPersonalizationMode | ImagePersonalizationMode | null
    personalizedPrompt?: string
  } | null>(null)

  // Debounced Supabase project persistence
  const projectPersistence = useRef(createProjectPersistence({ debounceMs: 1500 }))

  // ── Derived ────────────────────────────────────────────────────────────────

  const _currentClient = clients.find((c) => c.id === selectedClientId) || null

  // Seed context for the free preview layout presets: the client form and asset
  // library the visitor already filled in, so the preview matches the run
  // without any extra network call. URLs stay `undefined` (not null) so the
  // context stays assignable to the layout-preset context.
  const previewSeed = useMemo(() => ({
    businessName: clientForm.businessName || clientForm.name || '',
    headline: clientForm.businessName ? `${clientForm.businessName}` : '',
    tagline: clientForm.brandDescription || '',
    offer: clientForm.offer || '',
    cta: clientForm.callToAction || (clientForm.website ? `Visit ${clientForm.website}` : ''),
    phone: clientForm.phone || '',
    website: clientForm.website || '',
    logoUrl: assets.primaryLogo?.uploadedUrl || assets.primaryLogo?.url || undefined,
    productUrl: assets.products[0]?.uploadedUrl || assets.products[0]?.url || undefined,
    serviceUrl:
      assets.products[1]?.uploadedUrl ||
      assets.products[1]?.url ||
      assets.products[0]?.uploadedUrl ||
      assets.products[0]?.url ||
      undefined,
  }), [
    clientForm.businessName,
    clientForm.name,
    clientForm.brandDescription,
    clientForm.offer,
    clientForm.callToAction,
    clientForm.phone,
    clientForm.website,
    assets.primaryLogo,
    assets.products,
  ])

  // Ref mirror so preview actions always see the freshest seed without
  // re-creating the callbacks on every form keystroke.
  const previewSeedRef = useRef(previewSeed)
  useEffect(() => {
    previewSeedRef.current = previewSeed
  }, [previewSeed])

  // ── Reset on source change ─────────────────────────────────────────────────

  // Tracks the id the reset last ran for. `createFinalVideo` patches the
  // source object in place (same id, new media) to hand the selected video to
  // the generation workflow — that is NOT a source change and must not wipe the
  // in-progress project, so the reset only runs when the id actually changes.
  const resetSourceIdRef = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    if (!source) return
    const nextId = source.id ?? null
    if (resetSourceIdRef.current === nextId) return
    resetSourceIdRef.current = nextId
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
    // Guided Simple Mode + preview reset happens here, BEFORE the restore
    // effect (below) hydrates anything durable, so a saved project always wins.
    // The view mode is intentionally NOT reset: an explicit Advanced Editing
    // choice is a session preference and survives opening another source.
    setGuidedStepState(1)
    setPreviewSettings(sourcePreviewDefaults(source))
    setPreviewVideo(null)
    setPreviewApproved(false)
  }, [source?.id, source])

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
    saveClientAssets(selectedClientId, library)
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

  // Single builder for the persisted project payload, shared by both debounced
  // persist effects below and by the immediate flush on approval so they can
  // never drift. The payload is purely additive over the previous fields.
  const buildProjectPayload = useCallback((): PersonalizationProjectState => ({
    originStudio: 'demo-personalization',
    sourceType: source!.sourceType,
    sourceDemoId: source!.id,
    sourceDemoSlug: (source as { slug?: string }).slug ?? null,
    sourceMedia: source!.sourceMedia,
    sourceUrl: source!.sourceUrl ?? null,
    personalizationMode: mode || null,
    model: source!.model || genOptions.model || null,
    originalPrompt: promptState.original,
    personalizedPrompt: promptState.personalized || promptState.edited,
    identityAssetIds: assets.identities.map((i) => i.id),
    logoAssetIds: assets.logos.map((l) => l.id),
    productAssetIds: assets.products.map((p) => p.id),
    brandReferenceAssetIds: assets.brandReferences.map((b) => b.id),
    firstFrameAssetId: assets.firstFrame?.id || null,
    lastFrameAssetId: assets.lastFrame?.id || null,
    outputUrls: result?.urls || (result?.url ? [result.url] : []),
    outputType,
    clientId: selectedClientId || null,
    status: generation.status === 'complete' ? 'complete' : 'draft',
    ctaHeadline: clientForm.ctaHeadline || null,
    callToAction: clientForm.callToAction || null,
    generationSettings: {
      engine: genOptions.engine,
      preserveAudio: genOptions.preserveAudio,
      exactLogoHandling: genOptions.exactLogoHandling,
      exactCtaHandling: genOptions.exactCtaHandling,
      firstFrameMode: genOptions.firstFrameMode,
      lastFrameMode: genOptions.lastFrameMode,
      advancedModel: genOptions.advancedModel || null,
      aspectRatio: genOptions.aspectRatio || null,
      duration: genOptions.duration || null,
      resolution: genOptions.resolution || null,
      quality: genOptions.quality || null,
      consentGiven: genOptions.consentGiven,
    },
    aiAssistState: {},
    previewSettings,
    previewVideo: previewVideo && previewVideo.url && !previewVideo.url.startsWith('blob:') ? previewVideo : null,
    guidedStep,
    viewMode,
  }), [
    source,
    mode,
    promptState.original,
    promptState.personalized,
    promptState.edited,
    assets,
    outputType,
    selectedClientId,
    generation.status,
    result?.url,
    result?.urls,
    clientForm.ctaHeadline,
    clientForm.callToAction,
    genOptions,
    previewSettings,
    previewVideo,
    guidedStep,
    viewMode,
  ])

  // Debounced Supabase project persistence
  useEffect(() => {
    // Anonymous sessions persist nothing: the free discovery run writes no
    // project row, no identity and no saved asset.
    if (!source || access !== 'authenticated') return
    projectPersistence.current.persist(buildProjectPayload())
  }, [
    source?.id,
    source,
    mode,
    promptState.original,
    promptState.personalized,
    promptState.edited,
    assets,
    outputType,
    selectedClientId,
    generation.status,
    result?.url,
    result?.urls,
    clientForm.ctaHeadline,
    clientForm.callToAction,
    genOptions,
    previewSettings,
    previewVideo,
    guidedStep,
    viewMode,
    access,
    buildProjectPayload,
  ])

  // Debounced Supabase project persistence
  useEffect(() => {
    // Anonymous sessions persist nothing: the free discovery run writes no
    // project row, no identity and no saved asset.
    if (!source || access !== 'authenticated') return
    projectPersistence.current.persist(buildProjectPayload())
  }, [
    source?.id,
    source,
    mode,
    promptState.original,
    promptState.personalized,
    promptState.edited,
    assets,
    outputType,
    selectedClientId,
    generation.status,
    result?.url,
    result?.urls,
    clientForm.ctaHeadline,
    clientForm.callToAction,
    genOptions,
    previewSettings,
    previewVideo,
    guidedStep,
    viewMode,
    access,
    buildProjectPayload,
  ])

  // Local mirror of the guided/preview state, so save/restore works in the
  // browser even when Supabase has no row for this source (same rule as the
  // project persistence above: anonymous sessions write nothing).
  useEffect(() => {
    if (!source?.id || access !== 'authenticated') return
    const timer = setTimeout(() => {
      writePreviewStorage(source.id, {
        previewSettings,
        previewVideo: previewVideo && previewVideo.url && !previewVideo.url.startsWith('blob:') ? previewVideo : null,
        guidedStep,
        viewMode,
      })
    }, 800)
    return () => clearTimeout(timer)
  }, [previewSettings, previewVideo, guidedStep, viewMode, source?.id, access])

  // Cancel pending project persistence on unmount
  useEffect(() => {
    return () => {
      projectPersistence.current.cancel()
    }
  }, [])

  // ── Project restore (Phase 14) ──────────────────────────────────────────────
  // When the modal opens with a source, attempt to load the most-recently-saved
  // project for that source from Supabase.  The debounced-persist effect above
  // will write state changes back; localStorage is left as a fast local cache
  // but Supabase is the durable source of truth.

  const restoreProject = useCallback(async (src: PersonalizationSource): Promise<void> => {
    if (!src?.id) return
    projectPersistence.current.cancel() // don't race with an in-flight save

    let result: LoadProjectResult
    try {
      result = await loadProject({ sourceId: src.id })
    } catch {
      return
    }

    if (!result.ok || !result.data) return

    const entry = result.data

    const savedClient = entry.clientId
      ? clients.find((c) => c.id === entry.clientId) ?? loadClients().find((c) => c.id === entry.clientId)
      : null

    const clientFormPatch: Partial<ClientProfile> = { ...(savedClient ?? {}) }
    if (entry.ctaHeadline) clientFormPatch.ctaHeadline = entry.ctaHeadline
    if (entry.callToAction) clientFormPatch.callToAction = entry.callToAction
    setClientForm(clientFormPatch)

    if (savedClient) {
      setSelectedClientId(savedClient.id)
      setCurrentClientId(savedClient.id)
    }

    // ── Restore assets ───────────────────────────────────────────────────────
    const assetEntries: { id: string; url: string; role: PersonalizationAsset['role']; isPrimary: boolean }[] = []

    entry.identityAssetIds.forEach((id, idx) => {
      assetEntries.push({ id, url: id, role: 'presenter_identity', isPrimary: idx === 0 })
    })
    entry.logoAssetIds.forEach((id, idx) => {
      assetEntries.push({ id, url: id, role: 'logo', isPrimary: idx === 0 })
    })
    entry.productAssetIds.forEach((id) => {
      assetEntries.push({ id, url: id, role: 'product_reference', isPrimary: false })
    })
    entry.brandReferenceAssetIds.forEach((id) => {
      assetEntries.push({ id, url: id, role: 'brand_reference', isPrimary: false })
    })
    if (entry.firstFrameAssetId) {
      assetEntries.push({ id: entry.firstFrameAssetId, url: entry.firstFrameAssetId, role: 'first_frame', isPrimary: true })
    }
    if (entry.lastFrameAssetId) {
      assetEntries.push({ id: entry.lastFrameAssetId, url: entry.lastFrameAssetId, role: 'last_frame', isPrimary: true })
    }

    // Build the AssetLibrary in one shot to avoid intermediate empty states
    const restoredLibrary = assetEntries.reduce<AssetLibrary>((lib, a) => {
      const asset: PersonalizationAsset = {
        id: a.id,
        role: a.role,
        name: a.url.split('/').pop() || a.id,
        url: a.url,
        uploadedUrl: a.url,
        isPrimary: a.isPrimary,
        mimeType: '',
        createdAt: new Date().toISOString(),
        uploadStatus: 'ready',
        uploadError: null,
        file: null,
      }
      return updateAssetInLibrary(lib, asset)
    }, { ...EMPTY_ASSET_LIBRARY })

    setAssets(restoredLibrary)

    // ── Restore prompt ───────────────────────────────────────────────────────
    setPromptState({
      original: entry.originalPrompt || src.originalPrompt || src.fullPrompt || '',
      personalized: entry.personalizedPrompt || '',
      edited: entry.personalizedPrompt || '',
    })

    // ── Restore generation settings ──────────────────────────────────────────
    if (entry.generationSettings && typeof entry.generationSettings === 'object') {
      const gs = entry.generationSettings as Record<string, unknown>
      setGenOptions((prev) => ({
        ...prev,
        engine: typeof gs.engine === 'string' ? gs.engine : prev.engine,
        preserveAudio: gs.preserveAudio !== false,
        exactLogoHandling: (typeof gs.exactLogoHandling === 'string' ? gs.exactLogoHandling : prev.exactLogoHandling) as GenerationOptions['exactLogoHandling'],
        exactCtaHandling: (typeof gs.exactCtaHandling === 'string' ? gs.exactCtaHandling : prev.exactCtaHandling) as GenerationOptions['exactCtaHandling'],
        firstFrameMode: (typeof gs.firstFrameMode === 'string' ? gs.firstFrameMode : prev.firstFrameMode) as GenerationOptions['firstFrameMode'],
        lastFrameMode: (typeof gs.lastFrameMode === 'string' ? gs.lastFrameMode : prev.lastFrameMode) as GenerationOptions['lastFrameMode'],
        advancedModel: typeof gs.advancedModel === 'string' ? gs.advancedModel : prev.advancedModel,
        aspectRatio: typeof gs.aspectRatio === 'string' ? gs.aspectRatio : prev.aspectRatio,
        duration: typeof gs.duration === 'number' ? gs.duration : prev.duration,
        resolution: typeof gs.resolution === 'string' ? gs.resolution : prev.resolution,
        quality: typeof gs.quality === 'string' ? gs.quality : prev.quality,
        consentGiven: gs.consentGiven === true,
      }))
    }

    // ── Restore guided Simple Mode + free preview ────────────────────────────
    // Supabase wins; the localStorage mirror is only consulted when the saved
    // project predates the preview (or has no preview state of its own), so
    // older projects fall back to the defaults the reset effect seeded.
    const stored = readPreviewStorage(src.id)
    const storedSettings =
      entry.previewSettings !== undefined && entry.previewSettings !== null
        ? entry.previewSettings
        : stored?.previewSettings
    setPreviewSettings(
      storedSettings === undefined || storedSettings === null
        ? normalizePreviewSettings(undefined)
        : normalizePreviewSettings(storedSettings),
    )
    const storedVideo =
      entry.previewVideo !== undefined && entry.previewVideo !== null
        ? entry.previewVideo
        : stored?.previewVideo
    setPreviewVideo(
      storedVideo &&
      typeof storedVideo === 'object' &&
      typeof (storedVideo as PreviewVideoRef).url === 'string' &&
      !(storedVideo as PreviewVideoRef).url.startsWith('blob:')
        ? (storedVideo as PreviewVideoRef)
        : null,
    )
    const storedStep =
      typeof entry.guidedStep === 'number' ? entry.guidedStep : stored?.guidedStep
    setGuidedStepState(
      typeof storedStep === 'number' && storedStep >= 1 && storedStep <= 4
        ? (storedStep as GuidedStep)
        : 1,
    )
    const storedViewMode =
      entry.viewMode !== undefined && entry.viewMode !== null
        ? entry.viewMode
        : stored?.viewMode
    setViewMode(storedViewMode === 'advanced' ? 'advanced' : 'simple')
    setPreviewApproved(false)

    // ── Restore output type ──────────────────────────────────────────────────
    if (entry.outputType && ['prompt', 'image', 'video', 'everything'].includes(entry.outputType)) {
      setOutputType(entry.outputType as OutputType)
    }

    // ── Restore mode ─────────────────────────────────────────────────────────
    const validModes = src.mediaType === 'video'
      ? ['face_only', 'full_body', 'recreate', 'complete']
      : src.mediaType === 'image'
        ? ['keep_design', 'replace_face', 'replace_person', 'recreate', 'complete']
        : []
    if (entry.personalizationMode && validModes.includes(entry.personalizationMode)) {
      setMode(entry.personalizationMode as VideoPersonalizationMode | ImagePersonalizationMode)
    }

    // ── Restore CTA ──────────────────────────────────────────────────────────
    if (entry.ctaHeadline || entry.callToAction) {
      setClientForm((prev) => ({
        ...prev,
        ctaHeadline: entry.ctaHeadline ?? prev.ctaHeadline,
        callToAction: entry.callToAction ?? prev.callToAction,
      }))
    }

    // ── Restore result URLs (non-blob) ───────────────────────────────────────
    if (Array.isArray(entry.outputUrls) && entry.outputUrls.length > 0) {
      const durableUrls = entry.outputUrls.filter((u) => typeof u === 'string' && !u.startsWith('blob:'))
      if (durableUrls.length > 0) {
        setResult({
          type: entry.outputType as GenerationResult['type'],
          urls: durableUrls,
          prompt: entry.personalizedPrompt || undefined,
        })
      }
    }

    // Expose restore summary to the UI
    setLoadedProject({
      id: entry.id || '',
      sourceDemoId: entry.sourceDemoId || src.id,
      personalizedPrompt: entry.personalizedPrompt,
      clientId: entry.clientId ?? null,
      status: entry.status || 'draft',
      updatedAt: new Date().toISOString(),
    })
  }, [clients])

  // Hydrate state from Supabase whenever the modal opens with a source.
  // The reset-on-source-change effect (above) runs first, clearing state;
  // this effect then fills it back in from durable storage. Anonymous sessions
  // have no durable storage to hydrate from (and issue no authenticated
  // request), so the free run always starts from a clean slate.
  useEffect(() => {
    if (!source?.id || !isOpen || access !== 'authenticated') return
    let cancelled = false
    setRestoring(true)
    setLoadedProject(null)

    restoreProject(source).finally(() => {
      if (!cancelled) setRestoring(false)
    })

    return () => {
      cancelled = true
    }
  }, [source?.id, isOpen, restoreProject, access])

  // ── Modal actions ──────────────────────────────────────────────────────────

  const openPersonalize = useCallback((opts: OpenPersonalizeOptions) => {
    const normalized = normalizePersonalizationSource(opts.source)
    if (normalized) {
      const label =
        normalized.sourceType === 'go-ai-viral-prompt' || normalized.sourceType === 'go-ai-viral-video'
          ? 'SmartVideo GO AI'
          : undefined
      setSourceTypeLabel(label)
      setAccess(opts.access || accessProp || 'authenticated')
      // Set source BEFORE isOpen so the restore effect (which watches
      // source?.id && isOpen) runs in the same render cycle as the modal
      // appearing — and AFTER the reset-on-source-change effect clears state.
      setSource(normalized)
      setIsOpen(true)
      triggerRef.current = opts.trigger || null
    }
  }, [accessProp])

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
    setAccess(accessProp || 'authenticated')
    setResult(null)
    setGeneration({ ...EMPTY_GENERATION_STATE })
    triggerRef.current?.focus()
    triggerRef.current = null
  }, [accessProp])

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

  /**
   * Additive research merge.
   *
   * Research results fill ONLY empty client-form fields: a value the visitor
   * edited is never overwritten, and a missing research value never clobbers
   * an existing one. The canonical URL therefore no longer replaces a
   * hand-corrected website — the visitor's value always wins.
   */
  const mergeResearchIntoClientForm = useCallback((research: BusinessResearchResult) => {
    setClientForm((prev) => {
      const next: Partial<ClientProfile> = { ...prev }
      const fill = (key: keyof ClientProfile, value: unknown) => {
        if (typeof value !== 'string') return
        const trimmed = value.trim()
        if (!trimmed) return
        const current = next[key]
        if (typeof current === 'string' && current.trim()) return
        ;(next as Record<string, unknown>)[key] = trimmed
      }
      fill('website', research.canonicalUrl || research.finalUrl)
      fill('brandDescription', research.description)
      fill('phone', research.contactInfo?.phones?.[0])
      return next
    })
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
    setClients((prev) => prev.filter((c) => c.id !== id))
    setSelectedClientId((prev) => {
      if (prev === id) {
        deleteClientRecord(id)
        setCurrentClientId(null)
        setClientForm({})
        lastResultRef.current = null
        lastProjectRef.current = null
        return ''
      }
      return prev
    })
  }, [])

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
    if (!apiKey) throw new Error('Missing API key')

    // Capture the local blob URL from the asset object this upload was started
    // with. Revoking it must never depend on a ref mirror of the asset library:
    // such a mirror is only synced inside an effect, so when an upload resolves
    // in the same tick the asset was added, the mirror still points at the
    // previous library, the by-id lookup finds nothing, revocation silently
    // no-ops and the blob URL leaks for good once `url` is overwritten with the
    // durable URL below. The asset object itself is never mutated, so the URL
    // captured here is always the pre-upload one.
    const localBlobUrl = asset.url && asset.url.startsWith('blob:') ? asset.url : null

    // Test-only bypass: avoid real network uploads in test mode with the placeholder key.
    if (
      process.env.NODE_ENV !== 'production' &&
      apiKey === 'test-mode-key' &&
      testMode
    ) {
      const fakeUrl = 'https://example.com/test-uploaded-asset.png'
      setAssetUploadStatus(asset.id, 'ready', null)
      setAssets((prev) => {
        const updater = (list: PersonalizationAsset[]) => list.map((a) => (a.id === asset.id ? { ...a, url: fakeUrl, uploadedUrl: fakeUrl } : a))
        return {
          ...prev,
          identities: updater(prev.identities),
          logos: updater(prev.logos),
          products: updater(prev.products),
          brandReferences: updater(prev.brandReferences),
          firstFrame: prev.firstFrame?.id === asset.id ? { ...prev.firstFrame, url: fakeUrl, uploadedUrl: fakeUrl } : prev.firstFrame,
          lastFrame: prev.lastFrame?.id === asset.id ? { ...prev.lastFrame, url: fakeUrl, uploadedUrl: fakeUrl } : prev.lastFrame,
          ctaGraphic: prev.ctaGraphic?.id === asset.id ? { ...prev.ctaGraphic, url: fakeUrl, uploadedUrl: fakeUrl } : prev.ctaGraphic,
        }
      })
      revokeLocalBlobUrl(localBlobUrl, fakeUrl)
      return fakeUrl
    }

    if (!asset.file) throw new Error('Missing file for upload')

    setAssetUploadStatus(asset.id, 'uploading')
    try {
      const { url } = await uploadPersonalizationAsset(apiKey, {
        file: asset.file as File,
      })
      setAssetUploadStatus(asset.id, 'ready', null)
      // The local blob is being replaced by the durable CDN URL, so free it.
      setAssets((prev) => {
        const updater = (list: PersonalizationAsset[]) => list.map((a) => (a.id === asset.id ? { ...a, url, uploadedUrl: url } : a))
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
      revokeLocalBlobUrl(localBlobUrl, url)
      return url
    } catch (error) {
      // On failure the blob URL stays the asset's live `url` (the user sees a
      // preview plus a retry affordance), so it must NOT be revoked here — it
      // is still released by removeLogo()/removeProduct()/removeIdentity()/…
      // when the asset is dropped.
      const message = error instanceof Error ? error.message : 'Upload failed'
      setAssetUploadStatus(asset.id, 'error', message)
      throw error
    }
  }, [apiKey, setAssetUploadStatus, testMode])

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
    const currentJobAssets = [
      ...assets.identities,
      ...assets.logos,
      ...assets.products,
      ...assets.brandReferences,
      assets.firstFrame,
      assets.lastFrame,
      assets.ctaGraphic,
    ].filter(Boolean) as PersonalizationAsset[]

    const savedAssets = [
      ...savedClientAssets.identities,
      ...savedClientAssets.logos,
      ...savedClientAssets.products,
      ...savedClientAssets.brandReferences,
    ]

    const target = currentJobAssets.find((a) => a.id === assetId) || savedAssets.find((a) => a.id === assetId)
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
      uploadedUrl: target.uploadedUrl,
      file,
      mimeType: file.type,
      uploadStatus: 'local',
      uploadError: null,
      originalUrl,
      edited: true,
      editedDataUrl: dataUrl,
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

    let supabaseUrl: string | undefined
    try {
      const persistResult = await persistEditedPersonalizationAsset({
        assetId: editedAsset.id,
        dataUrl,
        blob,
        mimeType: file.type,
        width: editedAsset.width || 0,
        height: editedAsset.height || 0,
        originalAssetId: target.id,
        clientId: selectedClientId || undefined,
        category: target.sourceCategory,
        role: target.role,
        name: file.name,
        operation: meta.operation,
        prompt: meta.prompt,
        model: meta.model,
        quality: meta.quality,
        outputFormat: meta.outputFormat,
        outputCompression: meta.outputCompression,
        inputFidelity: meta.inputFidelity,
        responseId: meta.responseId,
        imageGenerationCallId: meta.imageGenerationCallId,
        revisedPrompt: meta.revisedPrompt,
        editMetadata: editedAsset.editMetadata,
        visionAnalysis: meta.visionAnalysis as Record<string, unknown> | undefined,
        visionValidation: meta.visionValidation as Record<string, unknown> | undefined,
        sourceCategory: target.sourceCategory,
        sourceType: target.sourceType,
        sourceDiscoveredAssetId: target.sourceDiscoveredAssetId,
        videoReady: meta.videoReady,
        transparent: meta.transparent,
      })

      if (persistResult.ok && persistResult.publicUrl) {
        supabaseUrl = persistResult.publicUrl
        setAssets((prev) => {
          const updater = (list: PersonalizationAsset[]) =>
            list.map((a) => (a.id === editedAsset.id ? { ...a, url: supabaseUrl!, uploadedUrl: supabaseUrl!, uploadStatus: 'ready' as const } : a))
          const old = [
            ...prev.identities,
            ...prev.logos,
            ...prev.products,
            ...prev.brandReferences,
            prev.firstFrame,
            prev.lastFrame,
            prev.ctaGraphic,
          ].find((a) => a?.id === editedAsset.id)
          if (old) revokeAssetUrl(old)
          return {
            ...prev,
            identities: updater(prev.identities),
            logos: updater(prev.logos),
            products: updater(prev.products),
            brandReferences: updater(prev.brandReferences),
            firstFrame: prev.firstFrame?.id === editedAsset.id ? { ...prev.firstFrame, url: supabaseUrl!, uploadedUrl: supabaseUrl!, uploadStatus: 'ready' as const } : prev.firstFrame,
            lastFrame: prev.lastFrame?.id === editedAsset.id ? { ...prev.lastFrame, url: supabaseUrl!, uploadedUrl: supabaseUrl!, uploadStatus: 'ready' as const } : prev.lastFrame,
            ctaGraphic: prev.ctaGraphic?.id === editedAsset.id ? { ...prev.ctaGraphic, url: supabaseUrl!, uploadedUrl: supabaseUrl!, uploadStatus: 'ready' as const } : prev.ctaGraphic,
          }
        })
      }
    } catch {
      // Supabase persistence failed — fall back to MuAPI upload below
    }

    if (!supabaseUrl) {
      await uploadAsset(editedAsset)
    }
  }, [assets, uploadAsset, selectedClientId])

  const applyEditedSavedClientAsset = useCallback(async (
    clientId: string,
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
    if (!clientId) throw new Error('A selected client is required to save a client asset edit')

    const library = loadClientAssets(clientId)
    const allSaved = [
      ...library.identities,
      ...library.logos,
      ...library.products,
      ...library.brandReferences,
    ]
    const savedTarget = allSaved.find((a) => a.id === assetId)
    if (!savedTarget) throw new Error('Saved client asset not found')

    const blob = dataUrlToBlob(dataUrl)
    if (!blob) throw new Error('Edited image could not be read')

    const extension = blob.type === 'image/webp' ? 'webp' : 'png'
    const baseName = (savedTarget.name || 'edited-image').replace(/\.[^.]+$/, '')
    const file = new File([blob], baseName + '-edited.' + extension, { type: blob.type || 'image/png' })
    const originalUrl = savedTarget.originalUrl || savedTarget.uploadedUrl || savedTarget.url

    const editedAsset: PersonalizationAsset = {
      ...savedTarget,
      name: file.name,
      url: URL.createObjectURL(file),
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
      visionAnalysis: meta.visionAnalysis || savedTarget.visionAnalysis,
      visionValidation: meta.visionValidation,
    }

    const updatedLibrary = updateAssetInClientLibrary(clientId, editedAsset)
    setSavedClientAssets(updatedLibrary)

    const currentJobTarget = [
      ...assets.identities,
      ...assets.logos,
      ...assets.products,
      ...assets.brandReferences,
      assets.firstFrame,
      assets.lastFrame,
      assets.ctaGraphic,
    ].filter((a): a is PersonalizationAsset => Boolean(a)).find((a) => a.id === assetId)

    if (currentJobTarget) {
      setAssets((prev) => replaceAssetInLibrary(prev, editedAsset))
    }

    let supabaseUrl: string | undefined
    try {
      const persistResult = await persistEditedPersonalizationAsset({
        assetId: editedAsset.id,
        dataUrl,
        blob,
        mimeType: file.type,
        width: editedAsset.width || 0,
        height: editedAsset.height || 0,
        originalAssetId: savedTarget.id,
        clientId,
        category: savedTarget.sourceCategory,
        role: savedTarget.role,
        name: file.name,
        operation: meta.operation,
        prompt: meta.prompt,
        model: meta.model,
        quality: meta.quality,
        outputFormat: meta.outputFormat,
        outputCompression: meta.outputCompression,
        inputFidelity: meta.inputFidelity,
        responseId: meta.responseId,
        imageGenerationCallId: meta.imageGenerationCallId,
        revisedPrompt: meta.revisedPrompt,
        editMetadata: editedAsset.editMetadata,
        visionAnalysis: meta.visionAnalysis as Record<string, unknown> | undefined,
        visionValidation: meta.visionValidation as Record<string, unknown> | undefined,
        sourceCategory: savedTarget.sourceCategory,
        sourceType: savedTarget.sourceType,
        sourceDiscoveredAssetId: savedTarget.sourceDiscoveredAssetId,
        videoReady: meta.videoReady,
        transparent: meta.transparent,
      })

      if (persistResult.ok && persistResult.publicUrl) {
        supabaseUrl = persistResult.publicUrl
        const finalSavedAsset: PersonalizationAsset = {
          ...editedAsset,
          url: supabaseUrl!,
          uploadedUrl: supabaseUrl,
          uploadStatus: 'ready',
        }
        updateAssetInClientLibrary(clientId, finalSavedAsset)
        setSavedClientAssets(updateAssetInClientLibrary(clientId, finalSavedAsset))

        if (currentJobTarget) {
          setAssets((prev) => {
            const updater = (list: PersonalizationAsset[]) =>
              list.map((a) => (a.id === editedAsset.id ? { ...a, url: supabaseUrl!, uploadedUrl: supabaseUrl!, uploadStatus: 'ready' as const } : a))
            return {
              ...prev,
              identities: updater(prev.identities),
              logos: updater(prev.logos),
              products: updater(prev.products),
              brandReferences: updater(prev.brandReferences),
              firstFrame: prev.firstFrame?.id === editedAsset.id ? { ...prev.firstFrame, url: supabaseUrl!, uploadedUrl: supabaseUrl!, uploadStatus: 'ready' as const } : prev.firstFrame,
              lastFrame: prev.lastFrame?.id === editedAsset.id ? { ...prev.lastFrame, url: supabaseUrl!, uploadedUrl: supabaseUrl!, uploadStatus: 'ready' as const } : prev.lastFrame,
              ctaGraphic: prev.ctaGraphic?.id === editedAsset.id ? { ...prev.ctaGraphic, url: supabaseUrl!, uploadedUrl: supabaseUrl!, uploadStatus: 'ready' as const } : prev.ctaGraphic,
            }
          })
        }
      }
    } catch {
      // Supabase persistence failed — fall back to MuAPI upload below
    }

    if (!supabaseUrl) {
      await uploadAsset(editedAsset)
    }
  }, [assets, uploadAsset])

  // ── Asset actions ──────────────────────────────────────────────────────────

  const addIdentityFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))
    if (imageFiles.length === 0) return

    const maxImages = source ? resolveModelCapabilities(source, genOptions).maxImages : 1
    const remaining = maxImages - assets.identities.length
    const filesToAdd = imageFiles.slice(0, Math.max(0, remaining))
    if (filesToAdd.length === 0) return

    const newAssets = filesToAdd.map((file) => createAsset(file, 'presenter_identity', {
      isPrimary: assets.identities.length === 0,
    }))
    newAssets.forEach((asset) => {
      setAssets((prev) => updateAssetInLibrary(prev, asset))
      uploadAsset(asset).catch((error) => { console.error('Upload failed:', error) })
    })
  }, [assets.identities.length, uploadAsset, source, genOptions])

  const addIdentityUrl = useCallback((url: string) => {
    const asset = createAssetFromUrl(url, 'presenter_identity', {
      isPrimary: assets.identities.length === 0,
    })
    setAssets((prev) => updateAssetInLibrary(prev, asset))
  }, [assets.identities.length])

  const removeIdentity = useCallback((id: string) => {
    const asset = assets.identities.find((a) => a.id === id) || assets.primaryIdentity
    if (asset) revokeAssetUrl(asset)
    setAssets((prev) => ({
      ...prev,
      identities: prev.identities.filter((a) => a.id !== id),
      primaryIdentity: prev.primaryIdentity?.id === id ? null : prev.primaryIdentity,
    }))
  }, [assets])

  const setPrimaryIdentity = useCallback((id: string) => {
    setAssets((prev) => ({
      ...prev,
      identities: prev.identities.map((a) => ({ ...a, isPrimary: a.id === id })),
      primaryIdentity: prev.identities.find((a) => a.id === id) || prev.primaryIdentity,
    }))
  }, [])

  const addLogoFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))
    if (imageFiles.length === 0) return

    const remaining = MAX_REFERENCE_UPLOADS - assets.logos.length
    const filesToAdd = imageFiles.slice(0, Math.max(0, remaining))
    if (filesToAdd.length === 0) return

    const newAssets = filesToAdd.map((file) => createAsset(file, 'logo', {
      isPrimary: assets.logos.length === 0,
    }))
    newAssets.forEach((asset) => {
      setAssets((prev) => updateAssetInLibrary(prev, asset))
      uploadAsset(asset).catch((error) => { console.error('Upload failed:', error) })
    })
  }, [assets.logos.length, uploadAsset])

  const addLogoUrl = useCallback((url: string) => {
    const asset = createAssetFromUrl(url, 'logo', {
      isPrimary: assets.logos.length === 0,
    })
    setAssets((prev) => updateAssetInLibrary(prev, asset))
  }, [assets.logos.length])

  const removeLogo = useCallback((id: string) => {
    const asset = assets.logos.find((a) => a.id === id) || assets.primaryLogo
    if (asset) revokeAssetUrl(asset)
    setAssets((prev) => {
      return {
        ...prev,
        logos: prev.logos.filter((a) => a.id !== id),
        primaryLogo: prev.primaryLogo?.id === id ? null : prev.primaryLogo,
      }
    })
  }, [assets])

  const setPrimaryLogo = useCallback((id: string) => {
    setAssets((prev) => ({
      ...prev,
      logos: prev.logos.map((a) => ({ ...a, isPrimary: a.id === id })),
      primaryLogo: prev.logos.find((a) => a.id === id) || prev.primaryLogo,
    }))
  }, [])

  const addProductFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const validFiles = Array.from(files).filter((file) => file.type.startsWith('image/') || file.type.startsWith('video/'))
    if (validFiles.length === 0) return

    const remaining = MAX_REFERENCE_UPLOADS - assets.products.length
    const filesToAdd = validFiles.slice(0, Math.max(0, remaining))
    if (filesToAdd.length === 0) return

    const newAssets = filesToAdd.map((file) => createAsset(file, 'product_reference'))
    newAssets.forEach((asset) => {
      setAssets((prev) => updateAssetInLibrary(prev, asset))
      uploadAsset(asset).catch((error) => { console.error('Upload failed:', error) })
    })
  }, [assets.products.length, uploadAsset])

  const addProductUrl = useCallback((url: string) => {
    const asset = createAssetFromUrl(url, 'product_reference')
    setAssets((prev) => updateAssetInLibrary(prev, asset))
  }, [])

  const removeProduct = useCallback((id: string) => {
    const asset = assets.products.find((a) => a.id === id)
    if (asset) revokeAssetUrl(asset)
    setAssets((prev) => ({
      ...prev,
      products: prev.products.filter((a) => a.id !== id),
    }))
  }, [assets])

  const addBrandReferenceFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const validFiles = Array.from(files).filter((file) => file.type.startsWith('image/') || file.type.startsWith('video/'))
    if (validFiles.length === 0) return

    const remaining = MAX_REFERENCE_UPLOADS - assets.brandReferences.length
    const filesToAdd = validFiles.slice(0, Math.max(0, remaining))
    if (filesToAdd.length === 0) return

    const newAssets = filesToAdd.map((file) => createAsset(file, 'brand_reference'))
    newAssets.forEach((asset) => {
      setAssets((prev) => updateAssetInLibrary(prev, asset))
      uploadAsset(asset).catch((error) => { console.error('Upload failed:', error) })
    })
  }, [assets.brandReferences.length, uploadAsset])

  const addBrandReferenceUrl = useCallback((url: string) => {
    const asset = createAssetFromUrl(url, 'brand_reference')
    setAssets((prev) => updateAssetInLibrary(prev, asset))
  }, [])

  const removeBrandReference = useCallback((id: string) => {
    const asset = assets.brandReferences.find((a) => a.id === id)
    if (asset) revokeAssetUrl(asset)
    setAssets((prev) => ({
      ...prev,
      brandReferences: prev.brandReferences.filter((a) => a.id !== id),
    }))
  }, [assets])

  const setFirstFrameFile = useCallback((file: File | null) => {
    if (!file) {
      setAssets((prev) => ({ ...prev, firstFrame: null }))
      return
    }
    const asset = createAsset(file, 'first_frame', { isPrimary: true })
    setAssets((prev) => ({ ...prev, firstFrame: asset }))
    uploadAsset(asset).catch((error) => { console.error('Upload failed:', error) })
  }, [uploadAsset])

  const setFirstFrameUrl = useCallback((url: string) => {
    const asset = createAssetFromUrl(url, 'first_frame', { isPrimary: true })
    setAssets((prev) => ({ ...prev, firstFrame: asset }))
  }, [])

  const removeFirstFrame = useCallback(() => {
    if (assets.firstFrame) revokeAssetUrl(assets.firstFrame)
    setAssets((prev) => ({ ...prev, firstFrame: null }))
  }, [assets.firstFrame])

  const setLastFrameFile = useCallback((file: File | null) => {
    if (!file) {
      setAssets((prev) => ({ ...prev, lastFrame: null }))
      return
    }
    const asset = createAsset(file, 'last_frame', { isPrimary: true })
    setAssets((prev) => ({ ...prev, lastFrame: asset }))
    uploadAsset(asset).catch((error) => { console.error('Upload failed:', error) })
  }, [uploadAsset])

  const setLastFrameUrl = useCallback((url: string) => {
    const asset = createAssetFromUrl(url, 'last_frame', { isPrimary: true })
    setAssets((prev) => ({ ...prev, lastFrame: asset }))
  }, [])

  const removeLastFrame = useCallback(() => {
    if (assets.lastFrame) revokeAssetUrl(assets.lastFrame)
    setAssets((prev) => ({ ...prev, lastFrame: null }))
  }, [assets.lastFrame])

  const setCtaGraphicFile = useCallback((file: File | null) => {
    if (!file) {
      setAssets((prev) => ({ ...prev, ctaGraphic: null }))
      return
    }
    const asset = createAsset(file, 'cta_graphic', { isPrimary: true })
    setAssets((prev) => ({ ...prev, ctaGraphic: asset }))
    uploadAsset(asset).catch((error) => { console.error('Upload failed:', error) })
  }, [uploadAsset])

  const setCtaGraphicUrl = useCallback((url: string) => {
    const asset = createAssetFromUrl(url, 'cta_graphic', { isPrimary: true })
    setAssets((prev) => ({ ...prev, ctaGraphic: asset }))
  }, [])

  const removeCtaGraphic = useCallback(() => {
    if (assets.ctaGraphic) revokeAssetUrl(assets.ctaGraphic)
    setAssets((prev) => ({ ...prev, ctaGraphic: null }))
  }, [assets.ctaGraphic])

  // ── Library asset move / remove / delete ────────────────────────────────────

  const moveLibraryAssetToSection = useCallback((assetId: string, section: AssignedSection) => {
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

      const target = all.find((a) => a.id === assetId)
      if (!target) return prev

      // Determine new role from destination section
      const newRole = (() => {
        switch (section) {
          case 'person': return 'presenter_identity'
          case 'logo': return 'logo'
          case 'products': return 'product_reference'
          case 'brand': return 'brand_reference'
          case 'firstFrame': return 'first_frame'
          case 'lastFrame': return 'last_frame'
          case 'ctaGraphic': return 'cta_graphic'
          default: return target.role
        }
      })()

      const movedAsset: PersonalizationAsset = {
        ...target,
        role: newRole,
        // Preserve edited data and source classification
        sourceCategory: target.sourceCategory,
        originalUrl: target.originalUrl || target.uploadedUrl || target.url,
        edited: target.edited,
        editedDataUrl: target.editedDataUrl,
        editMetadata: target.editMetadata,
        visionAnalysis: target.visionAnalysis,
        visionValidation: target.visionValidation,
        videoReady: target.videoReady,
        hasTransparency: target.hasTransparency,
        isPrimary: section === 'person' || section === 'logo' ? target.isPrimary : false,
      }

      // Remove from old location first
      let next: AssetLibrary = {
        ...prev,
        identities: prev.identities.filter((a) => a.id !== assetId),
        logos: prev.logos.filter((a) => a.id !== assetId),
        products: prev.products.filter((a) => a.id !== assetId),
        brandReferences: prev.brandReferences.filter((a) => a.id !== assetId),
        firstFrame: prev.firstFrame?.id === assetId ? null : prev.firstFrame,
        lastFrame: prev.lastFrame?.id === assetId ? null : prev.lastFrame,
        ctaGraphic: prev.ctaGraphic?.id === assetId ? null : prev.ctaGraphic,
        audio: prev.audio.filter((a) => a.id !== assetId),
        savedReferences: prev.savedReferences.filter((a) => a.id !== assetId),
      }

      // Handle primary cleanup for person/logo
      if (section === 'person') {
        next.primaryIdentity = next.identities.find((a) => a.isPrimary) || next.primaryIdentity
      } else if (section === 'logo') {
        next.primaryLogo = next.logos.find((a) => a.isPrimary) || next.primaryLogo
      }
      
      // If moving away from person/logo, clear primary if the moved asset was primary
      if (section !== 'person' && prev.primaryIdentity?.id === assetId) {
        next.primaryIdentity = next.identities.find((a) => a.isPrimary) || null
      }
      if (section !== 'logo' && prev.primaryLogo?.id === assetId) {
        next.primaryLogo = next.logos.find((a) => a.isPrimary) || null
      }

      // Add to new location
      switch (newRole) {
        case 'presenter_identity':
        case 'face_identity':
        case 'character_identity':
          return {
            ...next,
            identities: [...next.identities, movedAsset],
            primaryIdentity: next.primaryIdentity || movedAsset,
          }
        case 'logo':
          return {
            ...next,
            logos: [...next.logos, movedAsset],
            primaryLogo: next.primaryLogo || movedAsset,
          }
        case 'product_reference':
          return { ...next, products: [...next.products, movedAsset] }
        case 'brand_reference':
          return { ...next, brandReferences: [...next.brandReferences, movedAsset] }
        case 'first_frame':
          return { ...next, firstFrame: movedAsset }
        case 'last_frame':
          return { ...next, lastFrame: movedAsset }
        case 'cta_graphic':
          return { ...next, ctaGraphic: movedAsset }
        default:
          return next
      }
    })
  }, [])

  const removeLibraryAssetFromSection = useCallback((assetId: string) => {
    const all = [
      ...assets.identities,
      ...assets.logos,
      ...assets.products,
      ...assets.brandReferences,
      assets.firstFrame,
      assets.lastFrame,
      assets.ctaGraphic,
      ...assets.audio,
      ...assets.savedReferences,
    ].filter(Boolean) as PersonalizationAsset[]
    const asset = all.find((a) => a.id === assetId)
    if (asset) revokeAssetUrl(asset)
    setAssets((prev) => ({
      ...prev,
      identities: prev.identities.filter((a) => a.id !== assetId),
      logos: prev.logos.filter((a) => a.id !== assetId),
      products: prev.products.filter((a) => a.id !== assetId),
      brandReferences: prev.brandReferences.filter((a) => a.id !== assetId),
      firstFrame: prev.firstFrame?.id === assetId ? null : prev.firstFrame,
      lastFrame: prev.lastFrame?.id === assetId ? null : prev.lastFrame,
      ctaGraphic: prev.ctaGraphic?.id === assetId ? null : prev.ctaGraphic,
      audio: prev.audio.filter((a) => a.id !== assetId),
      savedReferences: prev.savedReferences.filter((a) => a.id !== assetId),
      primaryIdentity: prev.primaryIdentity?.id === assetId ? null : prev.primaryIdentity,
      primaryLogo: prev.primaryLogo?.id === assetId ? null : prev.primaryLogo,
    }))
  }, [assets])

  const deleteLibraryAsset = useCallback((assetId: string) => {
    const all = [
      ...assets.identities,
      ...assets.logos,
      ...assets.products,
      ...assets.brandReferences,
      assets.firstFrame,
      assets.lastFrame,
      assets.ctaGraphic,
      ...assets.audio,
      ...assets.savedReferences,
    ].filter(Boolean) as PersonalizationAsset[]
    const asset = all.find((a) => a.id === assetId)
    if (asset) revokeAssetUrl(asset)
    setAssets((prev) => ({
      ...prev,
      identities: prev.identities.filter((a) => a.id !== assetId),
      logos: prev.logos.filter((a) => a.id !== assetId),
      products: prev.products.filter((a) => a.id !== assetId),
      brandReferences: prev.brandReferences.filter((a) => a.id !== assetId),
      firstFrame: prev.firstFrame?.id === assetId ? null : prev.firstFrame,
      lastFrame: prev.lastFrame?.id === assetId ? null : prev.lastFrame,
      ctaGraphic: prev.ctaGraphic?.id === assetId ? null : prev.ctaGraphic,
      audio: prev.audio.filter((a) => a.id !== assetId),
      savedReferences: prev.savedReferences.filter((a) => a.id !== assetId),
      primaryIdentity: prev.primaryIdentity?.id === assetId ? null : prev.primaryIdentity,
      primaryLogo: prev.primaryLogo?.id === assetId ? null : prev.primaryLogo,
    }))
  }, [assets])

  const revertLibraryAssetToOriginal = useCallback((assetId: string) => {
    const all = [
      ...assets.identities,
      ...assets.logos,
      ...assets.products,
      ...assets.brandReferences,
      assets.firstFrame,
      assets.lastFrame,
      assets.ctaGraphic,
      ...assets.audio,
      ...assets.savedReferences,
    ].filter(Boolean) as PersonalizationAsset[]
    const target = all.find((a) => a.id === assetId)
    if (!target || !target.edited || !target.originalUrl) {
      setAssets((prev) => prev)
      return
    }
    revokeAssetUrl(target)
    const reverted: PersonalizationAsset = {
      ...target,
      url: target.originalUrl,
      uploadedUrl: target.originalUrl,
      edited: false,
      editedDataUrl: undefined,
      editMetadata: undefined,
      visionValidation: undefined,
      videoReady: false,
      hasTransparency: false,
      uploadStatus: 'ready',
      uploadError: null,
      file: null,
      name: target.name.replace('-edited.', '.').replace('_edited.', '.') || target.name,
    }
    setAssets((prev) => replaceAssetInLibrary(prev, reverted))
  }, [assets])

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

  const revertDiscoveredAssetEdit = useCallback((id: string) => {
    setDiscoveredAssetsState((prev) =>
      prev.map((a) => (a.id === id ? {
        ...a,
        editedDataUrl: undefined,
        edited: false,
        editMetadata: undefined,
        visionValidation: undefined,
        videoReady: false,
        hasTransparency: false,
      } : a)),
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
        let data: Record<string, unknown>
        try {
          data = await downloadRes.json()
        } catch {
          data = {}
        }
        const status = downloadRes.status
        if (status === 401) {
          setDiscoveryError('Authentication required. Please sign in to continue.')
        } else if (status === 403) {
          setDiscoveryError('You do not have access to this feature. Contact your administrator.')
        } else {
          setDiscoveryError(typeof data?.error === 'string' ? data.error : `Download failed (HTTP ${status})`)
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
        edited: Boolean(item.edited || item.editedDataUrl),
        editedDataUrl: item.editedDataUrl,
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

  const analyzeDiscoveredAssets = useCallback(async () => {
    if (discoveredAssets.length === 0) {
      setVisionStatus('complete')
      return
    }
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

        let data: Record<string, unknown>
        try {
          data = await res.json()
        } catch {
          data = {}
        }
        if (!res.ok) {
          const status = res.status
          if (status === 401) {
            throw new Error('Authentication required. Please sign in to use SmartVideo GO Vision.')
          }
          if (status === 403) {
            throw new Error('You do not have the SmartVideo GO entitlement. Contact your administrator.')
          }
          throw new Error(typeof data?.message === 'string' ? data.message : typeof data?.error === 'string' ? data.error : `Vision analysis failed (HTTP ${status})`)
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
          selected: asset.selected || recommended,
          assignedSection:
            useVisionCategory && !asset.assignedSection
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
        let data: Record<string, unknown>
        try {
          data = await res.json()
        } catch {
          data = {}
        }
        throw new Error(typeof data?.error === 'string' ? data.error : `Business search failed (HTTP ${res.status})`)
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

    // Populate client form from business, through the single shared mapping
    // (see `clientFormFromBusiness`) that the automated "Find My Brand"
    // workflow uses too.
    updateClientForm(clientFormFromBusiness(business))

    // Asset discovery is NOT triggered here: the caller decides. The
    // "Find My Brand" workflow calls `runDiscoveryWorkflow` (which performs the
    // research + discovery run for a selected business or a pasted URL), and
    // the manual "Find Business Assets" button remains for the step-by-step
    // path.
  }, [updateClientForm])

  /**
   * Free-tier discovery: the restricted anonymous pipeline behind
   * `POST /api/demo/discover`. It performs its own SSRF-gated research plus the
   * capped static asset extraction server-side, so the client makes exactly
   * one request and never touches an authenticated endpoint or a paid model.
   */
  const discoverDemoAssets = useCallback(async (rawWebsiteUrl: string): Promise<void> => {
    const websiteUrl = (rawWebsiteUrl || '').trim()
    setDiscoveryError(null)
    setVisionError(null)
    setVisionStatus('idle')
    setDiscoveryStatus('discovering')

    const fail = (message: string) => {
      setDiscoveryError(message)
      setDiscoveryStatus('idle')
    }

    if (!websiteUrl) {
      fail('Enter a business website URL to find your brand assets.')
      return
    }

    let response: Response
    try {
      response = await fetch('/api/demo/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl }),
        credentials: 'same-origin',
      })
    } catch {
      fail('Website research failed. Please try again.')
      return
    }

    if (!response.ok) {
      let data: Record<string, unknown> = {}
      try {
        data = await response.json()
      } catch {
        data = {}
      }
      const serverMessage = typeof data?.error === 'string' ? data.error.trim() : ''
      if (response.status === 429) {
        fail(`The free demo is rate limited right now. Please try again later.${serverMessage ? ` ${serverMessage}` : ''}`)
        return
      }
      fail(serverMessage || `Website research failed (HTTP ${response.status}). Please try again.`)
      return
    }

    let data: DemoDiscoveryResponse
    try {
      data = await response.json()
    } catch {
      data = {}
    }
    // Contract guard: a 200 with a different shape must surface the safe
    // message rather than render junk.
    if (!data || data.ok !== true || !Array.isArray(data.assets)) {
      fail('Website research returned an unexpected response. Please try again later.')
      return
    }

    const assets = demoAssetsToDiscoveredAssets(data)
    if (assets.length === 0) {
      fail('No assets were found on that website. Try a different business or paste another URL.')
      return
    }

    // (b) Show the research result in the existing summary panel and merge it
    //     into the form ADDITIVELY: only empty fields are filled, so the value
    //     selectBusiness already wrote (business name, industry, location,
    //     phone, website) and anything the visitor edited are never clobbered.
    const research = businessResearchFromDemoPayload(data)
    mergeResearchIntoClientForm(research)
    setBusinessResearch({ status: 'done', result: research })

    // (c) The same reviewable DiscoveredAsset list the paid pipeline produces.
    setDiscoveredAssetsState(assets)
    setDiscoveryStatus('reviewing')
  }, [mergeResearchIntoClientForm])

  const discoverAssets = useCallback(async (websiteUrl: string) => {
    // The access mode — not the modal — decides which endpoint is used.
    if (access === 'anonymous') {
      await discoverDemoAssets(websiteUrl)
      return
    }

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
        let data: Record<string, unknown>
        try {
          data = await res.json()
        } catch {
          data = {}
        }
        const status = res.status
        if (status === 401) {
          throw new Error('Authentication required. Please sign in to continue.')
        }
        if (status === 403) {
          throw new Error('You do not have access to this feature. Contact your administrator.')
        }
        throw new Error(typeof data?.error === 'string' ? data.error : `Discovery failed (HTTP ${status})`)
      }

      const data = await res.json()
      const discoveredAssets: DiscoveredAsset[] = Array.isArray(data?.discoveredAssets) ? data.discoveredAssets : []
      const providerUsed = typeof data?.providerUsed === 'string' ? data.providerUsed : 'UNKNOWN'
      const jobId = typeof data?.jobId === 'string' ? data.jobId : null
      const browserQueued = Boolean(data?.browserQueued)
      const responseStatus = typeof data?.status === 'string' ? data.status : (res.status === 202 ? 'processing' : 'complete')

      // If background discovery is queued, show fast assets and poll for completion
      if (jobId && (responseStatus === 'processing' || browserQueued)) {
        if (discoveredAssets.length > 0) {
          setDiscoveredAssetsState(discoveredAssets)
          setDiscoveryStatus('reviewing')
        } else {
          setDiscoveryStatus('discovering')
        }

        // Poll status endpoint until complete
        let pollCount = 0
        const maxPolls = 60
        const pollInterval = 2000

        const pollStatus = async (): Promise<void> => {
          while (pollCount < maxPolls) {
            await new Promise((resolve) => setTimeout(resolve, pollInterval))
            pollCount++

            try {
              const statusRes = await fetch(`/api/personalization/discover-assets/status?jobId=${encodeURIComponent(jobId)}`, {
                credentials: 'same-origin',
              })

              if (!statusRes.ok) {
                let statusData: Record<string, unknown>
                try {
                  statusData = await statusRes.json()
                } catch {
                  statusData = {}
                }
                throw new Error(typeof statusData?.error === 'string' ? statusData.error : `Status lookup failed (HTTP ${statusRes.status})`)
              }

              const statusData = await statusRes.json()
              const jobStatus = typeof statusData?.status === 'string' ? statusData.status : 'unknown'

              if (jobStatus === 'complete') {
                const finalAssets: DiscoveredAsset[] = Array.isArray(statusData?.result?.discoveredAssets)
                  ? statusData.result.discoveredAssets
                  : []

                if (finalAssets.length > 0) {
                  setDiscoveredAssetsState(finalAssets)
                  setDiscoveryStatus('reviewing')
                  setDiscoveryError(null)
                } else {
                  setDiscoveryError('No useful assets were found on that website.')
                  setDiscoveryStatus('idle')
                }
                return
              }

              if (jobStatus === 'error') {
                const errorMessage = typeof statusData?.errorMessage === 'string'
                  ? statusData.errorMessage
                  : typeof statusData?.error === 'string'
                    ? statusData.error
                    : 'Discovery job failed'
                setDiscoveryError(errorMessage)
                setDiscoveryStatus('idle')
                return
              }

              // Still running; continue polling
            } catch {
              setDiscoveryError('Failed to check discovery status. Please try again.')
              setDiscoveryStatus('idle')
              return
            }
          }

          setDiscoveryError('Discovery timed out. Please try again.')
          setDiscoveryStatus('idle')
        }

        pollStatus()
        return
      }

      // Immediate complete response
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
  }, [access, discoverDemoAssets, setDiscoveredAssetsState, setDiscoveryError, setDiscoveryStatus, testMode])


  /**
   * Shared website-research path: one request to the existing
   * `/api/personalization/research-business` route that returns the parsed
   * result. Both the manual "Research Business" button and the automated
   * "Find My Brand" workflow run through this — there is no second research
   * implementation.
   */
  const fetchBusinessResearch = useCallback(async (website: string): Promise<BusinessResearchResult> => {
    const res = await fetch('/api/personalization/research-business', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ websiteUrl: website }),
      credentials: 'same-origin',
    })

    if (!res.ok) {
      let data: Record<string, unknown>
      try {
        data = await res.json()
      } catch {
        data = {}
      }
      throw new Error(typeof data?.error === 'string' ? data.error : `Research failed (HTTP ${res.status})`)
    }

    const data = await res.json() as { research: BusinessResearchResult }
    const research = data.research

    if (!research || !research.finalUrl) {
      throw new Error('No research data returned')
    }

    return research
  }, [])

  const researchBusiness = useCallback(async (overrideUrl?: string) => {
    const website = overrideUrl || clientForm.website || selectedBusiness?.website
    if (!website) {
      setBusinessResearch({ status: 'error', error: 'No website available to research.' })
      return
    }

    setBusinessResearch({ status: 'researching' })

    try {
      const research = await fetchBusinessResearch(website)

      // Update business research state
      setBusinessResearch({
        status: 'done',
        result: research,
      })

      // Additive merge: fill only empty client fields, never overwrite a value
      // the visitor edited and never clobber when the research value is
      // missing (this replaces the old canonical-URL overwrite).
      mergeResearchIntoClientForm(research)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Research failed'
      setBusinessResearch({ status: 'error', error: message })
    }
  }, [clientForm.website, fetchBusinessResearch, mergeResearchIntoClientForm, selectedBusiness])

  /**
   * The automated "Find My Brand" workflow.
   *
   * One call that, for a single website URL, (a) populates the client form
   * through the existing `selectBusiness` mapping, (b) runs the shared research
   * path and (c) runs asset discovery, leaving the visitor with one reviewable
   * result inside the same modal. Nothing is re-entered and no second screen is
   * opened.
   *
   * Which endpoint is used is decided by `access`, never by the UI:
   *   anonymous     → `POST /api/demo/discover` (restricted free pipeline)
   *   authenticated → the shared research path + `discover-assets`
   */
  const runDiscoveryWorkflow = useCallback(async (
    rawWebsiteUrl: string,
    options?: { business?: BusinessDiscoveryRecord },
  ) => {
    const website = normalizeWebsiteInput(rawWebsiteUrl)
    if (!website) {
      setDiscoveryError('Enter a business website URL to find your brand assets.')
      return
    }

    // (a) Populate the form through the EXISTING selectBusiness mapping — from
    //     the OpenStreetMap record when the visitor picked a business, or from
    //     the pasted URL itself when they arrived with one. There is no second
    //     mapping, so both paths fill the same fields with the same rules.
    selectBusiness(options?.business || businessRecordFromWebsite(website))

    setDiscoveryError(null)
    setVisionError(null)
    setVisionStatus('idle')
    setDiscoveryStatus('discovering')

    if (access === 'anonymous') {
      // The free pipeline performs its own research + capped discovery in one
      // server round trip, so this single call covers research + discovery.
      await discoverDemoAssets(website)
      return
    }

    try {
      const research = await fetchBusinessResearch(website)
      // (b) Research summary in the existing panel + additive form merge
      //     (only empty fields are filled; edited values always win).
      setBusinessResearch({ status: 'done', result: research })
      mergeResearchIntoClientForm(research)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Research failed'
      setBusinessResearch({ status: 'error', error: message })
      setDiscoveryError(message)
      setDiscoveryStatus('idle')
      return
    }

    // (c) Existing discovery run for the same URL.
    await discoverAssets(website)
  }, [access, discoverAssets, discoverDemoAssets, fetchBusinessResearch, mergeResearchIntoClientForm, selectBusiness, setDiscoveryError, setDiscoveryStatus, setVisionError, setVisionStatus])

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
      if (personalized === promptState.original) {
        setGeneration((prev) => ({
          ...prev,
          status: 'error',
          errorMessage: 'Personalization returned the same prompt. Please edit manually or retry.',
          failedStage: 'prompt',
        }))
        return
      }
      setPromptState((prev) => ({ ...prev, personalized }))
      setGeneration((prev) => ({ ...prev, status: 'idle', progress: 100, progressMessage: 'Prompt personalized' }))
    } catch (error) {
      setGeneration((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Failed to personalize prompt',
        failedStage: 'prompt',
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

    const blobAssets = allAssets.filter((a) => typeof a.url === 'string' && a.url.startsWith('blob:'))
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
        failedStage: 'generation',
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

  // ── Guided Simple Mode + free preview actions ──────────────────────────────
  //
  // The preview is entirely local: these actions only manipulate the
  // PersonalizationPreviewSettings composition. `createFinalVideo` is the only
  // place that hands off to the existing generate() pipeline.

  const setGuidedStep = useCallback((step: GuidedStep) => {
    const clamped = Math.min(4, Math.max(1, Math.round(step))) as GuidedStep
    setGuidedStepState(clamped)
  }, [])

  const setPreviewLayout = useCallback((layout: PreviewLayoutId) => {
    setPreviewSettings((prev) => applyLayoutPreset(prev, layout, previewSeedRef.current))
  }, [])

  const updatePreviewLayer = useCallback((layerId: string, patch: Partial<PreviewLayer>) => {
    setPreviewSettings((prev) => ({
      ...prev,
      layers: prev.layers.map((layer) =>
        layer.id === layerId ? clampPreviewLayer({ ...layer, ...patch }) : layer,
      ),
    }))
  }, [])

  const updatePreviewBrandColors = useCallback((patch: Partial<PreviewBrandColors>) => {
    setPreviewSettings((prev) => ({
      ...prev,
      brandColors: { ...prev.brandColors, ...patch },
    }))
  }, [])

  const updatePreviewComposition = useCallback(
    (patch: Partial<Pick<PersonalizationPreviewSettings, 'aspectRatio' | 'fps' | 'durationInFrames' | 'showEndCard'>>) => {
      setPreviewSettings((prev) => {
        const next = { ...prev, ...patch }
        if (patch.aspectRatio) {
          const dimensions = getCompositionDimensions(patch.aspectRatio)
          next.width = dimensions.width
          next.height = dimensions.height
        }
        return next
      })
    },
    [],
  )

  const resetPreviewLayout = useCallback(() => {
    // "Restore default layout" must undo per-layer position/scale/visibility
    // edits, not only re-seed layers that are missing from the layout. Brand
    // content stays — it is re-derived from the form/asset seed below.
    setPreviewSettings((prev) => resetLayoutToDefaults(prev, prev.layout, previewSeedRef.current))
  }, [])

  const approvePersonalization = useCallback(() => {
    setPreviewApproved(true)
    // Write the approved preview through immediately instead of waiting for the
    // debounce window, so the durable project row matches what was approved.
    // Anonymous sessions keep this in memory only.
    if (!source || access !== 'authenticated') return
    projectPersistence.current.flush(buildProjectPayload())
  }, [source, access, buildProjectPayload])

  const createFinalVideo = useCallback(async () => {
    // Overlay-only personalizations (branding on the EXISTING selected video)
    // export through the local Remotion render pipeline — never through MuAPI
    // generation. Personalizations that genuinely need AI-generated imagery or
    // video keep the existing generate() flow exactly.
    if (access !== 'authenticated') return
    const finalPath = chooseFinalOutputPath({ personalizationMode: mode || null })

    if (finalPath === 'ai-generation') {
      const hasLogo = previewSettings.layers.some(
        (layer) => layer.kind === 'logo' && layer.visible && Boolean(layer.imageUrl || previewSeed.logoUrl),
      )
      const hasCta = previewSettings.layers.some((layer) => layer.kind === 'cta' && layer.visible)

      // Sync the approved preview into the existing generation options.
      setGenOptions((prev) => ({
        ...prev,
        aspectRatio: previewSettings.aspectRatio,
        duration: Math.max(1, Math.round(previewSettings.durationInFrames / previewSettings.fps)),
        exactLogoHandling: hasLogo ? 'final-overlay' : prev.exactLogoHandling,
        exactCtaHandling: hasCta ? 'final-end-card' : prev.exactCtaHandling,
      }))

      // A selected preview video replaces the source media. The source update and
      // generate() cannot share a tick (generate would read the stale source), so
      // the pending ref lets the effect below run generate on the next commit.
      if (previewVideo && source && previewVideo.url !== source.sourceMedia) {
        setSource((prev) =>
          prev
            ? {
                ...prev,
                sourceMedia: previewVideo.url,
                poster: previewVideo.poster ?? prev.poster,
                title: previewVideo.title || prev.title,
              }
            : prev,
        )
        pendingFinalGenerateRef.current = true
        return
      }

      await generate()
      return
    }

    // ── branded-render: in-browser render of the approved composition ────────
    //
    // The overlay-only final video is produced entirely in the browser by
    // @remotion/web-renderer — no server, no worker, no storage upload. The
    // flow requires an approved preview first, and the approved state is
    // snapshotted at call time so later edits cannot leak into the export.
    if (!previewApproved) {
      setGeneration({
        ...EMPTY_GENERATION_STATE,
        status: 'error',
        errorMessage: 'Approve the preview first so we render exactly the layout you signed off on, then render your branded video.',
      })
      return
    }

    // Snapshot the approved composition: the user may keep editing while the
    // render runs, and the export must stay the approved one.
    const frozenSettings = previewSettings
    const frozenVideo = previewVideo
    const frozenClientForm = clientForm
    const frozenAssets = assets
    const frozenSource = source
    const inputProps = buildPreviewInput({
      source: frozenSource,
      previewSettings: frozenSettings,
      previewVideo: frozenVideo,
      clientForm: frozenClientForm,
      assets: frozenAssets,
    })

    setGeneration({
      ...EMPTY_GENERATION_STATE,
      status: 'generating',
      progress: 5,
      progressMessage: 'Preparing your branded video…',
    })
    setResult(null)
    setResultTab('prompt')

    try {
      // Loaded lazily so the renderer never lands in the main bundle.
      const { exportPersonalizedVideo, downloadWebExportBlob } = await import('./webExport')

      const exported = await exportPersonalizedVideo({
        inputProps,
        onProgress: (progress) => {
          // Real render progress from the web renderer, mapped into the
          // existing generation state (10..95%) so the UI stays a plain bar.
          const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100)
          setGeneration((prev) => ({
            ...prev,
            status: 'processing',
            progress: Math.max(10, Math.min(95, percent)),
            progressMessage: `Rendering your branded video… ${percent}%`,
          }))
        },
      })

      if (!exported.ok) {
        if (exported.reason === 'cancelled') {
          setGeneration({ ...EMPTY_GENERATION_STATE, status: 'idle' })
          return
        }
        setGeneration({
          ...EMPTY_GENERATION_STATE,
          status: 'error',
          errorMessage: exported.error,
        })
        return
      }

      if (exported.warning) {
        // Non-fatal: e.g. the browser could not encode an audio codec.
        setGeneration((prev) => ({
          ...prev,
          progressMessage: `${prev.progressMessage || 'Rendering your branded video…'} ${exported.warning}`,
        }))
      }

      const fileName = `personalized-${Date.now().toString(36)}.${exported.extension}`
      const objectUrl = URL.createObjectURL(exported.blob)

      // Direct download: the file is handed to the user's device immediately,
      // so there is no storage cap and nothing is retained on a server.
      downloadWebExportBlob(exported.blob, fileName)

      const brandedResult: GenerationResult = {
        type: 'video',
        url: objectUrl,
        metadata: {
          source: 'branded-render',
          compositionId: 'PersonalizationComposition',
          container: exported.mimeType,
          extension: exported.extension,
          fileName,
          ...(exported.warning ? { warning: exported.warning } : {}),
        },
      }
      lastResultRef.current = brandedResult
      setResult(brandedResult)
      setResultTab('videos')
      setGeneration({
        ...EMPTY_GENERATION_STATE,
        status: 'complete',
        progress: 100,
        progressMessage: 'Branded video ready',
      })
    } catch (error) {
      setGeneration({
        ...EMPTY_GENERATION_STATE,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Branded render failed',
      })
    }
  }, [previewSettings, previewSeed, previewVideo, source, generate, mode, access, apiKey, clientForm, assets, previewApproved])

  const cancelExport = useCallback(() => {
    cancelActiveExport()
  }, [])

  // Hands off to the existing generate() path once the patched source (selected
  // preview video) has committed.
  useEffect(() => {
    if (!pendingFinalGenerateRef.current) return
    pendingFinalGenerateRef.current = false
    void generate()
  }, [generate])

  // ── Result actions ─────────────────────────────────────────────────────────

  const editInImageStudio = useCallback(() => {
    if (!lastResultRef.current || !lastProjectRef.current || lastResultRef.current.type !== 'image') return
    const result = lastResultRef.current
    const project = lastProjectRef.current
    const prompt = result.prompt || project.personalizedPrompt || project.source.originalPrompt || ''
    const safeUrl = result.url && !result.url.startsWith('blob:') ? result.url : (project.source.sourceMedia && !project.source.sourceMedia.startsWith('blob:') ? project.source.sourceMedia : null)

    if (!safeUrl) return

    const handoff = {
      version: 1 as const,
      target: 'image' as const,
      from: 'demo-personalization' as const,
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
    }

    writeHandoff(handoff)
    const readBack = readHandoff('image')
    if (!readBack || readBack.referenceImageUrl !== handoff.referenceImageUrl || readBack.projectName !== handoff.projectName) return

    closePersonalize()
    router.push('/studio/image')
  }, [closePersonalize, router])

  const editInVideoStudio = useCallback(() => {
    if (!lastResultRef.current || !lastProjectRef.current || lastResultRef.current.type !== 'video') return
    const result = lastResultRef.current
    const project = lastProjectRef.current
    const prompt = result.prompt || project.personalizedPrompt || project.source.originalPrompt || ''
    const videoUrl = result.url && !result.url.startsWith('blob:') ? result.url : null
    const referenceImageUrl = getGenerationAssetUrl(project.assets.primaryIdentity)
    const firstFrameUrl = getGenerationAssetUrl(project.assets.firstFrame)

    if (!videoUrl || !referenceImageUrl) return

    const handoff = {
      version: 1 as const,
      target: 'video' as const,
      from: 'demo-personalization' as const,
      projectName: project.source.title || 'Personalized Video',
      aspectRatio: (project.source.aspectRatio as '16:9' | '9:16' | '1:1' | null) || '16:9',
      episodeDuration: project.source.duration || 0,
      videoUrl,
      referenceImageUrl,
      characterNames: project.assets.identities.map((i) => i.name).filter(Boolean),
      shots: prompt
        ? [{ scene: project.source.title || 'Personalized', prompt, duration: project.source.duration || 0, characterNames: [] }]
        : [],
      combinedPrompt: prompt,
      firstFrameUrl: firstFrameUrl || null,
      createdAt: new Date().toISOString(),
    }

    writeHandoff(handoff)
    const readBack = readHandoff('video')
    if (!readBack || readBack.videoUrl !== handoff.videoUrl || readBack.projectName !== handoff.projectName) return

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

    // Access mode + automated discovery workflow
    access,
    runDiscoveryWorkflow,

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
    applyEditedSavedClientAsset,

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
    revertDiscoveredAssetEdit,
    selectRecommendedDiscoveredAssets,
    importDiscoveredAssets,
    cancelDiscovery,
    discoverAssets,
    visionStatus,
    visionError,
    analyzeDiscoveredAssets,
    // Library asset actions
    moveLibraryAssetToSection,
    removeLibraryAssetFromSection,
    deleteLibraryAsset,
    revertLibraryAssetToOriginal,

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

    // Project restore (Phase 14)
    loadedProject,
    restoring,

    // Guided Simple Mode + free Remotion preview
    viewMode,
    setViewMode,
    guidedStep,
    setGuidedStep,
    previewSettings,
    previewVideo,
    setPreviewVideo,
    setPreviewLayout,
    updatePreviewLayer,
    updatePreviewBrandColors,
    updatePreviewComposition,
    resetPreviewLayout,
    previewApproved,
    approvePersonalization,
     createFinalVideo,
     cancelExport,
     apiKey,
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
