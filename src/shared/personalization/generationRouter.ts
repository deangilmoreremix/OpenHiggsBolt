/**
 * Generation Router
 *
 * Routes personalization generation to the correct provider:
 * - Generative still-image operations (image generation / editing) → OpenAI
 * - Specialized utility transforms and video → MuAPI
 */

import {
  generateVideo,
  generateI2V,
  processRecast,
  processV2V,
  uploadFile,
} from '@/packages/studio/src/muapi'
import { createPersonalizationOpenAIClient } from './openaiPersonalizationClient'
import {
  getV2VModelById,
  getVideoModelById,
  getI2IModelById,
  getI2VModelById,
  getModelById,
} from '@/packages/studio/src/models.js'
import {
  FACE_SWAP_MODEL,
  FULL_BODY_MODEL,
  DEFAULT_T2V_MODEL,
  DEFAULT_I2I_MODEL,
} from './modelCapabilityResolver'

/**
 * Defaults for the paths the personalization picks itself. Each must exist in
 * the registry the matching MuAPI call looks it up in (a model from the wrong
 * registry is sent with the wrong payload and fails or ignores the inputs).
 */
/** Edits the customer's source video (recreate/complete with a video). */
export const DEFAULT_V2V_EDIT_MODEL = 'kling-o1-video-edit'
/** Animates a still image (recreate/complete from a photo). */
export const DEFAULT_I2V_MODEL = 'kling-v2.1-pro-i2v'
/** Second choice when the first image-to-video model is unavailable. */
export const FALLBACK_I2V_MODEL = 'seedance-pro-i2v'

import type {
  PersonalizationSource,
  AssetLibrary,
  ResolvedAssets,
  GenerationOptions,
  VideoPersonalizationMode,
  ImagePersonalizationMode,
  GenerationResult,
  ImageStudioHandoff,
  VideoStudioHandoff,
} from './types'

export interface GenerationInput {
  source: PersonalizationSource
  client: any
  assets: AssetLibrary
  resolved: ResolvedAssets
  prompt: string
  mode: ImagePersonalizationMode | VideoPersonalizationMode | null
  options: GenerationOptions
  /** MuAPI key: video generation. */
  apiKey: string
  /** OpenAI key: image generation and editing (the visitor's own key). */
  openaiKey?: string
  onProgress?: (percent: number, message: string) => void
}

// ── Logging ──────────────────────────────────────────────────────────────────

function resolveModelId(
  source: PersonalizationSource,
  options: GenerationOptions,
  fallback: string,
): string {
  if (options.advancedModel) return options.advancedModel
  if (options.model) return options.model
  if (source.model) return source.model
  return fallback
}

function pickVideoModel(source: PersonalizationSource, options: GenerationOptions, mode: VideoPersonalizationMode): string {
  if (mode === 'face_only') return FACE_SWAP_MODEL
  if (mode === 'full_body') return FULL_BODY_MODEL
  return resolveModelId(source, options, DEFAULT_T2V_MODEL)
}

/** The chosen model when `lookup` knows it, otherwise `fallback`. */
function modelIn(lookup: (id: string) => unknown, chosen: string, fallback: string): string {
  return chosen && lookup(chosen) ? chosen : fallback
}

/** The output URL of a MuAPI prediction, whatever shape it came back in. */
function outputUrlOf(result: unknown): string {
  const r = result as { url?: string; output?: { url?: string }; outputs?: unknown[] } | null
  const first = r?.outputs?.[0]
  return r?.url || r?.output?.url || (typeof first === 'string' ? first : (first as { url?: string } | undefined)?.url) || ''
}

// ── Remote inputs ────────────────────────────────────────────────────────────

/**
 * MuAPI fetches every input URL from its own servers, so it can only use
 * public http(s) URLs. A demo video (`/media/...`), an uploaded file still in
 * the browser (`blob:`), inline data (`data:`) or anything served by this
 * page's own host (unreachable from outside while on localhost) is uploaded
 * to MuAPI first, and its hosted URL is used instead.
 */
