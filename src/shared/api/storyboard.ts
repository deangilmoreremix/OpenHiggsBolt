import axios from 'axios'
import { cleanApiKey } from '@/lib/keys'
import { getImageClient } from './muapiImage'

// All calls go through the Next.js route at app/api/storyboard/[[...path]],
// which exposes three endpoints:
//   POST /api/storyboard/generate   — multi-shot storyboard video
//   POST /api/storyboard/frame      — single still frame for one shot
//   GET  /api/storyboard/result?id= — poll either of the above
const STORYBOARD_BASE = '/api/storyboard'

export interface StoryboardResult {
  request_id?: string
  status?: string
  url?: string | null
  error?: string | null
}

export interface GenerateStoryboardPayload {
  shots: { scene: string; duration: number }[]
  duration: 5 | 10
  aspect_ratio: '16:9' | '9:16'
  images_list?: string[]
}

export interface GenerateShotFramePayload {
  prompt: string
  aspect_ratio: '16:9' | '9:16'
  model?: string
  images_list?: string[]
}

// BYOK: the key comes from the browser (set by StandaloneShell or the
// Settings modal) and is forwarded to the route as `x-api-key`.
function getApiKey(): string {
  if (typeof window === 'undefined') return ''
  try {
    return cleanApiKey((window as any).__MUAPI_KEY__ || localStorage.getItem('muapi_key') || '')
  } catch {
    return cleanApiKey((window as any).__MUAPI_KEY__ || '')
  }
}

function authHeaders() {
  const key = getApiKey()
  if (!key) throw new Error('Add your MuAPI key in Settings to generate storyboards.')
  return { 'Content-Type': 'application/json', 'x-api-key': key }
}

function errorMessage(err: any, fallback: string): string {
  return err?.response?.data?.error || err?.message || fallback
}

async function submit(path: string, payload: unknown, fallback: string): Promise<string> {
  try {
    const res = await axios.post(`${STORYBOARD_BASE}/${path}`, payload, { headers: authHeaders() })
    const requestId = res.data?.request_id
    if (!requestId) throw new Error('No request id returned from storyboard API')
    return requestId
  } catch (err: any) {
    throw new Error(errorMessage(err, fallback))
  }
}

export async function pollStoryboardResult(
  requestId: string,
  { maxAttempts = 150, interval = 3000, onStatus }: { maxAttempts?: number; interval?: number; onStatus?: (status: string) => void } = {}
): Promise<string> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, interval))
    let data: StoryboardResult
    // Outside the try: a missing key won't fix itself, so fail now instead of retrying.
    const headers = authHeaders()
    try {
      const res = await axios.get(`${STORYBOARD_BASE}/result`, { params: { id: requestId }, headers })
      data = res.data || {}
    } catch (err: any) {
      // 4xx from our own route (bad id, missing key, no entitlement) won't succeed on retry.
      const status = err?.response?.status
      if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
        throw new Error(errorMessage(err, 'Storyboard generation failed'))
      }
      // Transient network/5xx errors: keep polling, surface the last one on timeout.
      lastError = err
      continue
    }
    onStatus?.(data.status || 'processing')
    if (data.status === 'completed') {
      if (!data.url) throw new Error('Generation finished but returned no output')
      return data.url
    }
    if (data.status === 'failed') {
      throw new Error(data.error || 'Storyboard generation failed')
    }
  }
  throw new Error(errorMessage(lastError, 'Storyboard generation timed out.'))
}

/** Generate a multi-shot storyboard video and resolve with its URL. */
export async function generateStoryboard(
  payload: GenerateStoryboardPayload,
  onStatus?: (status: string) => void
): Promise<string> {
  const requestId = await submit('generate', payload, 'Storyboard generation failed')
  onStatus?.('queued')
  return pollStoryboardResult(requestId, { onStatus })
}

/** Upload a character reference image and resolve with its hosted URL. */
export async function uploadReferenceImage(file: File, onProgress?: (percent: number) => void): Promise<string> {
  const key = getApiKey()
  if (!key) throw new Error('Add your MuAPI key in Settings to upload images.')
  return getImageClient(key).uploadImage(file, onProgress)
}

/** Generate a still frame for a single shot and resolve with its URL. */
export async function generateShotFrame(payload: GenerateShotFramePayload): Promise<string> {
  const requestId = await submit('frame', payload, 'Frame generation failed')
  return pollStoryboardResult(requestId, { interval: 2000, maxAttempts: 90 })
}
