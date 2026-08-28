/**
 * Production-ready MuAPI image service layer for the Thumbnail Studio.
 *
 * The Thumbnail Studio authenticates with the user's **MuAPI** key (the same
 * `muapi_key` used by every other studio in the app), NOT OpenAI. Requests are
 * submitted to `POST /api/v1/{endpoint}` and then polled via
 * `GET /api/v1/predictions/{request_id}/result`, exactly like the VFX client.
 *
 * This client is intentionally key-aware: the caller passes the user's key in
 * rather than relying on a global/localStorage lookup, so generation works
 * reliably with the key handed down from the shell.
 */

// Default to the live MuAPI host. The URL builder below uses
// `${this.baseUrl}/api/v1/${endpoint}`. `MUAPI_BASE_URL` is honored when SET
// (even to '') so an empty string yields a relative `/api/v1/...` path that
// routes through the app's existing `/api/v1/*` proxy (see `middleware.js`),
// keeping the `x-api-key` server-mediated and avoiding the browser→api.muapi.ai
// CORS dependency. We keep the absolute host as the default to avoid a regression;
// opt into the proxy per-deploy by setting `MUAPI_BASE_URL=''`.
const MUAPI_BASE = process.env.MUAPI_BASE_URL !== undefined ? process.env.MUAPI_BASE_URL : 'https://api.muapi.ai'

/** Canonical image-model → endpoint aliases (verified against the live catalog).
 *
 * Maps model names to their correct API endpoints. Only include entries where the
 * API endpoint differs from the model name. Models not listed fall back to using
 * the model name as the endpoint path.
 */
const IMAGE_ENDPOINT_ALIASES: Record<string, string> = {
  'flux-dev': 'flux-dev-image',
  'flux-schnell': 'flux-schnell-image',
  'bytedance-seededit-v3': 'bytedance-seededit-image',
}

export const DEFAULT_IMAGE_MODEL = 'flux-dev'

/**
 * Quality handling is intentionally model-gated to avoid 422s from fields the
 * target endpoint does not accept.
 *
 * - flux-dev (DEFAULT): the verified catalog lists inputs of only
 *   `prompt`, `width`, `height`, `num_images`. There is NO `num_inference_steps`,
 *   `guidance_scale`, or `quality` field documented, and the existing
 *   `src/lib/muapi.js` client never sends steps either. Because we could NOT
 *   confirm any quality/step field for flux-dev, we send NONE — quality remains a
 *   UI label only (it still drives the speed tag in the stream UI). Sending an
 *   unconfirmed field here would risk a 422 and break generation.
 *
 * - seedream family (seedream-5.0 → `bytedance-seedream-v5.0`): the catalog
 *   `seedream-5.0` entry documents a `quality` field whose enum is
 *   `["basic", "high"]`. We send `quality` mapped to that confirmed enum so we
 *   never pass an out-of-range value (the UI's `low`/`medium` both map to `basic`).
 */
type QualityValue = 'low' | 'medium' | 'high'

const QUALITY_CAPABLE_ENDPOINTS = new Set<string>([
  'seedream-5.0',
  'bytedance-seedream-v5.0',
  'bytedance-seedream-5.0-pro',
])

function mapQualityForSeedream(q?: QualityValue): string | undefined {
  if (!q) return undefined
  // seedream enum is ["basic","high"]; collapse low/medium → basic.
  return q === 'high' ? 'high' : 'basic'
}

function buildQualityParams(model: string, quality?: QualityValue): Record<string, unknown> {
  const endpoint = IMAGE_ENDPOINT_ALIASES[model] || model

  // Default flux-dev family: no confirmed quality field — send nothing.
  if (model === DEFAULT_IMAGE_MODEL || endpoint === 'flux-dev') {
    return {}
  }

  // Seedream family: native `quality` field, mapped to the confirmed enum.
  if (QUALITY_CAPABLE_ENDPOINTS.has(endpoint) || model.startsWith('seedream')) {
    const value = mapQualityForSeedream(quality)
    return value ? { quality: value } : {}
  }

  // Any other model: do not send an unconfirmed field (avoids 422).
  return {}
}

