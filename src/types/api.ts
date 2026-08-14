export interface VideoGenerationParams {
  prompt: string
  duration?: number
  aspectRatio?: string
  model?: string
  image_url?: string
  // Advanced, model-aware controls (muapi.ai capability research).
  negative_prompt?: string
  seed?: number
  resolution?: string
  quality?: string
  generate_audio?: boolean
  camera_fixed?: boolean
  cfg_scale?: number
  bitrate_mode?: string
  output_format?: string
  watermark?: boolean
  return_last_frame?: boolean
  camera_control?: {
    type: string
    config?: Record<string, number>
  }
  enable_sound?: boolean
  last_image?: string
  images_list?: string[]
  videos_list?: string[]
  reference_image_urls?: string[]
  multi_prompt?: string[]
  multi_shots?: boolean
  first_frame?: string
  last_frame?: string
  audio_url?: string
  ratio?: string
  shot_type?: string
  generate_audio_switch?: boolean
}

export interface VideoResult {
  url?: string
  requestId?: string
  status?: string
}

export interface ImageGenerationParams {
  prompt: string
  aspectRatio?: string
  model?: string
  image_url?: string
}

export interface ImageResult {
  url?: string
  requestId?: string
  status?: string
}

export interface AudioGenerationParams {
  prompt: string
  model?: string
}

export interface AudioResult {
  url?: string
}

export interface TextGenerationParams {
  prompt: string
  systemPrompt?: string
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface TextResult {
  text: string
  model?: string
}
