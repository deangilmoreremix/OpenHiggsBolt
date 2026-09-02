import axios from 'axios'

const STORYBOARD_BASE = '/api/storyboard'
const PREDICTIONS_BASE = '/api/v1/predictions'

export interface StoryboardCharacter {
  id?: string
  name: string
  traits?: string
  outfit?: string
  reference_images?: string[]
  avatar_url?: string
  backstory?: string
  voice_id?: string
}

export interface StoryboardEpisode {
  id?: string
  title: string
  summary?: string
  project_id?: string
  color?: string
  description?: string
  duration_seconds?: number
}

export interface StoryboardProject {
  id?: string
  name: string
  brief: string
  style?: string
  description?: string
}

export interface StoryboardShot {
  id?: string
  shot_number?: number
  camera?: string
  angle?: string
  description: string
  character_ids?: string[]
  reference_images?: string[]
  shot_type?: string
  camera_movement?: string
  dialogue?: string
  duration_seconds?: number
  image_prompt?: string
}

export interface StoryboardResult {
  request_id?: string
  status?: string
  url?: string | null
  outputs?: string[]
  error?: string
}

function cleanKey(apiKey: string): string {
  if (!apiKey) return ''
  return String(apiKey)
    .replace(/[\u200B-\u200D\uFEFF\u2060\u00AD]/g, '')
    .replace(/^[\s\u0000-\x1F]+|[\s\u0000-\x1F]+$/g, '')
    .trim()
}

function getApiKey(): string | null {
  if (typeof window === 'undefined') return null
  const w = window as any
  const stored = w.__MUAPI_KEY__ || (w.localStorage && w.localStorage.getItem('muapi_key'))
  const cleaned = stored ? cleanKey(stored) : null
  return cleaned || null
}

function withKey(config: any): any {
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

function extractRequestId(data: any): string | undefined {
  return data?.request_id || data?.id || data?.data?.request_id || data?.data?.id
}

export async function createProject(payload: StoryboardProject): Promise<any> {
  const res = await axios.post(`${STORYBOARD_BASE}/projects`, payload, withKey({ method: 'POST' }))
  return res.data
}

export async function getProjects(): Promise<any> {
  const res = await axios.get(`${STORYBOARD_BASE}/projects`, withKey({ method: 'GET' }))
  return res.data
}

export async function getProject(projectId: string): Promise<any> {
  const res = await axios.get(`${STORYBOARD_BASE}/projects/${projectId}`, withKey({ method: 'GET' }))
  return res.data
}

export async function createCharacter(projectId: string, payload: StoryboardCharacter): Promise<any> {
  const res = await axios.post(
    `${STORYBOARD_BASE}/projects/${projectId}/characters`,
    payload,
    withKey({ method: 'POST' })
  )
  return res.data
}

export async function createEpisode(projectId: string, payload: StoryboardEpisode): Promise<any> {
  const res = await axios.post(
    `${STORYBOARD_BASE}/projects/${projectId}/episodes`,
    payload,
    withKey({ method: 'POST' })
  )
  return res.data
}

export async function getEpisode(projectId: string, episodeId: string): Promise<any> {
  const res = await axios.get(
    `${STORYBOARD_BASE}/projects/${projectId}/episodes/${episodeId}`,
    withKey({ method: 'GET' })
  )
  return res.data
}

export async function generateShot(episodeId: string, payload: StoryboardShot): Promise<StoryboardResult> {
  const res = await axios.post(
    `${STORYBOARD_BASE}/episodes/${episodeId}/shots`,
    payload,
    withKey({ method: 'POST' })
  )
  return { ...res.data, request_id: extractRequestId(res.data) }
}

export async function pollStoryboardResult(
  requestId: string,
  maxAttempts = 90,
  interval = 2000
): Promise<any> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, interval))
    try {
      const res = await axios.get(
        `${PREDICTIONS_BASE}/${requestId}/result`,
        withKey({ method: 'GET' })
      )
      const data = res.data || {}
      const body = data.data || data
      const status = String(data.status || body.status || '').toLowerCase()
      if (status === 'completed' || status === 'succeeded' || status === 'success') {
        return data
      }
      if (status === 'failed' || status === 'error') {
        throw new Error(data.error || body.error || 'Storyboard generation failed')
      }
    } catch (err: any) {
      if (attempt === maxAttempts) throw err
    }
  }
  throw new Error('Storyboard generation timed out after polling.')
}

export function extractStoryboardAsset(data: any): string | null {
  if (!data) return null
  const body = data.data || data
  const outputs = data.outputs || data.output?.outputs || body.outputs || body.output?.outputs
  if (Array.isArray(outputs) && outputs.length > 0) {
    return typeof outputs[0] === 'string' ? outputs[0] : outputs[0]?.url || null
  }
  return (
    data.url ||
    data.video_url ||
    body.url ||
    body.video_url ||
    (body.output && body.output.url) ||
    null
  )
}

export interface GenerateShotFramePayload {
  prompt: string
  aspect_ratio: '16:9' | '9:16'
  model?: string
  images_list?: string[]
}

export async function generateShotFrame(payload: GenerateShotFramePayload): Promise<string> {
  const res = await axios.post(
    `${STORYBOARD_BASE}/generate/shot-frame`,
    payload,
    withKey({ method: 'POST' })
  )
  const url = extractStoryboardAsset(res.data)
  if (!url) throw new Error('No frame generated')
  return url
}