/**
 * Masked-edit (inpainting) support is best-effort and model-gated.
 *
 * The verified catalog (packages/studio/src/models.js) does NOT document a
 * `mask` / `mask_url` field for ANY image model — even `bytedance-seededit-v3`
 * lists only `prompt` in its inputs. Sending an unconfirmed mask field would
 * risk a 422, so the mask is uploaded + attached ONLY for endpoints listed here.
 * The set is intentionally empty until a mask-capable model is catalog-verified;
 * the plumbing (param + upload helper) is already wired so enabling it later is
 * a one-line change.
 */
const MASK_CAPABLE_ENDPOINTS = new Set<string>([])

const DEFAULT_POLL_INTERVAL_MS = 4000
const DEFAULT_MAX_POLL_ATTEMPTS = 90 // ~6 minutes

export type MuAPIImageStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'

export interface MuAPIImageStatusResponse {
  request_id?: string
  id?: string
  status?: string
  error?: string
  outputs?: unknown[]
  output?: { url?: string } | string
  url?: string
  image_url?: string
  images?: string[]
  /** Some endpoints nest the real payload under `data`. */
  data?: MuAPIImageStatusResponse
}

export interface MuAPIImageResult {
  url: string
  revisedPrompt?: string
}

export interface MuAPIImageGenerateParams {
  prompt: string
  model?: string
  aspectRatio?: string // '16:9' | '1:1' | '9:16' | '4:3' ...
  quality?: 'low' | 'medium' | 'high'
  n?: number
  /** When set, generation runs as image-to-image (edit) using this source URL. */
  imageUrl?: string
  /** Strength for image-to-image (0–1). Defaults to 0.6. */
  strength?: number
  /** Optional mask (Blob | File) for masked-edit / inpainting. Best-effort, model-gated. */
  mask?: Blob | File
  /** Optional pre-uploaded mask URL. Used instead of `mask` when already hosted. */
  maskUrl?: string
}

export interface MuAPIImageClientOptions {
  apiKey: string
  baseUrl?: string
  pollIntervalMs?: number
  maxPollAttempts?: number
}

function normalizeStatus(raw: string | undefined): MuAPIImageStatus {
  const s = (raw || '').toLowerCase()
  if (s === 'completed' || s === 'succeeded' || s === 'success') return 'completed'
  if (s === 'failed' || s === 'error') return 'failed'
  if (s === 'cancelled' || s === 'canceled') return 'cancelled'
  if (s === 'processing' || s === 'running' || s === 'in_progress') return 'processing'
  return 'queued'
}

/** Extract the first usable image URL from any known MuAPI response shape. */
function extractImageUrl(data: MuAPIImageStatusResponse | null | undefined): string | null {
  if (!data) return null
  const candidates: unknown[] = []
  if (data.url) candidates.push(data.url)
  if (data.image_url) candidates.push(data.image_url)
  if (typeof data.output === 'string') candidates.push(data.output)
  else if (data.output?.url) candidates.push(data.output.url)
  if (Array.isArray(data.images)) candidates.push(...data.images)
  if (Array.isArray(data.outputs)) candidates.push(...data.outputs)
  for (const c of candidates) {
    if (typeof c === 'string' && isImageUrl(c)) return c
    if (c && typeof c === 'object' && 'url' in c) {
      const u = (c as { url?: unknown }).url
      if (typeof u === 'string' && isImageUrl(u)) return u
    }
  }
  return null
}

/** Accept both hosted (http/https) and inline (data:image/...) URLs. */
function isImageUrl(s: string): boolean {
  return s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:image/')
}

