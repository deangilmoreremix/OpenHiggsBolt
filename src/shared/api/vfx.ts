/**
 * Production-ready MuAPI VFX service layer.
 * Handles image upload, VFX generation, polling, cancellation, and result retrieval.
 */

import type {
  GenerationRequest,
  GenerationResponse,
  GenerationStatus,
  UploadResponse,
  VideoResult,
  GenerationState,
} from '@/types/vfx'

const MUAPI_BASE = process.env.MUAPI_BASE_URL || 'https://api.muapi.ai'
const DEFAULT_POLL_INTERVAL_MS = 5000
const DEFAULT_MAX_POLL_ATTEMPTS = 180 // ~15 minutes

type MuAPIStatusResponse = {
  request_id?: string
  id?: string
  status?: string
  error?: string
  outputs?: unknown[]
  output?: { url?: string } | string
  url?: string
  video_url?: string
}

function normalizeStatus(raw: string | undefined): GenerationState {
  const s = (raw || '').toLowerCase()
  if (s === 'completed' || s === 'succeeded' || s === 'success') return 'completed'
  if (s === 'failed' || s === 'error') return 'failed'
  if (s === 'cancelled' || s === 'canceled') return 'cancelled'
  if (s === 'processing' || s === 'running' || s === 'in_progress') return 'processing'
  return 'queued'
}

function extractVideoUrl(data: MuAPIStatusResponse): string | undefined {
  return (
    data.video_url ||
    (typeof data.output === 'string' ? data.output : data.output?.url) ||
    data.url ||
    (Array.isArray(data.outputs) ? (data.outputs[0] as string | undefined) : undefined)
  )
}

function createAuthHeaders(apiKey: string): HeadersInit {
  const cleanKey = typeof apiKey === 'string' ? apiKey.replace(/[^\u0000-\u00FF]/g, '').trim() : apiKey
  return {
    'Content-Type': 'application/json',
    'x-api-key': cleanKey,
  }
}

// MuAPI file upload spec constants
const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/wav', 'audio/webm',
  'application/zip', 'application/pdf', 'application/json',
])
const MAX_UPLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB per docs

function parseUploadErrorResponse(text: string): string {
  try {
    const parsed = JSON.parse(text)
    return parsed.detail || parsed.error || parsed.message || text.slice(0, 200)
  } catch {
    return text.slice(0, 200)
  }
}

export interface MuAPIVFXClientOptions {
  apiKey: string
  baseUrl?: string
  pollIntervalMs?: number
  maxPollAttempts?: number
}

export class MuAPIVFXClient {
  private apiKey: string
  private baseUrl: string
  private pollIntervalMs: number
  private maxPollAttempts: number
  private abortController: AbortController | null = null

  constructor(options: MuAPIVFXClientOptions) {
    this.apiKey = options.apiKey
    this.baseUrl = options.baseUrl || MUAPI_BASE
    this.pollIntervalMs = options.pollIntervalMs || DEFAULT_POLL_INTERVAL_MS
    this.maxPollAttempts = options.maxPollAttempts || DEFAULT_MAX_POLL_ATTEMPTS
    this.abortController = null

    if (!this.apiKey) {
      throw new Error('MuAPI key is required. Set MUAPI_API_KEY or pass apiKey.')
    }
  }

