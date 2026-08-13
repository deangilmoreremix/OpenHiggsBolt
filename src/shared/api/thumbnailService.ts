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
const GENERATE_FUNCTION = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/generate-thumbnail` : '/.netlify/functions/generate-thumbnail'
const REFINE_FUNCTION = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/refine-thumbnail` : '/.netlify/functions/refine-thumbnail'

function getUserOpenAiKey(): string {
  if (typeof window !== 'undefined') {
    const w = window as unknown as { __OPENAI_KEY__?: string }
    const fromGlobal = w.__OPENAI_KEY__
    if (fromGlobal && fromGlobal.trim()) return fromGlobal.trim()
    try {
      const fromStorage = window.localStorage?.getItem('openai_key')
      if (fromStorage && fromStorage.trim()) return fromStorage.trim()
    } catch {
      // localStorage may be unavailable
    }
  }
  return ''
}

function getMuapiKey(): string {
  if (typeof window !== 'undefined') {
    try {
      return window.localStorage?.getItem('muapi_key') || ''
    } catch {
      return ''
    }
  }
  return ''
}

async function postToEdgeFunction(url: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const userKey = getUserOpenAiKey()
  if (userKey) headers['x-openai-key'] = userKey

  const response = await fetch(url, {
    method: 'POST',
    headers,
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
 * Generate thumbnail(s) via the Supabase Edge Function proxy.
 * The Edge Function holds the OpenAI API key server-side; the user's BYOK
 * key is forwarded via x-openai-key header. No key is exposed to the browser.
 */
export async function generateThumbnail(params: ThumbnailGenerateParams): Promise<ThumbnailGenerateResult[]> {
  const muapiKey = getMuapiKey()
  const body: Record<string, unknown> = {
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
    ...(muapiKey ? { muapi_key: muapiKey } : {}),
  }

  if (params.imageUrl) {
    body.image_url = params.imageUrl
    body.strength = params.strength ?? 0.6
  }

  const data = await postToEdgeFunction(GENERATE_FUNCTION, body)

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
 * Refine an existing thumbnail image via the Supabase Edge Function proxy.
 */
export async function refineThumbnail(params: ThumbnailRefineParams): Promise<ThumbnailRefineResult[]> {
  const muapiKey = getMuapiKey()
  const body: Record<string, unknown> = {
    image_url: params.imageUrl,
    prompt: params.prompt,
    model: params.model || 'gpt-image-2',
    aspect_ratio: params.aspectRatio || '16:9',
    n: Math.min(Math.max(params.n || 1, 1), 4),
    strength: params.strength ?? 0.5,
    ...(muapiKey ? { muapi_key: muapiKey } : {}),
  }

  const data = await postToEdgeFunction(REFINE_FUNCTION, body)

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
 * Calls the Edge Function which uses the user's OpenAI key to generate suggestions.
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
  const SUPABASE_URL = getSupabaseUrl()
  const SUGGEST_FUNCTION = SUPABASE_URL
    ? `${SUPABASE_URL}/functions/v1/suggest-thumbnails`
    : '/.netlify/functions/suggest-thumbnails'

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const userKey = getUserOpenAiKey()
  if (userKey) headers['x-openai-key'] = userKey

  const response = await fetch(SUGGEST_FUNCTION, {
    method: 'POST',
    headers,
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
