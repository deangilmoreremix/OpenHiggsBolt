import type {
  DiscoveredAssetCategory,
  PersonalizationVisionAnalysis,
  PersonalizationVisionValidation,
} from '../types'

export type VisionAnalyzeInput = {
  id: string
  imageUrl: string
  categoryHint?: DiscoveredAssetCategory
  roleHint?: string
}

export type VisionBusinessContext = {
  businessName?: string
  industry?: string
  productService?: string
  brandDescription?: string
}

export async function analyzePersonalizationImages(params: {
  images: VisionAnalyzeInput[]
  businessContext?: VisionBusinessContext
  targetVideoFormat?: string
}): Promise<PersonalizationVisionAnalysis[]> {
  const response = await fetch('/api/personalization/image-analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({
      mode: 'analyze',
      images: params.images,
      businessContext: params.businessContext,
      targetVideoFormat: params.targetVideoFormat,
    }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'SmartVideo GO Vision analysis failed')
  }

  return Array.isArray(payload?.analyses) ? payload.analyses : []
}

export async function validatePersonalizationImageEdit(params: {
  originalImageUrl: string
  editedImageUrl: string
  preserve?: string[]
  intendedOperation?: string
  businessContext?: Pick<VisionBusinessContext, 'businessName' | 'industry'>
}): Promise<PersonalizationVisionValidation> {
  const response = await fetch('/api/personalization/image-analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({
      mode: 'validate',
      ...params,
    }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'SmartVideo GO Vision validation failed')
  }
  if (!payload?.validation) throw new Error('SmartVideo GO Vision returned no validation result.')
  return payload.validation as PersonalizationVisionValidation
}

export type ResponsesSmartEditResult = {
  imageDataUrl: string
  responseId: string | null
  imageGenerationCallId: string | null
  revisedPrompt: string | null
  model: 'gpt-image-2.5-flare' | 'gpt-image-2.5-sunburst'
  orchestratorModel?: string
  usage?: unknown
  outputFormat?: 'png' | 'jpeg' | 'webp'
  outputCompression?: number | null
}

export async function responsesSmartEdit(params: {
  imageUrl?: string
  referenceImages?: string[]
  prompt: string
  previousResponseId?: string
  imageModel: 'gpt-image-2.5-flare' | 'gpt-image-2.5-sunburst'
  action?: 'auto' | 'edit' | 'generate'
  quality?: 'low' | 'medium' | 'high' | 'xhigh' | 'max' | 'auto'
  size?: string
  background?: 'transparent' | 'opaque' | 'auto'
  inputFidelity?: 'high' | 'low'
  outputFormat?: 'png' | 'jpeg' | 'webp'
  outputCompression?: number
  businessContext?: VisionBusinessContext & {
    targetRole?: string
    preserve?: string[]
  }
}): Promise<ResponsesSmartEditResult> {
  const response = await fetch('/api/personalization/image-smart-edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(params),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'SmartVideo GO Smart Edit failed')
  }
  if (!payload?.imageDataUrl) throw new Error('SmartVideo GO Smart Edit returned no image.')

  return payload as ResponsesSmartEditResult
}
