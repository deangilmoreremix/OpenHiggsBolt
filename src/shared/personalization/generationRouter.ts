/**
 * Generation Router
 *
 * Routes personalization generation to the correct MuAPI function.
 */

import {
  generateImage,
  generateI2I,
  generateVideo,
  generateI2V,
  processRecast,
  processV2V,
  processLipSync,
  uploadFile,
} from '@/packages/studio/src/muapi'
import {
  getV2VModelById,
  getRecastModelById,
  getVideoModelById,
  getI2IModelById,
} from '@/packages/studio/src/models.js'
import {
  FACE_SWAP_MODEL,
  FULL_BODY_MODEL,
  DEFAULT_T2V_MODEL,
  DEFAULT_I2I_MODEL,
} from './modelCapabilityResolver'
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
  apiKey: string
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

function pickImageModel(source: PersonalizationSource, options: GenerationOptions, mode: ImagePersonalizationMode): string {
  return resolveModelId(source, options, DEFAULT_I2I_MODEL)
}

// ── Logging ──────────────────────────────────────────────────────────────────

function logPersonalizationApi(_phase: string, _data: Record<string, unknown>) {
  // Debug logging removed for production
}

// ── Main Entry ───────────────────────────────────────────────────────────────

export async function runGeneration(input: GenerationInput): Promise<GenerationResult> {
  const { source, resolved, prompt, mode, options, apiKey, onProgress } = input

  logPersonalizationApi('Generation start', {
    sourceType: source.sourceType,
    mediaType: source.mediaType,
    mode,
    outputType: source.mediaType === 'image' ? 'image' : 'video',
  })

  onProgress?.(5, 'Preparing assets...')

  if (source.mediaType === 'prompt-only') {
    logPersonalizationApi('Prompt-only result', { prompt })
    return { type: 'prompt', prompt }
  }

  if (source.mediaType === 'image') {
    return handleImageGeneration({
      source,
      resolved,
      prompt,
      mode: mode as ImagePersonalizationMode | null,
      options,
      apiKey,
      onProgress,
    })
  }

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

async function handleImageGeneration({
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
  mode: any
  options: GenerationOptions
  apiKey: string
  onProgress?: (percent: number, message: string) => void
}): Promise<GenerationResult> {
  const imageModel = pickImageModel(source, options, mode || 'recreate')

  logPersonalizationApi('Image generation model', {
    model: imageModel,
    mode,
    imageUrl: resolved.directInputs.image_url,
    imagesList: resolved.directInputs.images_list,
  })

  if (mode === 'keep_design' || mode === 'replace_face' || mode === 'replace_person') {
    onProgress?.(15, 'Uploading reference image...')
    const imageUrl = (resolved.directInputs.image_url as string) || source.sourceMedia || ''
    if (!imageUrl) throw new Error('No source image available for image personalization.')

    logPersonalizationApi('I2I submit', {
      model: imageModel,
      imageUrl,
      aspectRatio: source.aspectRatio,
    })

    const result = await generateI2I(apiKey, {
      model: imageModel,
      prompt,
      image_url: imageUrl,
      images_list: resolved.directInputs.images_list as string[] | undefined,
      aspect_ratio: options.aspectRatio || source.aspectRatio || '1:1',
      quality: options.quality,
      resolution: options.resolution,
    })

    onProgress?.(90, 'Finalizing image...')
    const outputUrl = (result as any).url || (result as any).output?.url || (result as any).outputs?.[0]
    logPersonalizationApi('I2I result', { outputUrl, model: imageModel })
    return {
      type: 'image',
      url: outputUrl,
      metadata: { model: imageModel, mode, postProcessing: resolved.postProcessing },
    }
  }

  // recreate or complete
  onProgress?.(15, 'Generating personalized image...')
  logPersonalizationApi('T2I submit', {
    model: imageModel,
    prompt: prompt.slice(0, 100),
    aspectRatio: source.aspectRatio,
    imageUrl: resolved.directInputs.image_url,
    imagesList: resolved.directInputs.images_list,
  })

  const result = await generateImage(apiKey, {
    model: imageModel,
    prompt,
    aspect_ratio: options.aspectRatio || source.aspectRatio || '1:1',
    quality: options.quality,
    resolution: options.resolution,
    image_url: resolved.directInputs.image_url as string | undefined,
    images_list: resolved.directInputs.images_list as string[] | undefined,
  })

  onProgress?.(90, 'Finalizing image...')
  const outputUrl = (result as any).url || (result as any).output?.url || (result as any).outputs?.[0]
  logPersonalizationApi('T2I result', { outputUrl, model: imageModel })
  return {
    type: 'image',
    url: outputUrl,
    metadata: { model: imageModel, mode, postProcessing: resolved.postProcessing },
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
  mode: any
  options: GenerationOptions
  apiKey: string
  onProgress?: (percent: number, message: string) => void
}): Promise<GenerationResult> {
  const videoModel = pickVideoModel(source, options, mode || 'recreate')

  // Face-only: use V2V face swap model (ai-video-face-swap)
  if (mode === 'face_only') {
    onProgress?.(20, 'Preparing face swap...')
    const videoUrl = (resolved.directInputs.video_url as string) || source.sourceMedia || ''
    if (!videoUrl) throw new Error('No source video available for face swap.')

    const identityUrl = resolved.directInputs.image_url as string | undefined
    if (!identityUrl) throw new Error('No identity image provided for face swap.')

    logPersonalizationApi('V2V face-swap submit', {
      model: videoModel,
      videoUrl,
      imageUrl: identityUrl,
    })

    // ai-video-face-swap lives in v2vModels, so use processV2V
    const result = await processV2V(apiKey, {
      model: videoModel,
      video_url: videoUrl,
      image_url: identityUrl,
      prompt: options.preserveAudio ? undefined : prompt,
      aspect_ratio: options.aspectRatio || source.aspectRatio,
    })

    onProgress?.(85, 'Processing face swap...')
    const outputUrl = (result as any).url || (result as any).output?.url || (result as any).outputs?.[0]
    logPersonalizationApi('V2V face-swap result', { outputUrl, model: videoModel })
    return {
      type: 'video',
      url: outputUrl,
      metadata: { model: videoModel, mode: mode || 'face_only', postProcessing: resolved.postProcessing },
    }
  }

  // Full presenter / body replacement: use recast model
  if (mode === 'full_body') {
    onProgress?.(20, 'Preparing full presenter replacement...')
    const videoUrl = (resolved.directInputs.video_url as string) || source.sourceMedia || ''
    if (!videoUrl) throw new Error('No source video available.')

    const identityUrl = resolved.directInputs.image_url as string | undefined
    if (!identityUrl) throw new Error('No identity image provided for full presenter replacement.')

    logPersonalizationApi('Recast submit', {
      model: videoModel,
      videoUrl,
      imageUrl: identityUrl,
    })

    const result = await processRecast(apiKey, {
      model: videoModel,
      video_url: videoUrl,
      image_url: identityUrl,
      prompt: options.preserveAudio ? undefined : prompt,
      aspect_ratio: options.aspectRatio || source.aspectRatio,
    })

    onProgress?.(85, 'Processing...')
    const outputUrl = (result as any).url || (result as any).output?.url || (result as any).outputs?.[0]
    logPersonalizationApi('Recast result', { outputUrl, model: videoModel })
    return {
      type: 'video',
      url: outputUrl,
      metadata: { model: videoModel, mode: mode || 'full_body', postProcessing: resolved.postProcessing },
    }
  }

  // Recreate or complete: use video generation (T2V or I2V)
  onProgress?.(20, 'Submitting video generation...')
  const directInputs = resolved.directInputs
  const imageUrl = directInputs.image_url as string | undefined
  const videoUrl = directInputs.video_url as string | undefined

  logPersonalizationApi('Video generation submit', {
    model: videoModel,
    prompt: prompt.slice(0, 100),
    aspectRatio: source.aspectRatio,
    duration: source.duration,
    hasImage: Boolean(imageUrl),
    hasVideo: Boolean(videoUrl),
    firstFrame: directInputs.first_image_url || directInputs.image_url,
    lastFrame: directInputs.last_image_url,
  })

  // If we have an image but no video, use I2V
  if (imageUrl && !videoUrl) {
    const i2vResult = await generateI2V(apiKey, {
      model: videoModel,
      prompt,
      aspect_ratio: options.aspectRatio || source.aspectRatio || '16:9',
      duration: options.duration || source.duration,
      resolution: options.resolution,
      quality: options.quality,
      image_url: imageUrl,
      images_list: directInputs.images_list as string[] | undefined,
      last_image: directInputs.last_image_url as string | undefined,
    })

    onProgress?.(85, 'Processing video...')
    const outputUrl = (i2vResult as any).url || (i2vResult as any).output?.url || (i2vResult as any).outputs?.[0]
    logPersonalizationApi('I2V result', { outputUrl, model: videoModel })
    return {
      type: 'video',
      url: outputUrl,
      metadata: { model: videoModel, mode: mode || 'recreate', postProcessing: resolved.postProcessing },
    }
  }

  // Otherwise use generateVideo (supports video-to-video)
  const result = await generateVideo(apiKey, {
    model: videoModel,
    prompt,
    aspect_ratio: options.aspectRatio || source.aspectRatio || '16:9',
    duration: options.duration || source.duration,
    resolution: options.resolution,
    quality: options.quality,
    mode: 'v2v',
    ...directInputs,
  } as any)

  onProgress?.(85, 'Processing video...')
  const outputUrl = (result as any).url || (result as any).output?.url || (result as any).outputs?.[0]
  logPersonalizationApi('Video generation result', { outputUrl, model: videoModel })
  return {
    type: 'video',
    url: outputUrl,
    metadata: { model: videoModel, mode: mode || 'recreate', postProcessing: resolved.postProcessing },
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