  /**
   * Upload an image file to MuAPI and return the public URL.
   */
  async uploadImage(file: File, onProgress?: (percent: number) => void): Promise<UploadResponse> {
    // --- Client-side pre-flight validation (MuAPI file upload spec) ---
    if (!file) {
      throw new Error('No file provided')
    }
    if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.type)) {
      throw new Error(
        `Invalid file type: ${file.type}. Allowed: ${[...ALLOWED_UPLOAD_MIME_TYPES].join(', ')}`
      )
    }
    if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
      throw new Error(
        `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum: 10 MB`
      )
    }

    const url = `${this.baseUrl}/api/v1/upload_file`
    const formData = new FormData()
    formData.append('file', file)

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', url)
      xhr.setRequestHeader('x-api-key', this.apiKey)

      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            onProgress(Math.round((event.loaded / event.total) * 100))
          }
        }
      }

      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          let detail = xhr.statusText
          try {
            detail = parseUploadErrorResponse(xhr.responseText)
          } catch {
            // fallback to statusText
          }
          return reject(new Error(`Image upload failed: ${xhr.status} - ${detail}`))
        }

        try {
          const data = JSON.parse(xhr.responseText)
          const fileUrl = data.url || data.file_url || data.data?.url
          if (!fileUrl || typeof fileUrl !== 'string') {
            return reject(new Error('No URL returned from upload'))
          }
          resolve({
            url: fileUrl,
            name: file.name,
            size: file.size,
            type: file.type,
          })
        } catch {
          reject(new Error('Invalid upload response'))
        }
      }

      xhr.onerror = () => reject(new Error('Network error during upload'))
      xhr.onabort = () => reject(new Error('Upload cancelled'))
      xhr.send(formData)
    })
  }

  /**
   * Submit a VFX generation request.
   */
  async generateVFX(params: GenerationRequest): Promise<GenerationResponse> {
    const url = `${this.baseUrl}/api/v1/generate_wan_ai_effects`

    const payload = {
      prompt: params.prompt || `Apply ${params.effect} effect cinematically`,
      image_url: params.image_url,
      name: params.effect,
      aspect_ratio: params.aspect_ratio || '16:9',
      resolution: params.resolution || '480p',
      quality: params.quality || 'medium',
      duration: Number(params.duration) || 5,
    }

    this.abortController = new AbortController()

    const res = await fetch(url, {
      method: 'POST',
      headers: createAuthHeaders(this.apiKey),
      body: JSON.stringify(payload),
      signal: this.abortController.signal,
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Generation request failed: ${res.status} - ${errText.slice(0, 200)}`)
    }

    const data = await res.json()
    const requestId = data.request_id || data.id || data.task_id
    if (!requestId) {
      throw new Error('No request ID returned from generation API')
    }

    return {
      request_id: requestId,
      status: normalizeStatus(data.status),
      message: data.message,
    }
  }

  /**
   * Fetch the current status of a generation job.
   */
  async getGenerationResult(requestId: string): Promise<GenerationStatus> {
    const url = `${this.baseUrl}/api/v1/predictions/${requestId}/result`

    const res = await fetch(url, {
      method: 'GET',
      headers: createAuthHeaders(this.apiKey),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Status check failed: ${res.status} - ${errText.slice(0, 200)}`)
    }

    const data: MuAPIStatusResponse = await res.json()
    const status = normalizeStatus((data as any)?.data?.status || data.status)
    const videoUrl = extractVideoUrl(data)

    return {
      request_id: requestId,
      status,
      video_url: videoUrl,
      error: data.error,
      outputs: data.outputs,
    }
  }

  /**
   * Poll a generation job until it completes, fails, is cancelled, or times out.
   * Calls onUpdate after every poll.
   */
  async pollGeneration(
    requestId: string,
    onUpdate?: (status: GenerationStatus) => void
  ): Promise<VideoResult> {
    this.abortController = new AbortController()

    for (let attempt = 1; attempt <= this.maxPollAttempts; attempt++) {
      if (this.abortController.signal.aborted) {
        throw new Error('Polling cancelled')
      }

      await new Promise((resolve) => setTimeout(resolve, this.pollIntervalMs))

      try {
        const status = await this.getGenerationResult(requestId)
        onUpdate?.(status)

        if (status.status === 'completed') {
          if (!status.video_url) {
            throw new Error('Generation completed but no video URL was returned')
          }
          return {
            request_id: requestId,
            video_url: status.video_url,
            status: 'completed',
            effect: '',
            created_at: new Date().toISOString(),
          }
        }

        if (status.status === 'failed') {
          throw new Error(status.error || 'Generation failed')
        }

        if (status.status === 'cancelled') {
          throw new Error('Generation was cancelled')
        }
      } catch (err) {
        if (attempt === this.maxPollAttempts) throw err
        if (err instanceof Error && err.message === 'Polling cancelled') throw err
      }
    }

    throw new Error('Generation timed out while polling for results')
  }

  /**
   * Cancel an in-flight generation or polling session.
   * Note: MuAPI does not expose a public cancel endpoint, so this aborts local polling.
   */
  cancelGeneration(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }
}

/**
 * Convenience singleton used by server-side routes.
 */
export function getServerVFXClient(apiKey?: string): MuAPIVFXClient {
  const key = apiKey || process.env.MUAPI_API_KEY || process.env.MUAPI_KEY || ''
  if (!key) {
    throw new Error('MUAPI_API_KEY is not configured')
  }
  return new MuAPIVFXClient({ apiKey: key })
}
