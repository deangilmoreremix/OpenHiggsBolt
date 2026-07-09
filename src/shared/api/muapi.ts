import { muapi } from '@/lib/muapi'
import { callOpenAI } from '@/shared/api/openai'
import type {
  VideoGenerationParams,
  VideoResult,
  ImageGenerationParams,
  ImageResult,
  AudioGenerationParams,
  AudioResult,
  TextGenerationParams,
  TextResult,
} from '@/types/api'

const DEFAULT_VIDEO_MODEL = 'kling-3.0'
const DEFAULT_IMAGE_MODEL = 'flux-dev'

export async function generateVideo(params: VideoGenerationParams): Promise<VideoResult> {
  const payload: Record<string, unknown> = {
    model: params.model || DEFAULT_VIDEO_MODEL,
    prompt: params.prompt,
  }
  if (params.aspectRatio) payload.aspect_ratio = params.aspectRatio
  if (params.duration !== undefined) payload.duration = params.duration
  if (params.image_url) payload.image_url = params.image_url
  return (await muapi.generateVideo(payload as never)) as VideoResult
}

export async function generateImage(params: ImageGenerationParams): Promise<ImageResult> {
  const payload: Record<string, unknown> = {
    model: params.model || DEFAULT_IMAGE_MODEL,
    prompt: params.prompt,
  }
  if (params.aspectRatio) payload.aspect_ratio = params.aspectRatio
  if (params.image_url) payload.image_url = params.image_url
  return (await muapi.generateImage(payload as never)) as ImageResult
}

export async function generateAudio(params: AudioGenerationParams): Promise<AudioResult> {
  throw new Error(`generateAudio is not wired into the shared MuAPI client yet (requested: ${params?.prompt ?? 'n/a'})`)
}

export async function generateText(params: TextGenerationParams): Promise<TextResult> {
  const { text, model } = await callOpenAI(params.prompt, 'script')
  return { text, model: params.model || model }
}
