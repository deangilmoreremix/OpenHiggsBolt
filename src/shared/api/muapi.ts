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
import { getAudioModelById } from 'studio/src/models.js'

const DEFAULT_VIDEO_MODEL = 'kling-3.0'
const DEFAULT_IMAGE_MODEL = 'flux-dev'
const DEFAULT_AUDIO_MODEL = 'minimax-speech-2.6-turbo'

async function pollPredictions(requestId: string, key: string, maxAttempts = 90, interval = 2000): Promise<any> {
  const url = `https://api.muapi.ai/api/v1/predictions/${encodeURIComponent(requestId)}/result`
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, interval))
    try {
      const res = await fetch(url, {
        headers: { 'x-api-key': key },
        signal: AbortSignal.timeout(30000),
      })
      if (!res.ok) {
        const text = await res.text()
        let detail = text
        try { detail = JSON.parse(text)?.detail || detail } catch {}
        throw new Error(`MuAPI poll failed (${res.status}): ${detail}`)
      }
      const data = await res.json()
      const status = String(data?.status || data?.data?.status || '').toLowerCase()
      if (status === 'completed' || status === 'succeeded' || status === 'success') return data
      if (status === 'failed' || status === 'error') {
        throw new Error(data?.error || data?.data?.error || 'Generation failed')
      }
    } catch (err: any) {
      if (attempt === maxAttempts) throw err
    }
  }
  throw new Error('Generation timed out after polling.')
}

export async function generateVideo(params: VideoGenerationParams): Promise<VideoResult> {
  const payload: Record<string, unknown> = {
    model: params.model || DEFAULT_VIDEO_MODEL,
    prompt: params.prompt,
  }
  if (params.aspectRatio) payload.aspect_ratio = params.aspectRatio
  if (params.duration !== undefined) payload.duration = params.duration
  if (params.image_url) payload.image_url = params.image_url
  return (await (muapi as any).generateVideo(payload)) as VideoResult
}

export async function generateImage(params: ImageGenerationParams): Promise<ImageResult> {
  const payload: Record<string, unknown> = {
    model: params.model || DEFAULT_IMAGE_MODEL,
    prompt: params.prompt,
  }
  if (params.aspectRatio) payload.aspect_ratio = params.aspectRatio
  if (params.image_url) payload.image_url = params.image_url
  return (await (muapi as any).generateImage(payload)) as ImageResult
}

export async function generateAudio(params: AudioGenerationParams): Promise<AudioResult> {
  const key = (muapi as any).getKey()
  const modelId = params.model || DEFAULT_AUDIO_MODEL
  const modelInfo = getAudioModelById(modelId)
  const endpoint = modelInfo?.endpoint || modelId

  const payload: Record<string, unknown> = {}
  if (params.prompt) payload.prompt = params.prompt
  if (modelInfo?.required?.includes('voice_id')) {
    payload.voice_id = modelInfo.inputs?.voice_id?.enum?.[0] || 'Friendly_Person'
  }

  const url = `https://api.muapi.ai/api/v1/${encodeURIComponent(endpoint)}`
  const submit = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
  })
  const submitText = await submit.text()
  if (!submit.ok) {
    let detail = submitText
    try { detail = JSON.parse(submitText)?.detail || detail } catch {}
    throw new Error(`MuAPI audio submit failed (${submit.status}): ${detail}`)
  }
  const submitData = JSON.parse(submitText)
  const requestId = submitData.request_id || submitData.id
  if (!requestId) throw new Error('MuAPI did not return a request_id for audio')

  const result = await pollPredictions(requestId, key, 90, 2000)
  const body = result?.data || result
  const outputs = result?.outputs || body?.outputs || result?.output || body?.output?.outputs
  const audioUrl = Array.isArray(outputs) && outputs.length > 0
    ? (typeof outputs[0] === 'string' ? outputs[0] : outputs[0]?.url)
    : result?.url || body?.url || result?.video_url || body?.video_url || null

  return { url: audioUrl || undefined }
}

export async function generateText(params: TextGenerationParams): Promise<TextResult> {
  const { text, model } = await callOpenAI(params.prompt, 'script')
  return { text, model: params.model || model }
}