function cleanKey(apiKey: string): string {
  if (!apiKey) return '';
  return String(apiKey)
    .replace(/[\u200B-\u200D\uFEFF\u2060\u00AD]/g, '')  // zero-width chars, BOM, word joiner, soft hyphen
    .replace(/^[\s\u0000-\u001F]+|[\s\u0000-\u001F]+$/g, '')
    .trim();
}

function createAuthHeaders(apiKey: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-api-key': cleanKey(apiKey),
  }
}

function parseError(text: string): string {
  try {
    const parsed = JSON.parse(text)
    return parsed.detail || parsed.error || parsed.message || text.slice(0, 200)
  } catch {
    return text.slice(0, 200)
  }
}

export class MuAPIImageClient {
  private apiKey: string
  private baseUrl: string
  private pollIntervalMs: number
  private maxPollAttempts: number
  /** Per-`generate` in-flight controllers. `cancel()` aborts them all. */
  private activeControllers: AbortController[] = []

  constructor(options: MuAPIImageClientOptions) {
    this.apiKey = cleanKey(options.apiKey)
    this.baseUrl = options.baseUrl ?? MUAPI_BASE
    this.pollIntervalMs = options.pollIntervalMs || DEFAULT_POLL_INTERVAL_MS
    this.maxPollAttempts = options.maxPollAttempts || DEFAULT_MAX_POLL_ATTEMPTS

    if (!this.apiKey) {
      throw new Error('MuAPI key is required. Add your key in Settings.')
    }
  }

