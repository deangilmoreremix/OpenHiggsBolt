/**
 * Shared Personalization System — Types
 */

export type PersonalizationSourceType =
  | 'landing-demo'
  | 'go-ai-viral-prompt'
  | 'go-ai-viral-video'
  | 'image-demo'
  | 'future-demo'

export interface PersonalizationSource {
  sourceType: PersonalizationSourceType
  id: string
  title: string
  mediaType: 'image' | 'video' | 'prompt-only'
  sourceMedia: string | null
  poster: string | null
  shortPrompt: string
  fullPrompt: string
  originalPrompt: string
  model?: string
  modelName?: string
  aspectRatio?: string
  duration?: number
  durationLabel?: string
  category?: string
  sourceUrl?: string
  sourceMetadata: Record<string, unknown>
}

export type AudienceType = 'me' | 'my-business' | 'customer'

export interface ClientProfile {
  id: string
  audience: AudienceType
  name: string
  businessName: string
  industry: string
  location: string
  productService: string
  offer: string
  ctaHeadline: string
  callToAction: string
  phone: string
  website: string
  brandDescription: string
  createdAt: string
  updatedAt: string
}

export const EMPTY_CLIENT: ClientProfile = {
  id: '',
  audience: 'me',
  name: '',
  businessName: '',
  industry: '',
  location: '',
  productService: '',
  offer: '',
  ctaHeadline: '',
  callToAction: '',
  phone: '',
  website: '',
  brandDescription: '',
  createdAt: '',
  updatedAt: '',
}

export type AssetRole =
  | 'presenter_identity'
  | 'face_identity'
  | 'character_identity'
  | 'logo'
  | 'product_reference'
  | 'brand_reference'
  | 'first_frame'
  | 'last_frame'
  | 'cta_graphic'
  | 'background_reference'
  | 'audio_reference'
  | 'saved_reference'

export interface PersonalizationAsset {
  id: string
  role: AssetRole
  name: string
  url: string
  uploadedUrl?: string
  isPrimary: boolean
  mimeType?: string
  width?: number
  height?: number
  createdAt: string
  uploadStatus?: 'local' | 'uploading' | 'ready' | 'error'
  uploadError?: string | null
  file?: File | null
}

export interface AssetLibrary {
  identities: PersonalizationAsset[]
  primaryIdentity: PersonalizationAsset | null
  logos: PersonalizationAsset[]
  primaryLogo: PersonalizationAsset | null
  products: PersonalizationAsset[]
  brandReferences: PersonalizationAsset[]
  firstFrame: PersonalizationAsset | null
  lastFrame: PersonalizationAsset | null
  ctaGraphic: PersonalizationAsset | null
  audio: PersonalizationAsset[]
  savedReferences: PersonalizationAsset[]
}

export const EMPTY_ASSET_LIBRARY: AssetLibrary = {
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

export interface PromptState {
  original: string
  personalized: string
  edited: string
}

export const EMPTY_PROMPT_STATE: PromptState = {
  original: '',
  personalized: '',
  edited: '',
}

export type OutputType = 'prompt' | 'image' | 'video' | 'everything'

export type VideoPersonalizationMode = 'face_only' | 'full_body' | 'recreate' | 'complete'
export type ImagePersonalizationMode = 'keep_design' | 'replace_face' | 'replace_person' | 'recreate' | 'complete'

export interface GenerationOptions {
  engine: string
  preserveAudio: boolean
  resolution?: string
  quality?: string
  characterOrientation?: string
  model?: string
  modelName?: string
  exactLogoHandling: 'ai-reference' | 'final-overlay'
  exactCtaHandling: 'ai-generated' | 'final-end-card'
  firstFrameMode: 'none' | 'uploaded' | 'generated'
  lastFrameMode: 'none' | 'uploaded' | 'generated'
  advancedModel?: string
  consentGiven: boolean
  aspectRatio?: string
  duration?: number
}

export const DEFAULT_GENERATION_OPTIONS: GenerationOptions = {
  engine: 'smartvideo-recommended',
  preserveAudio: true,
  exactLogoHandling: 'final-overlay',
  exactCtaHandling: 'final-end-card',
  firstFrameMode: 'none',
  lastFrameMode: 'none',
  consentGiven: false,
}

export interface GenerationState {
  status: 'idle' | 'personalizing-prompt' | 'generating' | 'processing' | 'complete' | 'error'
  progress: number
  progressMessage: string
  errorMessage: string | null
}

export const EMPTY_GENERATION_STATE: GenerationState = {
  status: 'idle',
  progress: 0,
  progressMessage: '',
  errorMessage: null,
}

export interface PersonalizationProject {
  id: string
  source: PersonalizationSource
  client: ClientProfile
  assets: AssetLibrary
  prompt: PromptState
  outputType: OutputType
  mode: VideoPersonalizationMode | ImagePersonalizationMode | null
  generation: GenerationOptions
  outputs: { prompts: string[]; images: string[]; videos: string[] }
  status: 'idle' | 'personalizing-prompt' | 'generating' | 'processing' | 'complete' | 'error'
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

export interface ResolvedAssets {
  directInputs: Record<string, unknown>
  promptContext: Record<string, string>
  preProcessing: Record<string, unknown>
  postProcessing: Record<string, unknown>
  unusedSavedReferences: PersonalizationAsset[]
}

export interface GenerationResult {
  type: 'prompt' | 'image' | 'video'
  url?: string
  urls?: string[]
  prompt?: string
  metadata?: Record<string, unknown>
}

export interface ImageStudioHandoff {
  source: 'demo-personalization'
  sourceType: string
  imageUrl: string
  originalImageUrl?: string
  clientId?: string
  personalizedPrompt?: string
  referenceAssets?: PersonalizationAsset[]
  personalizationMode?: string
  createdAt: string
}

export interface VideoStudioHandoff {
  source: 'demo-personalization'
  sourceType: string
  videoUrl: string
  originalVideoUrl?: string
  clientId?: string
  identityAssetIds: string[]
  personalizationMode?: string
  personalizedPrompt?: string
  model?: string
  createdAt: string
}

export interface PersonalizationEligibility {
  enabled: boolean
  outputs: OutputType[]
  videoModes: VideoPersonalizationMode[]
  imageModes: ImagePersonalizationMode[]
  recommendedMode?: VideoPersonalizationMode | ImagePersonalizationMode
}

export interface SharedMediaEntry {
  id: string
  originStudio: 'demo-personalization'
  sourceType: string
  sourceDemoId?: string
  sourceDemoSlug?: string
  viralRecordId?: string
  sourceMedia: string | null
  sourceUrl: string | null
  personalizationMode: string | null
  model: string | null
  originalPrompt: string
  personalizedPrompt: string
  identityAssetIds: string[]
  logoAssetIds: string[]
  productAssetIds: string[]
  brandReferenceAssetIds: string[]
  firstFrameAssetId: string | null
  lastFrameAssetId: string | null
  outputUrls: string[]
  outputType: string
  clientId?: string
  createdAt: string
}
