/**
 * Model Capability Resolver for Personalization
 */

import type {
  PersonalizationSource,
  AssetLibrary,
  VideoPersonalizationMode,
  ImagePersonalizationMode,
  ResolvedAssets,
  PersonalizationAsset,
  GenerationOptions,
} from './types'
import { getGenerationAssetUrl } from './DemoPersonalizeProvider'

export interface ModelCapabilities {
  supportsFaceSwap: boolean
  supportsPersonReplacement: boolean
  supportsI2I: boolean
  supportsT2V: boolean
  supportsV2V: boolean
  supportsRecast: boolean
  supportsLipSync: boolean
  maxImages: number
  maxVideos: number
  imageField: string
  videoField: string
  supportsLastFrame: boolean
  supportsFirstFrame: boolean
  supportsAudioPreservation: boolean
  hasPrompt: boolean
}

export function resolveModelCapabilities(
  source: PersonalizationSource,
  options: GenerationOptions,
): ModelCapabilities {
  const modelId = options.advancedModel || options.model || source.model || ''
  const lower = modelId.toLowerCase()

  return {
    supportsFaceSwap:
      /face.?swap|face.?replace|swap|reface|deep.?face/.test(lower) ||
      lower.includes('wan') ||
      lower.includes('seedance'),
    supportsPersonReplacement:
      /recast|replace|person|character|swap/.test(lower) ||
      lower.includes('wan'),
    supportsI2I: /i2i|image.?to.?image|flux|midjourney|gpt.?image|ideogram|seedream/.test(lower),
    supportsT2V: !source.sourceMedia && /seedance|kling|runway|veo/.test(lower),
    supportsV2V: /v2v|video.?to.?video|seedance|kling|runway|veo/.test(lower),
    supportsRecast: /recast/.test(lower),
    supportsLipSync: /lipsync|lip.?sync/.test(lower),
    maxImages: 4,
    maxVideos: 1,
    imageField: 'image_url',
    videoField: 'video_url',
    supportsLastFrame: /wan|kling|runway|seedance/.test(lower),
    supportsFirstFrame: /wan|kling|runway|seedance/.test(lower),
    supportsAudioPreservation: /v2v|recast/.test(lower),
    hasPrompt: true,
  }
}

export function resolveAssetsForModel(
  source: PersonalizationSource,
  assets: AssetLibrary,
  mode: string | null,
  options: GenerationOptions,
  capabilities: ModelCapabilities,
): ResolvedAssets {
  const directInputs: Record<string, unknown> = {}
  const promptContext: Record<string, string> = {}
  const preProcessing: Record<string, unknown> = {}
  const postProcessing: Record<string, unknown> = {}

  // Client context
  if (assets.primaryIdentity) {
    promptContext.presenterName = assets.primaryIdentity.name
  }
  const primaryLogoUrl = getGenerationAssetUrl(assets.primaryLogo)
  if (primaryLogoUrl) {
    postProcessing.logo = primaryLogoUrl
  }
  if (assets.products.length > 0) {
    promptContext.productService = assets.products.map((p) => p.name).join(', ')
  }
  if (assets.brandReferences.length > 0) {
    promptContext.brandContext = assets.brandReferences.map((b) => b.name).join(', ')
  }
  const ctaUrl = getGenerationAssetUrl(assets.ctaGraphic)
  if (ctaUrl) {
    postProcessing.ctaGraphic = ctaUrl
  }

  // First frame handling
  const firstFrameUrl = getGenerationAssetUrl(assets.firstFrame)
  if (firstFrameUrl && capabilities.supportsFirstFrame) {
    if (source.mediaType === 'video') {
      directInputs.first_image_url = firstFrameUrl
    } else {
      directInputs.image_url = firstFrameUrl
    }
  } else if (assets.firstFrame) {
    promptContext.firstFrameDescription = `Opening with ${assets.firstFrame.name}`
  }

  // Last frame / CTA handling
  const lastFrameUrl = getGenerationAssetUrl(assets.lastFrame)
  if (lastFrameUrl && capabilities.supportsLastFrame) {
    directInputs.last_image_url = lastFrameUrl
  } else if (assets.lastFrame || assets.ctaGraphic) {
    const endUrl = lastFrameUrl || ctaUrl
    if (endUrl) {
      postProcessing.endCard = endUrl
    }
  }

  // Identity routing
  const primaryIdentityUrl = getGenerationAssetUrl(assets.primaryIdentity)
  if (mode === 'face_only' || mode === 'replace_face') {
    if (capabilities.supportsFaceSwap && primaryIdentityUrl) {
      directInputs.image_url = primaryIdentityUrl
    } else if (assets.primaryIdentity) {
      promptContext.presenterDescription = assets.primaryIdentity.name
    }
  } else if (mode === 'full_body' || mode === 'replace_person') {
    if ((capabilities.supportsPersonReplacement || capabilities.supportsI2I) && primaryIdentityUrl) {
      directInputs.image_url = primaryIdentityUrl
    } else if (assets.primaryIdentity) {
      promptContext.presenterDescription = assets.primaryIdentity.name
    }
  } else if (mode === 'recreate' || mode === 'complete') {
    if (primaryIdentityUrl && capabilities.supportsI2I) {
      directInputs.image_url = primaryIdentityUrl
    }
    if (capabilities.maxImages > 1 && assets.identities.length > 1) {
      const identityUrls = assets.identities.slice(0, capabilities.maxImages).map((i) => getGenerationAssetUrl(i)).filter(Boolean)
      if (identityUrls.length > 1) {
        directInputs.images_list = identityUrls
      }
    }
    if (assets.products.length > 0 && capabilities.maxImages <= 1) {
      promptContext.productReferences = assets.products.slice(0, 3).map((p) => p.name).join(', ')
    }
  } else if (mode === 'keep_design') {
    if (source.sourceMedia) {
      directInputs.image_url = source.sourceMedia
    }
  }

  // Logo: always post-processing for exactness
  if (primaryLogoUrl) {
    postProcessing.logo = primaryLogoUrl
  }

  // Source media for video modes
  if (source.mediaType === 'video' && source.sourceMedia && !directInputs.video_url) {
    if (mode !== 'keep_design') {
      directInputs.video_url = source.sourceMedia
    }
  }

  // Unused assets
  const usedUrls = new Set(
    Object.values(directInputs)
      .filter(Boolean)
      .map(String),
  )

  const allAssets: PersonalizationAsset[] = [
    ...assets.identities,
    ...assets.logos,
    ...assets.products,
    ...assets.brandReferences,
    assets.firstFrame,
    assets.lastFrame,
    assets.ctaGraphic,
    ...assets.savedReferences,
  ].filter(Boolean) as PersonalizationAsset[]

  const unused: PersonalizationAsset[] = []
  for (const asset of allAssets) {
    const genUrl = getGenerationAssetUrl(asset)
    if (!genUrl || !usedUrls.has(genUrl)) {
      unused.push(asset)
    }
  }

  return {
    directInputs,
    promptContext,
    preProcessing,
    postProcessing,
    unusedSavedReferences: unused,
  }
}
