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

function pickVideoModel(source: PersonalizationSource, options: GenerationOptions, mode: VideoPersonalizationMode): string {
  if (options.advancedModel) return options.advancedModel
  if (options.model) return options.model
  if (source.model) return source.model
  if (mode === 'face_only') return 'wan-replace-face'
  if (mode === 'full_body') return 'recast'
  if (mode === 'recreate') return 'seedance-2.5'
  return 'seedance-2.5'
}

function pickImageModel(source: PersonalizationSource, options: GenerationOptions, mode: ImagePersonalizationMode): string {
  if (options.advancedModel) return options.advancedModel
  if (options.model) return options.model
  if (source.model) return source.model
  return 'gpt-image-2'
}

export async function runGeneration(input: GenerationInput): Promise<GenerationResult> {
  const { source, resolved, prompt, mode, options, apiKey, onProgress } = input

  onProgress?.(5, 'Preparing assets...')

  if (source.mediaType === 'prompt-only') {
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

  if (mode === 'keep_design' || mode === 'replace_face' || mode === 'replace_person') {
    onProgress?.(15, 'Uploading reference image...')
    const imageUrl = (resolved.directInputs.image_url as string) || source.sourceMedia || ''
    if (!imageUrl) throw new Error('No source image available for image personalization.')

    const result = await generateI2I(apiKey, {
      model: imageModel,
      prompt,
      image_url: imageUrl,
      images_list: resolved.directInputs.images_list as string[] | undefined,
      aspect_ratio: source.aspectRatio || '1:1',
      quality: options.quality,
      resolution: options.resolution,
    })

    onProgress?.(90, 'Finalizing image...')
    const outputUrl = (result as any).url || (result as any).output?.url || (result as any).outputs?.[0]
    return { type: 'image', url: outputUrl, metadata: { model: imageModel, mode } }
  }

  // recreate or complete
  onProgress?.(15, 'Generating personalized image...')
  const result = await generateImage(apiKey, {
    model: imageModel,
    prompt,
    aspect_ratio: source.aspectRatio || '1:1',
    quality: options.quality,
    resolution: options.resolution,
    image_url: resolved.directInputs.image_url as string | undefined,
    images_list: resolved.directInputs.images_list as string[] | undefined,
  })

  onProgress?.(90, 'Finalizing image...')
  const outputUrl = (result as any).url || (result as any).output?.url || (result as any).outputs?.[0]
  return { type: 'image', url: outputUrl, metadata: { model: imageModel, mode } }
}

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

  if (mode === 'face_only' || mode === 'full_body') {
    onProgress?.(20, mode === 'face_only' ? 'Preparing face swap...' : 'Preparing full presenter replacement...')
    const videoUrl = (resolved.directInputs.video_url as string) || source.sourceMedia || ''
    if (!videoUrl) throw new Error('No source video available.')

    const result = await processRecast(apiKey, {
      model: videoModel,
      video_url: videoUrl,
      image_url: resolved.directInputs.image_url as string | undefined,
      prompt: options.preserveAudio ? undefined : prompt,
      aspect_ratio: source.aspectRatio,
    })

    onProgress?.(85, 'Processing...')
    const outputUrl = (result as any).url || (result as any).output?.url || (result as any).outputs?.[0]
    return { type: 'video', url: outputUrl, metadata: { model: videoModel, mode: mode || 'face_only' } }
  }

  // recreate or complete
  onProgress?.(20, 'Submitting video generation...')
  const directInputs = resolved.directInputs
  const result = await generateVideo(apiKey, {
    model: videoModel,
    prompt,
    aspect_ratio: source.aspectRatio || '16:9',
    duration: source.duration,
    resolution: options.resolution,
    quality: options.quality,
    mode: 'v2v',
    ...directInputs,
  } as any)

  onProgress?.(85, 'Processing video...')
  const outputUrl = (result as any).url || (result as any).output?.url || (result as any).outputs?.[0]
  return { type: 'video', url: outputUrl, metadata: { model: videoModel, mode: mode || 'recreate' } }
}

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
