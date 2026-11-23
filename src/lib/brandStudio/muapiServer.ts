// Server-side MuAPI client for Brand Studio. BYOK: the caller's own key is passed in (from the x-api-key header);
// there is deliberately no server-side key and no env read here.
import { extractImageUrl, extractText } from './parse'
import { isUsableImageRef } from './imageRefs'

const BASE = 'https://api.muapi.ai/api/v1'

export class MuapiError extends Error {
  constructor(message: string, public status = 502, public terminal = false) { super(message) }
}

type Opts = { key: string; fetchImpl?: typeof fetch; pollMs?: number; maxPolls?: number }

function errorDetail(text: string): string {
  try {
    const j = JSON.parse(text)
    const d = j?.detail
    if (typeof d === 'string') return d
    if (d?.error) return String(d.error)
    if (typeof j?.error === 'string') return j.error
  } catch { /* not JSON */ }
  return text.slice(0, 200)
}

export function createMuapi({ key, fetchImpl = fetch, pollMs = 2500, maxPolls = 120 }: Opts) {
  if (!key) throw new MuapiError('MuAPI key required', 400, true)
  const headers = { 'Content-Type': 'application/json', 'x-api-key': key }

  async function submit(endpoint: string, params: Record<string, unknown>) {
    const res = await fetchImpl(`${BASE}/${endpoint}`, { method: 'POST', headers, body: JSON.stringify(params), signal: AbortSignal.timeout(30_000) })
    const text = await res.text()
    if (!res.ok) throw new MuapiError(`MuAPI ${endpoint} failed (${res.status}): ${errorDetail(text)}`, res.status === 401 || res.status === 403 ? res.status : 502, true)
    return JSON.parse(text)
  }

  async function pollOnce(requestId: string) {
    const res = await fetchImpl(`${BASE}/predictions/${encodeURIComponent(requestId)}/result`, { headers: { 'x-api-key': key }, signal: AbortSignal.timeout(30_000) })
    const text = await res.text()
    if (!res.ok) {
      const terminal = res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429
      throw new MuapiError(`MuAPI poll failed (${res.status}): ${errorDetail(text)}`, 502, terminal)
    }
    return JSON.parse(text)
  }

  async function run(endpoint: string, params: Record<string, unknown>) {
    const sub = await submit(endpoint, params)
    const id = sub?.request_id || sub?.id
    if (!id) return sub
    let lastErr: unknown
    for (let i = 0; i < maxPolls; i++) {
      try {
        const r = await pollOnce(id)
        const s = String(r?.status || '').toLowerCase()
        if (['completed', 'succeeded', 'success'].includes(s)) return r
        if (['failed', 'error'].includes(s)) throw new MuapiError(r?.error || r?.detail?.error || 'Generation failed', 502, true)
        // A 200 carrying { detail: { status: 'failed' } } is a failure too.
        if (r?.detail?.status === 'failed') throw new MuapiError(String(r.detail.error || 'Generation failed'), 502, true)
      } catch (e) {
        if (e instanceof MuapiError && e.terminal) throw e
        lastErr = e
      }
      await new Promise((r) => setTimeout(r, pollMs))
    }
    throw new MuapiError(`MuAPI timed out${lastErr instanceof Error ? `: ${lastErr.message}` : ''}`, 504, true)
  }

  return {
    run,
    submit,
    pollOnce,
    async text(prompt: string, model = 'gpt-5-nano') { return extractText(await run(model, { prompt })) },
    async vision(prompt: string, imageUrl: string, model = 'gpt-5-nano') { return extractText(await run(model, { prompt, image_url: imageUrl })) },
    async image(prompt: string, aspect = '1:1') {
      const url = extractImageUrl(await run('nano-banana', { prompt, aspect_ratio: aspect }))
      if (!url) throw new MuapiError('No image URL in response', 502, true)
      return url
    },
    async imageEdit(prompt: string, refs: string[], aspect = 'Auto') {
      const url = extractImageUrl(await run('nano-banana-edit', { prompt, images_list: refs, aspect_ratio: aspect }))
      if (!url) throw new MuapiError('No image URL in response', 502, true)
      return url
    },
    async imageEdit2(prompt: string, refs: string[], o: { aspectRatio?: string; resolution?: string; outputFormat?: string } = {}) {
      return extractImageUrl(await run('nano-banana-2-edit', { prompt, images_list: refs, aspect_ratio: o.aspectRatio ?? 'Auto', resolution: o.resolution ?? '2k', output_format: o.outputFormat ?? 'png' }))
    },
    async videoI2V(prompt: string, imageUrl: string, o: { resolution?: string; duration?: number } = {}) {
      return extractImageUrl(await run('seedance-lite-i2v', { prompt, image_url: imageUrl, resolution: o.resolution ?? '480p', duration: o.duration ?? 5 }))
    },
    /** Upload a data URL / base64 PNG and return a MuAPI-hosted URL. */
    async upload(data: string, filename = 'asset.png', contentType = 'image/png') {
      const b64 = data.includes(',') ? data.split(',')[1] : data
      const form = new FormData()
      form.append('file', new Blob([Buffer.from(b64, 'base64')], { type: contentType }), filename)
      const res = await fetchImpl(`${BASE}/upload_file`, { method: 'POST', headers: { 'x-api-key': key }, body: form, signal: AbortSignal.timeout(60_000) })
      const text = await res.text()
      if (!res.ok) throw new MuapiError(`MuAPI upload failed (${res.status}): ${errorDetail(text)}`, 502, true)
      const j = JSON.parse(text)
      const url = j?.url || j?.file_url || j?.data?.url
      if (!url) throw new MuapiError('Upload returned no URL', 502, true)
      return url as string
    },
  }
}

export type Muapi = ReturnType<typeof createMuapi>

/** Logo (when raster) goes in as a reference; an SVG/ICO logo or a rejected reference falls back to text-to-image. */
export async function renderCampaignImage(mu: Muapi, logoUrl: string | undefined, prompt: string, aspect: string): Promise<string> {
  if (isUsableImageRef(logoUrl)) {
    try {
      const url = await mu.imageEdit(prompt, [logoUrl], aspect)
      if (url) return url
    } catch { /* retry without the logo */ }
  }
  return mu.image(prompt, aspect)
}
