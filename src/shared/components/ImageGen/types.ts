/**
 * Shared types for all ImageGen components
 * Used by Thumbnail Studio, VFX Studio, Storyboard, UGC Generator, etc.
 */

export type ImageQuality   = 'low' | 'medium' | 'high' | 'auto'
export type ImageFormat    = 'png' | 'jpeg' | 'webp'
export type ImageModel     = 'gpt-image-2' | 'gpt-image-1' | 'dall-e-3' | 'dall-e-2' | 'flux-dev' | 'flux-schnell' | 'seedream-5.0' | 'midjourney-v7'
export type GenerationMode = 'generate' | 'edit' | 'refine'

// ── Canvas size presets ───────────────────────────────────────────────────────
export interface SizePreset {
  id: string
  label: string
  description: string
  width: number
  height: number
  ratio: string
  openaiSize: string   // exact string to send to OpenAI API
}

export const SIZE_PRESETS: SizePreset[] = [
  { id: 'yt-hd',     label: '16:9 HD',    description: 'YouTube HD',          width: 1920, height: 1080, ratio: '16:9',  openaiSize: '1792x1024' },
  { id: 'yt-std',    label: '16:9',       description: 'YouTube standard',     width: 1280, height: 720,  ratio: '16:9',  openaiSize: '1536x1024' },
  { id: 'square',    label: '1:1',        description: 'Instagram / square',   width: 1024, height: 1024, ratio: '1:1',   openaiSize: '1024x1024' },
  { id: 'portrait',  label: '9:16',       description: 'Shorts / TikTok',      width: 1080, height: 1920, ratio: '9:16',  openaiSize: '1024x1792' },
  { id: 'classic',   label: '4:3',        description: 'Classic format',       width: 1280, height: 960,  ratio: '4:3',   openaiSize: '1024x1024' },
  { id: '2k',        label: '2K',         description: '2K landscape',         width: 2048, height: 1152, ratio: '16:9',  openaiSize: '1792x1024' },
]

// ── Quality presets ───────────────────────────────────────────────────────────
export interface QualityPreset {
  value: ImageQuality
  label: string
  description: string
  speed: string
}

export const QUALITY_PRESETS: QualityPreset[] = [
  { value: 'low',    label: 'Draft',    description: 'Fastest, good for previews',    speed: '~5s'  },
  { value: 'medium', label: 'Standard', description: 'Balanced quality and speed',    speed: '~15s' },
  { value: 'high',   label: 'Best',     description: 'Highest quality, slower',       speed: '~45s' },
]

// ── A single generated image ──────────────────────────────────────────────────
export interface GeneratedImage {
  id: string
  url: string          // object URL (local) or Supabase URL
  b64?: string         // base64 if needed for editing
  prompt: string
  enhancedPrompt?: string
  model: ImageModel
  quality: ImageQuality
  format: ImageFormat
  style?: string
  aspectRatio?: string
  width?: number
  height?: number
  isPublic: boolean
  sessionId?: string
  createdAt: string
  // Multi-turn editing
  responseId?: string  // Responses API ID for iterative editing
}

// ── Generation request ────────────────────────────────────────────────────────
export interface GenerationRequest {
  prompt: string
  model: ImageModel
  quality: ImageQuality
  format: ImageFormat
  compression?: number
  size: SizePreset
  n: number             // 1-4 variations
  style?: string
  referenceImage?: File            // for /edits endpoint
  mask?: File | Blob               // for inpainting
  mode: GenerationMode
  previousResponseId?: string      // for multi-turn refinement
  /** User's MuAPI key (passed from the shell) used to authorize the request. */
  apiKey?: string
  /** URL of a previously generated image, used for refine (image-to-image). */
  previousImageUrl?: string
  isPublic?: boolean
  sessionId?: string
}

// ── Gallery filters ───────────────────────────────────────────────────────────
export interface GalleryFilter {
  scope: 'mine' | 'community' | 'all'
  style?: string
  aspectRatio?: string
}
