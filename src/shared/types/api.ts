export interface VideoGenerationParams {
  prompt: string
  duration?: number
  aspectRatio?: '16:9' | '9:16' | '1:1'
  model?: string
  negativePrompt?: string
  seed?: number
}

export interface VideoResult {
  id: string
  url: string
  thumbnailUrl: string
  duration: number
  createdAt: string
}

export interface ImageGenerationParams {
  prompt: string
  width?: number
  height?: number
  model?: string
  style?: string
}

export interface ImageResult {
  id: string
  url: string
  thumbnailUrl: string
  width: number
  height: number
  createdAt: string
}

export interface AudioGenerationParams {
  prompt: string
  duration?: number
  genre?: string
  mood?: string
}

export interface AudioResult {
  id: string
  url: string
  duration: number
  createdAt: string
}

export interface TextGenerationParams {
  prompt: string
  systemPrompt?: string
  model?: string
  maxTokens?: number
  temperature?: number
}

export interface TextResult {
  id: string
  text: string
  model: string
  createdAt: string
}