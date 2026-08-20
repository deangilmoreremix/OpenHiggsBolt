import axios from 'axios'

const STORYBOARD_BASE = '/api/storyboard'

export interface StoryboardShotInput {
  scene: string
  duration: number
}

export interface GenerateStoryboardPayload {
  shots: StoryboardShotInput[]
  duration?: number
  aspect_ratio?: '16:9' | '9:16'
  images_list?: string[]
  model?: string
}

export interface StoryboardResultResponse {
  request_id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  url: string | null
  error?: string | null
}

function getApiKey(): string | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { __MUAPI_KEY__?: unknown; localStorage?: { getItem: (k: string) => string | null } }
  const stored = w.localStorage?.getItem('muapi_key')
  const key = w.__MUAPI_KEY__ ?? stored
  return typeof key === 'string' ? key : null
}

function withKey(config: import('axios').AxiosRequestConfig): import('axios').AxiosRequestConfig {
  const key = getApiKey()
  return {
    ...config,
    headers: {
      'Content-Type': 'application/json',
      ...(key ? { 'x-api-key': key } : {}),
      ...(config.headers || {}),
    },
  }
}

export async function generateStoryboard(
  payload: GenerateStoryboardPayload
): Promise<{ request_id: string }> {
  const res = await axios.post(`${STORYBOARD_BASE}/generate`, payload, withKey({ method: 'POST' }))
  const data = res.data || {}
  const requestId = data.request_id || data.id || data.task_id
  if (!requestId) {
    throw new Error(data?.error || 'No request id returned from storyboard API')
  }
  return { request_id: requestId }
}

export async function getStoryboardResult(requestId: string): Promise<StoryboardResultResponse> {
  const res = await axios.get(
    `${STORYBOARD_BASE}/result`,
    { params: { id: requestId }, ...withKey({ method: 'GET' }) }
  )
  return res.data
}

export async function pollStoryboardResult(
  requestId: string,
  maxAttempts = 120,
  interval = 5000
): Promise<StoryboardResultResponse> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, interval))
    try {
      const res = await getStoryboardResult(requestId)
      const status = String(res?.status || '').toLowerCase()
      if (status === 'completed') return res
      if (status === 'failed' || status === 'error') {
        throw new Error(res?.error || 'Storyboard generation failed')
      }
    } catch (err: unknown) {
      if (attempt === maxAttempts) throw err
    }
  }
  throw new Error('Storyboard generation timed out after polling.')
}

export function extractStoryboardAsset(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const record = data as Record<string, unknown>
  const output = record.output
  if (typeof output === 'string') return output
  if (output && typeof output === 'object') {
    const out = output as Record<string, unknown>
    if (typeof out.url === 'string') return out.url
  }
  if (typeof record.url === 'string') return record.url
  if (typeof record.video_url === 'string') return record.video_url
  if (Array.isArray(record.outputs) && typeof record.outputs[0] === 'string') return record.outputs[0]
  const nested = record.data as Record<string, unknown> | undefined
  if (nested && Array.isArray(nested.outputs) && typeof nested.outputs[0] === 'string') {
    return nested.outputs[0]
  }
  return null
}

export interface GenerateFramePayload {
  prompt: string
  aspect_ratio?: '16:9' | '9:16'
  images_list?: string[]
  image_url?: string
  model?: string
}

/**
 * Generate a single still frame for a shot and poll until the image is ready.
 * Returns the image URL, or throws on failure/timeout.
 */
export async function generateShotFrame(
  payload: GenerateFramePayload,
  maxAttempts = 60,
  interval = 3000
): Promise<string> {
  const res = await axios.post(`${STORYBOARD_BASE}/frame`, payload, withKey({ method: 'POST' }))
  const data = res.data || {}
  const requestId = data.request_id || data.id || data.task_id
  if (!requestId) throw new Error(data?.error || 'No request id returned from frame API')

  const final = await pollStoryboardResult(requestId, maxAttempts, interval)
  const url = extractStoryboardAsset(final) || final.url || null
  if (!url) throw new Error('Frame completed but no image was returned.')
  return url
}
