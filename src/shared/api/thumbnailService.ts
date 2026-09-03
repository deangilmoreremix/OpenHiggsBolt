function getSupabaseUrl(): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  }
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_SUPABASE_URL
  }
  return undefined
}

const SUPABASE_URL = getSupabaseUrl()

async function postToEdgeFunction(url: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `Thumbnail service error: ${response.status}`)
  }

  return response.json() as Promise<Record<string, unknown>>
}

export interface ThumbnailGenerateParams {
  prompt: string
  model?: string
  aspectRatio?: string
  n?: number
  imageUrl?: string
  strength?: number
  headline?: string
  subheadline?: string
  templateId?: string
  templateValues?: Record<string, any>
  referenceUrls?: string[]
  style?: string
  quality?: 'low' | 'medium' | 'high'
}

export interface ThumbnailGenerateResult {
  url: string
  responseId?: string
  revisedPrompt?: string
  templateId?: string
  aspectRatio?: string
}

export interface ThumbnailRefineParams {
  imageUrl: string
  prompt: string
  model?: string
  aspectRatio?: string
  n?: number
  strength?: number
}

export interface ThumbnailRefineResult {
  url: string
  responseId?: string
  revisedPrompt?: string
}

/**
 * Generate thumbnail(s) via the server-side proxy.
 * The client never receives or persists raw API keys.
 */
export async function generateThumbnail(params: ThumbnailGenerateParams): Promise<ThumbnailGenerateResult[]> {
  const body: Record<string, unknown> = {
    action: 'generate',
    prompt: params.prompt,
    model: params.model || 'gpt-image-2',
    aspect_ratio: params.aspectRatio || '16:9',
    n: Math.min(Math.max(params.n || 1, 1), 4),
    headline: params.headline || '',
    subheadline: params.subheadline || '',
    style: params.style || 'vibrant',
    quality: params.quality || 'medium',
    ...(params.templateId ? { template_id: params.templateId, template_values: params.templateValues || {} } : {}),
    ...(params.referenceUrls?.length ? { reference_urls: params.referenceUrls } : {}),
  }

  if (params.imageUrl) {
    body.image_url = params.imageUrl
    body.strength = params.strength ?? 0.6
  }

  const data = await postToEdgeFunction('/api/proxy/thumbnail-generate', body)

  const results: ThumbnailGenerateResult[] = []
  const urls = data.urls || data.images || data.outputs || []
  const urlArray = Array.isArray(urls) ? urls : [urls].filter(Boolean)

  urlArray.forEach((u: unknown, i: number) => {
    if (typeof u === 'string' && (u.startsWith('http') || u.startsWith('data:image'))) {
      results.push({
        url: u,
        responseId: typeof data.request_id === 'string' ? `${data.request_id}-${i}` : undefined,
        revisedPrompt: typeof data.revised_prompt === 'string' ? data.revised_prompt : undefined,
        templateId: params.templateId,
        aspectRatio: params.aspectRatio,
      })
    } else if (u && typeof u === 'object' && 'url' in u && typeof (u as { url?: unknown }).url === 'string') {
      results.push({
        url: (u as { url: string }).url,
        responseId: (u as { response_id?: string }).response_id,
        revisedPrompt: (u as { revised_prompt?: string }).revised_prompt,
        templateId: params.templateId,
        aspectRatio: params.aspectRatio,
      })
    }
  })

  return results
}

/**
 * Refine an existing thumbnail image via the server-side proxy.
 */
export async function refineThumbnail(params: ThumbnailRefineParams): Promise<ThumbnailRefineResult[]> {
  const body: Record<string, unknown> = {
    action: 'refine',
    image_url: params.imageUrl,
    prompt: params.prompt,
    model: params.model || 'gpt-image-2',
    aspect_ratio: params.aspectRatio || '16:9',
    n: Math.min(Math.max(params.n || 1, 1), 4),
    strength: params.strength ?? 0.5,
  }

  const data = await postToEdgeFunction('/api/proxy/thumbnail-generate', body)

  const results: ThumbnailRefineResult[] = []
  const urls = data.urls || data.images || data.outputs || []
  const urlArray = Array.isArray(urls) ? urls : [urls].filter(Boolean)

  urlArray.forEach((u: unknown, i: number) => {
    if (typeof u === 'string' && (u.startsWith('http') || u.startsWith('data:image'))) {
      results.push({
        url: u,
        responseId: typeof data.request_id === 'string' ? `${data.request_id}-${i}` : undefined,
        revisedPrompt: typeof data.revised_prompt === 'string' ? data.revised_prompt : undefined,
      })
    } else if (u && typeof u === 'object' && 'url' in u && typeof (u as { url?: unknown }).url === 'string') {
      results.push({
        url: (u as { url: string }).url,
        responseId: (u as { response_id?: string }).response_id,
        revisedPrompt: (u as { revised_prompt?: string }).revised_prompt,
      })
    }
  })

  return results
}

/**
 * AI-suggested thumbnail templates for the current post context.
 * Calls the server-side proxy which forwards the request with the user's key.
 */
export async function suggestThumbnails(
  title: string,
  description: string,
  platform: string = 'youtube'
): Promise<
  {
    templateId: string
    label: string
    category: string
    prompt: string
    referenceType: string
    referenceLabel: string
  }[]
> {
  const response = await fetch('/api/proxy/openai-enhance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, platform }),
  })

  if (!response.ok) {
    throw new Error(`Suggestion failed: ${response.status}`)
  }

  const data = (await response.json()) as {
    suggestions?: {
      templateId: string
      label: string
      category: string
      prompt: string
      referenceType: string
      referenceLabel: string
    }[]
  }

  return data.suggestions || []
}
