/**
 * Production-ready MuAPI VFX service layer (root entrypoint).
 *
 * Required methods:
 *   uploadImage(file, onProgress?) -> { url, name, size, type }
 *   generateVFX(params)            -> { request_id, status }
 *   pollGeneration(requestId, onUpdate?) -> { request_id, video_url, status, created_at }
 *   getGenerationResult(requestId) -> { request_id, status, video_url?, error? }
 *   cancelGeneration()             -> void
 */

const MUAPI_BASE = (typeof process !== 'undefined' && process.env?.MUAPI_BASE_URL)
  ? process.env.MUAPI_BASE_URL
  : 'https://api.muapi.ai'

const DEFAULT_POLL_INTERVAL_MS = 5000
const DEFAULT_MAX_POLL_ATTEMPTS = 180

function getApiKey() {
  if (typeof process !== 'undefined') {
    const key = process.env.MUAPI_API_KEY || process.env.MUAPI_KEY
    if (key) return key
  }
  if (typeof window !== 'undefined') {
    return window.__MUAPI_KEY__ || localStorage.getItem('muapi_key') || ''
  }
  return ''
}

function normalizeStatus(raw) {
  const s = (raw || '').toLowerCase()
  if (['completed', 'succeeded', 'success'].includes(s)) return 'completed'
  if (['failed', 'error'].includes(s)) return 'failed'
  if (['cancelled', 'canceled'].includes(s)) return 'cancelled'
  if (['processing', 'running', 'in_progress'].includes(s)) return 'processing'
  return 'queued'
}

function extractVideoUrl(data) {
  return (
    data.video_url ||
    (typeof data.output === 'string' ? data.output : data.output?.url) ||
    data.url ||
    (Array.isArray(data.outputs) ? data.outputs[0] : undefined)
  )
}

function createHeaders(apiKey) {
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
  }
}

export class MuAPIVFXClient {
  constructor(options = {}) {
    this.apiKey = options.apiKey || getApiKey()
    this.baseUrl = options.baseUrl || MUAPI_BASE
    this.pollIntervalMs = options.pollIntervalMs || DEFAULT_POLL_INTERVAL_MS
    this.maxPollAttempts = options.maxPollAttempts || DEFAULT_MAX_POLL_ATTEMPTS
    this.abortController = null

    if (!this.apiKey) {
      throw new Error('MuAPI key is required. Set MUAPI_API_KEY or pass apiKey.')
    }
  }

  uploadImage(file, onProgress) {
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
            const err = JSON.parse(xhr.responseText)
            detail = err.detail || err.error || detail
          } catch {
            // ignore
          }
          return reject(new Error(`Upload failed: ${xhr.status} - ${detail}`))
        }

        try {
          const data = JSON.parse(xhr.responseText)
          const fileUrl = data.url || data.file_url || data.data?.url
          if (!fileUrl || typeof fileUrl !== 'string') {
            return reject(new Error('No URL returned from upload'))
          }
          resolve({ url: fileUrl, name: file.name, size: file.size, type: file.type })
        } catch {
          reject(new Error('Invalid upload response'))
        }
      }

      xhr.onerror = () => reject(new Error('Network error during upload'))
      xhr.onabort = () => reject(new Error('Upload cancelled'))
      xhr.send(formData)
    })
  }

  async generateVFX(params) {
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
      headers: createHeaders(this.apiKey),
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

  async getGenerationResult(requestId) {
    const url = `${this.baseUrl}/api/v1/predictions/${requestId}/result`
    const res = await fetch(url, {
      method: 'GET',
      headers: createHeaders(this.apiKey),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Status check failed: ${res.status} - ${errText.slice(0, 200)}`)
    }

    const data = await res.json()
    const status = normalizeStatus(data.status)
    const videoUrl = extractVideoUrl(data)

    return {
      request_id: requestId,
      status,
      video_url: videoUrl,
      error: data.error,
      outputs: data.outputs,
    }
  }

  async pollGeneration(requestId, onUpdate) {
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
        if (err?.message === 'Polling cancelled') throw err
      }
    }

    throw new Error('Generation timed out while polling for results')
  }

  cancelGeneration() {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }
}

let _muapiSingleton = null

function getSingleton() {
  if (!_muapiSingleton) {
    _muapiSingleton = new MuAPIVFXClient()
  }
  return _muapiSingleton
}

export const muapi = {
  uploadImage: (file, onProgress) => getSingleton().uploadImage(file, onProgress),
  generateVFX: (params) => getSingleton().generateVFX(params),
  pollGeneration: (requestId, onUpdate) => getSingleton().pollGeneration(requestId, onUpdate),
  getGenerationResult: (requestId) => getSingleton().getGenerationResult(requestId),
  cancelGeneration: () => getSingleton().cancelGeneration(),
}

export function uploadImage(file, onProgress) {
  return getSingleton().uploadImage(file, onProgress)
}

export function generateVFX(params) {
  return getSingleton().generateVFX(params)
}

export function pollGeneration(requestId, onUpdate) {
  return getSingleton().pollGeneration(requestId, onUpdate)
}

export function getGenerationResult(requestId) {
  return getSingleton().getGenerationResult(requestId)
}

export function cancelGeneration() {
  getSingleton().cancelGeneration()
}