export function needsUpload(url: string): boolean {
  if (!url) return false
  if (/^(blob:|data:)/i.test(url)) return true
  if (!/^https?:\/\//i.test(url)) return true
  if (typeof window !== 'undefined' && window.location?.origin) {
    try {
      return new URL(url).origin === window.location.origin
    } catch {
      return false
    }
  }
  return false
}

async function uploadForGeneration(url: string, apiKey: string, cache: Map<string, Promise<string>>): Promise<string> {
  if (!needsUpload(url)) return url
  const cached = cache.get(url)
  if (cached) return cached
  const promise = (async () => {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Could not read ${url} (HTTP ${response.status}).`)
    const blob = await response.blob()
    const name = url.split(/[?#]/)[0].split('/').pop() || 'input'
    const file = new File([blob], name, { type: blob.type || 'application/octet-stream' })
    const hosted = await uploadFile(apiKey, file)
    if (!hosted) throw new Error(`Upload of ${name} returned no URL.`)
    return hosted as string
  })()
  cache.set(url, promise)
  return promise
}

/** Source media and every direct input, with local URLs replaced by hosted ones. */
export async function prepareRemoteInputs(
  source: PersonalizationSource,
  resolved: ResolvedAssets,
  apiKey: string,
): Promise<{ source: PersonalizationSource; resolved: ResolvedAssets }> {
  const cache = new Map<string, Promise<string>>()
  const swap = (value: unknown): Promise<unknown> | unknown => {
    if (typeof value === 'string') return uploadForGeneration(value, apiKey, cache)
    if (Array.isArray(value)) return Promise.all(value.map((item) => (typeof item === 'string' ? uploadForGeneration(item, apiKey, cache) : item)))
    return value
  }
  const entries = await Promise.all(
    Object.entries(resolved.directInputs).map(async ([key, value]) => [key, await swap(value)] as const),
  )
  const sourceMedia = source.sourceMedia ? ((await swap(source.sourceMedia)) as string) : source.sourceMedia
  return {
    source: { ...source, sourceMedia },
    resolved: { ...resolved, directInputs: Object.fromEntries(entries) },
  }
}

// ── Error Handling ───────────────────────────────────────────────────────────

export function classifyMuApiError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Generation service unavailable'
  }

  const err = error as Record<string, unknown>
  const message = typeof err.message === 'string' ? err.message : String(error)
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('quota') || lowerMessage.includes('limit exceeded')) {
    return 'API quota exceeded. Please try again later.'
  }
  if (lowerMessage.includes('invalid api key') || lowerMessage.includes('unauthorized')) {
    return 'Invalid API key. Please check your configuration.'
  }
  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return 'Generation timed out. Please try again.'
  }
  if (lowerMessage.includes('content policy') || lowerMessage.includes('safety')) {
    return 'Content was blocked by safety filters. Please try a different prompt.'
  }
  if (lowerMessage.includes('model not found') || lowerMessage.includes('unsupported model')) {
    return 'Selected model is not available. Please try a different model.'
  }
  if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
    return 'Invalid request parameters. Please check your inputs.'
  }
  if (lowerMessage.includes('network') || lowerMessage.includes('econnreset') || lowerMessage.includes('enotfound')) {
    return 'Network error. Please check your connection and try again.'
  }
  if (lowerMessage.includes('payment') || lowerMessage.includes('billing')) {
    return 'Payment issue. Please check your billing settings.'
  }
  if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many requests')) {
    return 'Too many requests. Please wait a moment and try again.'
  }
  if (lowerMessage.includes('500') || lowerMessage.includes('internal server error')) {
    return 'Generation service encountered an error. Please try again.'
  }
  if (lowerMessage.includes('503') || lowerMessage.includes('service unavailable')) {
    return 'Generation service is temporarily unavailable. Please try again later.'
  }
  if (lowerMessage.includes('504') || lowerMessage.includes('gateway timeout')) {
    return 'Generation timed out. Please try again with a shorter video.'
  }

  return message.slice(0, 200)
}

export function wrapGenerationError(error: unknown, context: string): Error {
  const userMessage = classifyMuApiError(error)
  const originalMessage = error instanceof Error ? error.message : String(error)
  const wrapped = new Error(`${context}: ${userMessage}`)
  wrapped.cause = error
  ;(wrapped as any).originalMessage = originalMessage
  return wrapped
}

// ── Main Entry ───────────────────────────────────────────────────────────────

export async function runGeneration(input: GenerationInput): Promise<GenerationResult> {
  const { prompt, mode, options, apiKey, onProgress } = input

  onProgress?.(5, 'Preparing assets...')

  if (input.source.mediaType === 'prompt-only') {
    return { type: 'prompt', prompt }
  }

  if (input.source.mediaType === 'image') {
    // Images go to OpenAI, which reads the files from this browser directly.
    return handleImageGeneration({
      source: input.source,
      resolved: input.resolved,
      prompt,
      mode: mode as ImagePersonalizationMode | null,
      options,
      openaiKey: input.openaiKey || '',
      onProgress,
    })
  }

  // Local files (demo videos, browser uploads) are uploaded so MuAPI can read them.
  onProgress?.(8, 'Uploading your media...')
  const prepared = await prepareRemoteInputs(input.source, input.resolved, apiKey)
  const source = prepared.source
  const resolved = prepared.resolved

  return handleVideoGeneration({
    source,
    resolved,
    prompt,
    mode: mode as VideoPersonalizationMode | null,
    options,
    apiKey,
    onProgress,
  })
}

// ── Image Generation ─────────────────────────────────────────────────────────

export async function toImageBlob(url: string): Promise<Blob> {
  try {
    const res = await fetch(url)
    if (res.ok) return await res.blob()
  } catch {
    // A website image linked by its address usually refuses a cross-origin
    // fetch; read it through the same-origin download route instead.
  }
  try {
    const res = await fetch('/api/personalization/download-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ urls: [url] }),
      signal: AbortSignal.timeout(20_000),
    })
    const data = await res.json().catch(() => ({}))
    const dataUrl = data?.results?.[0]?.ok ? data.results[0].dataUrl : null
    if (res.ok && typeof dataUrl === 'string') return await (await fetch(dataUrl)).blob()
  } catch {
    // reported below
  }
  // Never substitute a blank image: the edit would silently lose the person
  // or product the user chose.
  throw new Error('The reference image could not be loaded. Try another image or upload your own.')
}

const ASPECT_RATIO_TO_SIZE: Record<string, string> = {
  '1:1': '1024x1024',
  '16:9': '1536x1024',
  '9:16': '1024x1536',
  '4:3': '1536x1024',
  '3:4': '1024x1536',
}

function mapAspectRatioToSize(ratio?: string): string {
  if (!ratio) return '1024x1024'
  return ASPECT_RATIO_TO_SIZE[ratio] || '1024x1024'
}

function extractOpenAIImageUrl(result?: { url?: string; b64_json?: string }): string {
  if (!result) return ''
  if (result.url) return result.url
  if (result.b64_json) return `data:image/png;base64,${result.b64_json}`
  return ''
}

/**
 * The OpenAI model to request, or undefined for the client's own default.
 * Ids from the MuAPI registry (e.g. `gpt-image-2-edit`) are not OpenAI model
 * names and used to be sent to OpenAI, which rejects them.
 */
function openAIImageModel(source: PersonalizationSource, options: GenerationOptions): string | undefined {
  const chosen = options.advancedModel || options.model || source.model || ''
  if (!chosen) return undefined
  if (getI2IModelById(chosen) || getModelById(chosen) || getVideoModelById(chosen) || getV2VModelById(chosen)) return undefined
  return chosen
}

async function handleImageGeneration({
  source,
  resolved,
  prompt,
  mode,
  options,
  openaiKey,
  onProgress,
}: {
  source: PersonalizationSource
  resolved: ResolvedAssets
  prompt: string
  mode: ImagePersonalizationMode | null
  options: GenerationOptions
  openaiKey: string
  onProgress?: (percent: number, message: string) => void
}): Promise<GenerationResult> {
  // Image personalization uses OpenAI with the visitor's OWN OpenAI key. It
  // used to be handed the MuAPI key, which OpenAI rejects.
  if (!openaiKey) throw new Error('Add your OpenAI key to personalize images with AI.')
  const openaiClient = createPersonalizationOpenAIClient(openaiKey)
  const model = openAIImageModel(source, options)
  const size = mapAspectRatioToSize(options.aspectRatio || source.aspectRatio)
  const sourceImage = source.sourceMedia || ''
  // The customer's reference photo (face, person or first frame).
  const reference = (resolved.directInputs.image_url as string) || ''

  try {
    const editsOriginal = mode === 'keep_design' || mode === 'replace_face' || mode === 'replace_person'
    // recreate/complete make a NEW image from the prompt, as before.
    if (editsOriginal) {
      // Edit the ORIGINAL image. The reference photo goes along as a second
      // image so the model knows whose face/person to use. (replace_face and
      // replace_person used to edit the reference photo itself.)
      const imageUrl = sourceImage || reference
      if (!imageUrl) throw new Error('No source image available for image personalization.')
      onProgress?.(15, 'Uploading reference image...')
      const imageBlob = await toImageBlob(imageUrl)
      const references = reference && reference !== imageUrl ? [await toImageBlob(reference)] : []
      const results = await openaiClient.editImage({
        prompt,
        image: imageBlob,
        references,
        model,
        size,
        quality: options.quality,
        background: 'auto',
        inputFidelity: 'high',
      })
      onProgress?.(90, 'Finalizing image...')
      return {
        type: 'image',
        url: extractOpenAIImageUrl(results[0]),
        metadata: { model: model || 'openai-default', mode, postProcessing: resolved.postProcessing },
      }
    }

    onProgress?.(15, 'Generating personalized image...')
    const results = await openaiClient.generateImage({ prompt, model, size, quality: options.quality })
    onProgress?.(90, 'Finalizing image...')
    return {
      type: 'image',
      url: extractOpenAIImageUrl(results[0]),
      metadata: { model: model || 'openai-default', mode, postProcessing: resolved.postProcessing },
    }
  } catch (error) {
    throw wrapGenerationError(error, `Image generation failed (${model || 'OpenAI'})`)
  }
}

// ── Video Generation ─────────────────────────────────────────────────────────

async function handleVideoGeneration({
  source,
  resolved,
  prompt,
  mode,
  options,
  apiKey,
  onProgress,
}: {
  source: PersonalizationSource
  resolved: ResolvedAssets
  prompt: string
  mode: VideoPersonalizationMode | null
  options: GenerationOptions
  apiKey: string
  onProgress?: (percent: number, message: string) => void
}): Promise<GenerationResult> {
  const videoModel = pickVideoModel(source, options, mode || 'recreate')

  try {
    if (mode === 'face_only') {
      onProgress?.(20, 'Preparing face swap...')
      const videoUrl = (resolved.directInputs.video_url as string) || source.sourceMedia || ''
      if (!videoUrl) throw new Error('No source video available for face swap.')

      const identityUrl = resolved.directInputs.image_url as string | undefined
      if (!identityUrl) throw new Error('No identity image provided for face swap.')

      const result = await processV2V(apiKey, {
        model: videoModel,
        video_url: videoUrl,
        image_url: identityUrl,
        prompt: options.preserveAudio ? undefined : prompt,
        aspect_ratio: options.aspectRatio || source.aspectRatio,
      })

      onProgress?.(85, 'Processing face swap...')
      const outputUrl = outputUrlOf(result)
      return {
        type: 'video',
        url: outputUrl,
        metadata: { model: videoModel, mode: mode || 'face_only', postProcessing: resolved.postProcessing },
      }
    }

    if (mode === 'full_body') {
      onProgress?.(20, 'Preparing full presenter replacement...')
      const videoUrl = (resolved.directInputs.video_url as string) || source.sourceMedia || ''
      if (!videoUrl) throw new Error('No source video available.')

      const identityUrl = resolved.directInputs.image_url as string | undefined
      if (!identityUrl) throw new Error('No identity image provided for full presenter replacement.')

      const result = await processRecast(apiKey, {
        model: videoModel,
        video_url: videoUrl,
        image_url: identityUrl,
        prompt: options.preserveAudio ? undefined : prompt,
        aspect_ratio: options.aspectRatio || source.aspectRatio,
      })

      onProgress?.(85, 'Processing...')
      const outputUrl = outputUrlOf(result)
      return {
        type: 'video',
        url: outputUrl,
        metadata: { model: videoModel, mode: mode || 'full_body', postProcessing: resolved.postProcessing },
      }
    }

    onProgress?.(20, 'Submitting video generation...')
    const directInputs = resolved.directInputs
    const imageUrl = directInputs.image_url as string | undefined
    const sourceVideo = (directInputs.video_url as string | undefined) || ''
    const references = Array.from(
      new Set([imageUrl, ...((directInputs.images_list as string[] | undefined) || [])].filter(Boolean) as string[]),
    )
    const aspectRatio = options.aspectRatio || source.aspectRatio || '16:9'

    // Recreate/complete WITH a source video: edit that video (video-to-video).
    // A demo's own model is usually a video-edit model; it used to be sent to
    // the text-to-video call, which does not know it and drops the video.
    if (sourceVideo) {
      const editModel = modelIn(getV2VModelById, videoModel, DEFAULT_V2V_EDIT_MODEL)
      const result = await processV2V(apiKey, {
        model: editModel,
        prompt,
        video_url: sourceVideo,
        images_list: references.length > 0 ? references : undefined,
        aspect_ratio: aspectRatio,
        keep_original_sound: options.preserveAudio,
      })
      onProgress?.(85, 'Processing video...')
      return {
        type: 'video',
        url: outputUrlOf(result),
        metadata: { model: editModel, mode: mode || 'recreate', postProcessing: resolved.postProcessing },
      }
    }

    // From a photo: animate it (image-to-video), with a second model to fall back on.
    if (imageUrl) {
      const firstChoice = modelIn(getI2VModelById, videoModel, DEFAULT_I2V_MODEL)
      const runI2V = (model: string) =>
        generateI2V(apiKey, {
          model,
          prompt,
          aspect_ratio: aspectRatio,
          duration: options.duration || source.duration,
          resolution: options.resolution,
          quality: options.quality,
          image_url: imageUrl,
          images_list: directInputs.images_list as string[] | undefined,
          last_image: directInputs.last_image_url as string | undefined,
        })
      let usedModel = firstChoice
      let i2vResult: unknown
      try {
        i2vResult = await runI2V(firstChoice)
      } catch (error) {
        const fallbackModel = firstChoice === FALLBACK_I2V_MODEL ? DEFAULT_I2V_MODEL : FALLBACK_I2V_MODEL
        onProgress?.(50, 'Primary model unavailable, trying fallback...')
        try {
          i2vResult = await runI2V(fallbackModel)
          usedModel = fallbackModel
        } catch {
          throw wrapGenerationError(error, `Video generation failed (${firstChoice})`)
        }
      }
      onProgress?.(85, 'Processing video...')
      return {
        type: 'video',
        url: outputUrlOf(i2vResult),
        metadata: { model: usedModel, mode: mode || 'recreate', postProcessing: resolved.postProcessing },
      }
    }

    // Nothing to start from: text-to-video from the prompt.
    const textModel = modelIn(getVideoModelById, videoModel, DEFAULT_T2V_MODEL)
    const result = await generateVideo(apiKey, {
      model: textModel,
      prompt,
      aspect_ratio: aspectRatio,
      duration: options.duration || source.duration,
      resolution: options.resolution,
      quality: options.quality,
    } as any)

    onProgress?.(85, 'Processing video...')
    return {
      type: 'video',
      url: outputUrlOf(result),
      metadata: { model: textModel, mode: mode || 'recreate', postProcessing: resolved.postProcessing },
    }
  } catch (error) {
    throw wrapGenerationError(error, `Video generation failed (${videoModel})`)
  }
}

// ── Studio Handoffs ──────────────────────────────────────────────────────────

export function buildImageStudioHandoff(
  result: GenerationResult,
  project: {
    source: PersonalizationSource
    client: { id?: string }
    assets: AssetLibrary
    mode?: string | null
    personalizedPrompt?: string
  },
): ImageStudioHandoff {
  return {
    source: 'demo-personalization',
    sourceType: project.source.sourceType,
    imageUrl: result.url || '',
    originalImageUrl: project.source.sourceMedia || undefined,
    clientId: project.client.id,
    personalizedPrompt: project.personalizedPrompt,
    referenceAssets: [...project.assets.identities, ...project.assets.products],
    personalizationMode: project.mode || undefined,
    createdAt: new Date().toISOString(),
  }
}

export function buildVideoStudioHandoff(
  result: GenerationResult,
  project: {
    source: PersonalizationSource
    client: { id?: string }
    assets: AssetLibrary
    mode?: string | null
    personalizedPrompt?: string
  },
): VideoStudioHandoff {
  return {
    source: 'demo-personalization',
    sourceType: project.source.sourceType,
    videoUrl: result.url || '',
    originalVideoUrl: project.source.sourceMedia || undefined,
    clientId: project.client.id,
    identityAssetIds: project.assets.identities.map((i) => i.id),
    personalizationMode: project.mode || undefined,
    personalizedPrompt: project.personalizedPrompt,
    model: (result.metadata?.model as string) || project.source.model,
    createdAt: new Date().toISOString(),
  }
}