  /**
   * Upload a reference image and return its hosted URL (needed for image-to-image).
   */
  async uploadImage(file: File, onProgress?: (percent: number) => void): Promise<string> {
    if (!file) throw new Error('No file provided')
    const ALLOWED = new Set([
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    ])
    if (!ALLOWED.has(file.type)) {
      throw new Error(`Invalid file type: ${file.type}. Use JPG, PNG or WebP.`)
    }
    const MAX = 10 * 1024 * 1024
    if (file.size > MAX) {
      throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Max 10 MB.`)
    }

    const url = `${this.baseUrl}/api/v1/upload_file`
    const formData = new FormData()
    formData.append('file', file)

    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', url)
      xhr.setRequestHeader('x-api-key', this.apiKey)
      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
        }
      }
      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          const detail = parseError(xhr.responseText)
          if (xhr.status === 401 || xhr.status === 403) {
            return reject(new Error('Invalid MuAPI key. Please check your key in Settings.'))
          }
          return reject(new Error(`Image upload failed: ${xhr.status} - ${detail}`))
        }
        try {
          const data = JSON.parse(xhr.responseText)
          const fileUrl = data.url || data.file_url || data.data?.url
          if (!fileUrl || typeof fileUrl !== 'string') {
            return reject(new Error('No URL returned from upload'))
          }
          resolve(fileUrl)
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
   * Upload a mask (Blob | File) for masked-edit / inpainting and return its
   * hosted URL. Mirrors `uploadImage` but also accepts PNG (typical canvas mask).
   */
  async uploadMask(file: Blob | File, onProgress?: (percent: number) => void): Promise<string> {
    if (!file) throw new Error('No mask provided')
    const ALLOWED = new Set([
      'image/png', 'image/jpeg', 'image/jpg', 'image/webp',
    ])
    // A canvas-generated mask Blob may arrive without a MIME type; allow it through
    // since masks are always raster images, but still reject clearly-wrong types.
    const type = (file as File).type
    if (type && !ALLOWED.has(type)) {
      throw new Error(`Invalid mask type: ${type}. Use PNG, JPG or WebP.`)
    }
    const MAX = 10 * 1024 * 1024
    if (typeof (file as Blob).size === 'number' && (file as Blob).size > MAX) {
      throw new Error(`Mask too large: ${((file as Blob).size / 1024 / 1024).toFixed(1)} MB. Max 10 MB.`)
    }

    const url = `${this.baseUrl}/api/v1/upload_file`
    const formData = new FormData()
    formData.append('file', file)

    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', url)
      xhr.setRequestHeader('x-api-key', this.apiKey)
      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
        }
      }
      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          const detail = parseError(xhr.responseText)
          if (xhr.status === 401 || xhr.status === 403) {
            return reject(new Error('Invalid MuAPI key. Please check your key in Settings.'))
          }
          return reject(new Error(`Mask upload failed: ${xhr.status} - ${detail}`))
        }
        try {
          const data = JSON.parse(xhr.responseText)
          const fileUrl = data.url || data.file_url || data.data?.url
          if (!fileUrl || typeof fileUrl !== 'string') {
            return reject(new Error('No URL returned from mask upload'))
          }
          resolve(fileUrl)
        } catch {
          reject(new Error('Invalid mask upload response'))
        }
      }
      xhr.onerror = () => reject(new Error('Network error during mask upload'))
      xhr.onabort = () => reject(new Error('Mask upload cancelled'))
      xhr.send(formData)
    })
  }

  /**
   * Generate one or more images. Returns an array of result URLs.
   * For image-to-image (edit) pass `imageUrl`.
   */
  async generate(params: MuAPIImageGenerateParams): Promise<MuAPIImageResult[]> {
    const model = params.model || DEFAULT_IMAGE_MODEL
    const count = Math.max(1, Math.min(params.n ?? 1, 4))

    // Quality is mapped once per request (model-gated, see buildQualityParams).
    const qualityParams = buildQualityParams(model, params.quality)

    // Masked edit: upload once (best-effort, model-gated). Only attach when the
    // resolved endpoint is catalog-verified to accept a mask, otherwise skip to
    // avoid a 422. As of the verified catalog no image model is mask-capable.
    const endpoint = IMAGE_ENDPOINT_ALIASES[model] || model
    let maskUrl: string | undefined
    if ((params.mask || params.maskUrl) && MASK_CAPABLE_ENDPOINTS.has(endpoint)) {
      try {
        maskUrl = params.maskUrl ?? (params.mask ? await this.uploadMask(params.mask) : undefined)
      } catch (err) {
        // A mask upload failure should not break the whole generation; fall back
        // to a normal (unmasked) request.
        console.warn('Mask upload failed, continuing without mask:', err)
        maskUrl = undefined
      }
    }

    type GenerateOutcome = { url: string } | { error: string }

    const tasks: Promise<GenerateOutcome>[] = Array.from({ length: count }, () =>
      this.runOnce({
        prompt: params.prompt,
        model,
        aspectRatio: params.aspectRatio,
        imageUrl: params.imageUrl,
        strength: params.strength,
        qualityParams,
        maskUrl,
      })
        .then((url: string) => ({ url }))
        .catch((err: unknown) =>
          ({ error: err instanceof Error ? err.message : String(err) }) as GenerateOutcome,
        ),
    )

    const outcomes = await Promise.all(tasks)

    const results: MuAPIImageResult[] = []
    const errors: string[] = []
    for (const outcome of outcomes) {
      if ('url' in outcome) {
        results.push({ url: outcome.url })
      } else {
        errors.push(outcome.error)
      }
    }

    if (results.length === 0) {
      throw new Error(errors[0] || 'All image generations failed')
    }
    // Partial success is acceptable — return whatever we got.
    return results
  }

  private async runOnce(args: {
    prompt: string
    model: string
    aspectRatio?: string
    imageUrl?: string
    strength?: number
    qualityParams?: Record<string, unknown>
    maskUrl?: string
  }): Promise<string> {
    const endpoint = IMAGE_ENDPOINT_ALIASES[args.model] || args.model
    const url = `${this.baseUrl}/api/v1/${endpoint}`

    const payload: Record<string, unknown> = { prompt: args.prompt }
    if (args.aspectRatio) payload.aspect_ratio = args.aspectRatio
    if (args.imageUrl) {
      payload.image_url = args.imageUrl
      payload.strength = args.strength ?? 0.6
    }
    // Quality (model-gated; empty for unconfirmed models like flux-dev).
    if (args.qualityParams) {
      Object.assign(payload, args.qualityParams)
    }
    // Masked-edit field, only attached for mask-capable, catalog-verified models.
    if (args.maskUrl) {
      payload.mask_url = args.maskUrl
    }

    const ac = new AbortController()
    this.activeControllers.push(ac)

    let res: Response
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: createAuthHeaders(this.apiKey),
        body: JSON.stringify(payload),
        signal: ac.signal,
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error('Generation cancelled')
      }
      throw new Error('Network error submitting generation')
    }

    if (!res.ok) {
      const detail = parseError(await res.text().catch(() => ''))
      if (res.status === 401 || res.status === 403) {
        throw new Error('Invalid MuAPI key. Please check your key in Settings.')
      }
      if (res.status === 429) {
        throw new Error('Rate limit reached. Please wait a moment and try again.')
      }
      throw new Error(`Generation request failed: ${res.status} - ${detail}`)
    }

    const submitData = (await res.json()) as MuAPIImageStatusResponse
    const requestId = submitData.request_id || submitData.id
    if (!requestId) {
      // Some endpoints return the result inline.
      const direct = extractImageUrl(submitData)
      if (direct) return direct
      throw new Error('No request ID or image returned from generation API')
    }

    return this.poll(requestId, ac.signal)
  }

  private async poll(requestId: string, signal: AbortSignal): Promise<string> {
    const url = `${this.baseUrl}/api/v1/predictions/${requestId}/result`
    for (let attempt = 1; attempt <= this.maxPollAttempts; attempt++) {
      if (signal.aborted) throw new Error('Generation cancelled')
      await new Promise((resolve) => setTimeout(resolve, this.pollIntervalMs))

      let res: Response
      try {
        res = await fetch(url, { method: 'GET', headers: createAuthHeaders(this.apiKey) })
      } catch {
        if (attempt === this.maxPollAttempts) throw new Error('Network error while polling')
        continue
      }

      if (!res.ok) {
        if (res.status >= 500) {
          if (attempt === this.maxPollAttempts) throw new Error('MuAPI server error while polling')
          // Exponential backoff on transient server errors, capped at ~30s.
          const backoff = Math.min(this.pollIntervalMs * 2 ** Math.min(attempt, 4), 30000)
          await new Promise((r) => setTimeout(r, backoff))
          continue
        }
        const detail = parseError(await res.text().catch(() => ''))
        throw new Error(`Status check failed: ${res.status} - ${detail}`)
      }

      let data: MuAPIImageStatusResponse
      try {
        data = (await res.json()) as MuAPIImageStatusResponse
      } catch {
        throw new Error('Invalid response from MuAPI (expected JSON)')
      }
      const status = normalizeStatus(data.data?.status || data.status)

      if (status === 'completed') {
        // Result may be nested under `data` for some endpoints.
        const body = data.data || data
        const imageUrl = extractImageUrl(body)
        if (!imageUrl) throw new Error('Generation completed but no image URL was returned')
        return imageUrl
      }
      if (status === 'failed') {
        throw new Error(data.error || 'Generation failed')
      }
      if (status === 'cancelled') {
        throw new Error('Generation was cancelled')
      }
    }
    throw new Error('Generation timed out while waiting for results')
  }

  cancel(): void {
    for (const ac of this.activeControllers) {
      ac.abort()
    }
    this.activeControllers = []
  }
}

/**
 * Convenience factory used by the studio components.
 */
export function getImageClient(apiKey?: string): MuAPIImageClient {
  const key = cleanKey(apiKey || '')
  if (!key) {
    throw new Error('MuAPI key is required. Add your key in Settings.')
  }
  return new MuAPIImageClient({ apiKey: key })
}
