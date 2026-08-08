export interface VideoGenerationParams {
  prompt: string
  duration?: number
  aspectRatio?: string
  model?: string
  image_url?: string
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
