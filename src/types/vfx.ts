/**
 * VFX generation domain types.
 */

export type AspectRatio = '16:9' | '9:16' | '1:1'
export type Resolution = '480p' | '720p'
export type Quality = 'medium' | 'high'
export type GenerationState = 'idle' | 'uploading' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'

export interface VFXEffect {
  id: string
  name: string
  prompt: string
  preview?: string
  emoji: string
  category: 'ai-effects' | 'motion-controls' | 'vfx'
}

export interface GenerationRequest {
  image_url: string
  effect: string
  prompt?: string
  aspect_ratio?: AspectRatio
  duration?: number
  resolution?: Resolution
  quality?: Quality
}

export interface GenerationResponse {
  request_id: string
  status?: GenerationState
  message?: string
}

export interface GenerationStatus {
  request_id: string
  status: GenerationState
  progress?: number
  video_url?: string
  error?: string
  outputs?: unknown[]
}

export interface UploadResponse {
  url: string
  name?: string
  size?: number
  type?: string
}

export interface VideoResult {
  request_id: string
  video_url: string
  status: 'completed'
  effect: string
  prompt?: string
  created_at: string
}

export interface VideoGenerationHookState {
  status: GenerationState
  progress: number
  videoUrl: string | null
  error: string | null
  loading: boolean
  requestId: string | null
}

export interface VideoGenerationActions {
  uploadImage: (source: File | string) => Promise<string | null>
  generateVideo: (params: GenerationRequest) => Promise<string | null>
  cancelVideo: () => void
  retryVideo: () => void
  reset: () => void
  setError: (error: string | null) => void
}

export type UseVideoGenerationReturn = VideoGenerationHookState & VideoGenerationActions
