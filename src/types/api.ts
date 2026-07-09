export interface VideoGenerationParams {
  prompt: string
  duration?: number
  aspectRatio?: string
  model?: string
  image_url?: string
  [key: string]: unknown
}

export interface VideoResult {
  url?: string
  requestId?: string
  status?: string
  [key: string]: unknown
}

export interface ImageGenerationParams {
  prompt: string
  aspectRatio?: string
  model?: string
  image_url?: string
  [key: string]: unknown
}

export interface ImageResult {
  url?: string
  requestId?: string
  status?: string
  [key: string]: unknown
}

export interface AudioGenerationParams {
  prompt: string
  model?: string
  [key: string]: unknown
}

export interface AudioResult {
  url?: string
  [key: string]: unknown
}

export interface TextGenerationParams {
  prompt: string
  systemPrompt?: string
  model?: string
  temperature?: number
  maxTokens?: number
  [key: string]: unknown
}

export interface TextResult {
  text: string
  model?: string
  [key: string]: unknown
}
