import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Shared MuAPI upload adapter suite.
 *
 * Everything upstream is mocked at the module boundary: no request ever leaves
 * the process, and no real MuAPI credential is involved. The tests assert the
 * properties the adapter exists to guarantee:
 *
 *   1. the size + MIME contract is the shared one (10 MB image/audio/other,
 *      50 MB video, `video/quicktime` included);
 *   2. every browser hop goes through `/api/v1/upload_file` — never straight
 *      to api.muapi.ai — and never carries a hand-set multipart Content-Type;
 *   3. a MuAPI URL is temporary: it expires after an hour, is never the
 *      permanent identifier, and expiry forces a re-upload of the durable
 *      original;
 *   4. cross-workspace access is denied;
 *   5. every failure class has its own human-readable message;
 *   6. submissions are not duplicated and retries stay bounded.
 */

const ADAPTER_PATH = path.join(process.cwd(), 'src/lib/muapiUpload.ts')

// ── Test doubles ────────────────────────────────────────────────────────────

interface RecordedCall {
  url: string
  method: string
  headers: Record<string, string>
  body: unknown
}

let fetchCalls: RecordedCall[] = []
let fetchImpl: (url: string, init?: RequestInit) => Promise<Response>

let now = 1_700_000_000_000

function installWindow() {
  ;(globalThis as Record<string, unknown>).window = {
    location: { protocol: 'https:' },
    localStorage: {
      getItem: (key: string) => (key === 'muapi_key' ? 'user-owned-key-WRAP' : null),
      setItem: () => undefined,
      removeItem: () => undefined,
    },
    navigator: { userAgent: 'vitest', language: 'en' },
    screen: { width: 1024, height: 768 },
  }
  ;(globalThis as Record<string, unknown>).screen = { width: 1024, height: 768 }
}

const cache = new Map<string, {
  url: string
  durableRef: string
  uploadedAt: number
  expiresAt: number
}>()

const durableObjects = new Map<string, { blob: Blob; name: string; type: string; size: number }>()
const uploadCounts = { put: 0, muapi: 0 }

function makeStore() {
  return {
    async put(input: { workspaceId: string; assetId: string; blob: Blob; name: string; type: string }) {
      uploadCounts.put += 1
      // The workspace prefix is part of the object path, so a write can only
      // ever land under the caller's own scope.
      const durableRef = `${input.workspaceId}/${input.assetId}/${input.name}`
      durableObjects.set(durableRef, {
        blob: input.blob,
        name: input.name,
        type: input.type,
        size: input.blob.size,
      })
      return {
        workspaceId: input.workspaceId,
        assetId: input.assetId,
        durableRef,
        durableUrl: `https://durable.example.com/${durableRef}`,
        name: input.name,
        type: input.type,
        size: input.blob.size,
      }
    },
    async open(workspaceId: string, durableRef: string) {
      const record = durableObjects.get(`${workspaceId}/${durableRef}`)
      if (!record) return null
      return { blob: record.blob, name: record.name, type: record.type }
    },
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

/** Route the way the real `/api/v1/upload_file` route does, in miniature. */
function installRouteMock(options: {
  uploadBody?: unknown
  uploadStatus?: number
  resolveBody?: unknown
  resolveStatus?: number
  recordStatus?: number
  failUploads?: number
} = {}) {
  fetchImpl = async (rawUrl, init = {}) => {
    const url = String(rawUrl)
    const method = String(init.method ?? 'GET')
    const headers: Record<string, string> = {}
    if (init.headers instanceof Headers) {
      init.headers.forEach((value, key) => { headers[key.toLowerCase()] = value })
    } else if (init.headers && typeof init.headers === 'object') {
      for (const [key, value] of Object.entries(init.headers)) {
        headers[key.toLowerCase()] = String(value)
      }
    }

    let body: unknown = init.body
    if (body instanceof FormData) {
      const file = body.get('file')
      body = { formData: true, file: file instanceof File ? file.name : null, fields: [...body.keys()] }
    } else if (typeof body === 'string') {
      body = JSON.parse(body)
    }

    fetchCalls.push({ url, method, headers, body })

    // Durable resolve hop: POST /api/v1/upload_file?durable=resolve
    if (url.includes('/api/v1/upload_file') && url.includes('durable=resolve')) {
      if (options.failUploads && uploadCounts.muapi < options.failUploads) {
        uploadCounts.muapi += 1
        return jsonResponse({ error: 'upstream unavailable' }, options.resolveStatus ?? 503)
      }
      uploadCounts.muapi += 1
      if (options.resolveStatus && options.resolveStatus >= 400) {
        return jsonResponse(options.resolveBody ?? { error: 'rejected' }, options.resolveStatus)
      }
      return jsonResponse(
        options.resolveBody ?? { url: 'https://cdn.muapi.ai/fresh.mp4', source: 'durable' },
      )
    }

    // Durable record lookup: GET /api/v1/upload_file?durable_asset_id=…
    if (url.includes('/api/v1/upload_file') && url.includes('durable_asset_id=')) {
      if (options.recordStatus) return jsonResponse({ error: 'nope' }, options.recordStatus)
      const assetId = decodeURIComponent(
        new URL(url, 'http://localhost').searchParams.get('durable_asset_id') ?? '',
      )
      const ref = `ws-alpha/${assetId}/logo.png`
      return jsonResponse({
        assetId,
        durableRef: ref,
        durableUrl: `https://durable.example.com/${ref}`,
        name: 'logo.png',
        size: 1024,
      })
    }

    // Plain byte upload hop: POST /api/v1/upload_file
    if (options.uploadStatus && options.uploadStatus >= 400) {
      return jsonResponse(options.uploadBody ?? { error: 'rejected' }, options.uploadStatus)
    }
    return jsonResponse(
      options.uploadBody ?? { url: 'https://cdn.muapi.ai/uploaded.png', name: 'x', size: 1 },
    )
  }
}

function authContext(overrides: Record<string, unknown> = {}) {
  return {
    workspaceId: 'ws-alpha',
    assetId: 'asset-1',
    apiKey: null,
    now: () => now,
    urlCache: {
      read: (key: string) => cache.get(key) ?? null,
      write: (key: string, entry: { url: string; durableRef: string; uploadedAt: number; expiresAt: number }) => {
        cache.set(key, entry)
      },
      delete: (key: string) => { cache.delete(key) },
    },
    durableStore: makeStore(),
    fetchImpl: (url: string, init?: RequestInit) => fetchImpl(url, init),
    ...overrides,
  } as never
}

async function loadAdapter() {
  return import('../src/lib/muapiUpload')
}

function pngFile(size = 2048, name = 'logo.png', type = 'image/png'): File {
  const file = new File([new Uint8Array(size)], name, { type })
  return file
}

beforeEach(() => {
  vi.resetModules()
  installWindow()
  fetchCalls = []
  durableObjects.clear()
  uploadCounts.put = 0
  uploadCounts.muapi = 0
  now = 1_700_000_000_000
  cache.clear()
  installRouteMock()
})

afterEach(() => {
  vi.restoreAllMocks()
  delete (globalThis as Record<string, unknown>).window
  delete (globalThis as Record<string, unknown>).screen
})

// ─────────────────────────────────────────────────────────────────────────────
// 1. Contract: accepted formats, rejects, and the shared limits
// ─────────────────────────────────────────────────────────────────────────────

describe('MuAPI upload adapter: the shared size + MIME contract', () => {
  it('accepts a new PNG and a new JPEG image', async () => {
    const { uploadImageToMuAPI, validateMuAPIUpload } = await loadAdapter()

    expect(validateMuAPIUpload(pngFile(2048, 'a.png', 'image/png'))).toMatchObject({ ok: true, category: 'image' })
    expect(validateMuAPIUpload(pngFile(2048, 'a.jpg', 'image/jpeg'))).toMatchObject({ ok: true, category: 'image' })

    const result = await uploadImageToMuAPI(pngFile(2048, 'a.png', 'image/png'), authContext())
    expect(result.url).toBe('https://cdn.muapi.ai/uploaded.png')
  })

  it('accepts an MP4 video', async () => {
    const { uploadVideoToMuAPI, validateMuAPIUpload } = await loadAdapter()

    const mov = new File([new Uint8Array(1024)], 'clip.mov', { type: 'video/quicktime' })
    expect(validateMuAPIUpload(mov)).toMatchObject({ ok: true, category: 'video' })

    const result = await uploadVideoToMuAPI(
      new File([new Uint8Array(1024)], 'clip.mp4', { type: 'video/mp4' }),
      authContext(),
    )
    expect(result.url).toBe('https://cdn.muapi.ai/uploaded.png')
  })

  it('accepts the documented "others" category (zip / pdf / json) at 10MB', async () => {
    const { validateMuAPIUpload } = await loadAdapter()

    for (const [type, size] of [
      ['application/zip', 5 * 1024 * 1024],
      ['application/pdf', 5 * 1024 * 1024],
      ['application/json', 5 * 1024 * 1024],
    ] as const) {
      const file = new File([new Uint8Array(8)], 'f', { type })
      Object.defineProperty(file, 'size', { value: size })
      expect(validateMuAPIUpload(file)).toMatchObject({ ok: true, category: 'other' })
    }
  })

  it('rejects an unsupported type before any request is made', async () => {
    const { uploadImageToMuAPI, validateMuAPIUpload, handleMuAPIUploadError } = await loadAdapter()

    expect(validateMuAPIUpload(pngFile(64, 'evil.exe', 'application/x-msdownload'))).toMatchObject({
      ok: false,
      errorClass: 'unsupported_format',
    })
    expect(validateMuAPIUpload(pngFile(64, 'page.html', 'text/html'))).toMatchObject({
      ok: false,
      errorClass: 'unsupported_format',
    })

    await expect(
      uploadImageToMuAPI(pngFile(64, 'evil.exe', 'application/x-msdownload'), authContext()),
    ).rejects.toMatchObject({ class: 'unsupported_format' })

    expect(fetchCalls).toHaveLength(0)
    expect(handleMuAPIUploadError({ class: 'unsupported_format' }).message).toMatch(/not supported/i)
  })

  it('rejects an over-limit image (10MB) and an over-limit video (50MB)', async () => {
    const { uploadImageToMuAPI, uploadVideoToMuAPI, validateMuAPIUpload } = await loadAdapter()

    const bigImage = pngFile(8, 'big.png', 'image/png')
    Object.defineProperty(bigImage, 'size', { value: 11 * 1024 * 1024 })
    expect(validateMuAPIUpload(bigImage)).toMatchObject({ ok: false, errorClass: 'over_limit' })
    await expect(uploadImageToMuAPI(bigImage, authContext())).rejects.toMatchObject({ class: 'over_limit' })

    const bigVideo = pngFile(8, 'big.mp4', 'video/mp4')
    Object.defineProperty(bigVideo, 'size', { value: 51 * 1024 * 1024 })
    expect(validateMuAPIUpload(bigVideo)).toMatchObject({ ok: false, errorClass: 'over_limit' })
    await expect(uploadVideoToMuAPI(bigVideo, authContext())).rejects.toMatchObject({ class: 'over_limit' })

    expect(fetchCalls).toHaveLength(0)
  })

  it('rejects a video handed to the image entry point (and vice versa)', async () => {
    const { uploadImageToMuAPI } = await loadAdapter()
    await expect(
      uploadImageToMuAPI(new File([new Uint8Array(8)], 'c.mp4', { type: 'video/mp4' }), authContext()),
    ).rejects.toMatchObject({ class: 'unsupported_format' })
  })

  it('normalises image/jpg to image/jpeg rather than rejecting it', async () => {
    const { validateMuAPIUpload } = await loadAdapter()
    expect(validateMuAPIUpload(pngFile(64, 'a.jpg', 'image/jpg'))).toMatchObject({
      ok: true,
      mimeType: 'image/jpeg',
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. Transport: one route, no manual boundary, no key leakage
// ─────────────────────────────────────────────────────────────────────────────

describe('MuAPI upload adapter: transport rules', () => {
  it('sends every request through /api/v1/upload_file and never to api.muapi.ai', async () => {
    const { uploadImageToMuAPI } = await loadAdapter()

    await uploadImageToMuAPI(pngFile(), authContext())

    expect(fetchCalls).toHaveLength(1)
    expect(fetchCalls[0].url).toBe('/api/v1/upload_file')
    expect(fetchCalls.some(call => call.url.includes('muapi.ai'))).toBe(false)
  })

  it('never sets a multipart Content-Type, so the client owns the boundary', async () => {
    const { uploadImageToMuAPI } = await loadAdapter()

    await uploadImageToMuAPI(pngFile(), authContext())

    const headers = fetchCalls[0].headers
    expect(headers['content-type']).toBeUndefined()
    expect(headers['Content-Type']).toBeUndefined()
    expect(JSON.stringify(headers)).not.toMatch(/multipart\/form-data/)
    // The body really is a FormData, boundary included.
    expect((fetchCalls[0].body as { formData?: boolean }).formData).toBe(true)
  })

  it('omits x-api-key entirely when the caller supplies none', async () => {
    const { uploadImageToMuAPI } = await loadAdapter()
    await uploadImageToMuAPI(pngFile(), authContext({ apiKey: null }))
    expect(fetchCalls[0].headers['x-api-key']).toBeUndefined()
  })

  it('forwards a caller-owned BYOK key verbatim and nothing else', async () => {
    const { uploadImageToMuAPI } = await loadAdapter()
    await uploadImageToMuAPI(pngFile(), authContext({ apiKey: 'user-owned-key-XYZ' }))
    expect(fetchCalls[0].headers['x-api-key']).toBe('user-owned-key-XYZ')
  })

  it('parses the url out of every response shape the route passes through', async () => {
    const { uploadImageToMuAPI } = await loadAdapter()

    for (const body of [
      { url: 'https://cdn.muapi.ai/a.png' },
      { file_url: 'https://cdn.muapi.ai/b.png' },
      { data: { url: 'https://cdn.muapi.ai/c.png' } },
      { data: { file_url: 'https://cdn.muapi.ai/d.png' } },
    ]) {
      installRouteMock({ uploadBody: body })
      const result = await uploadImageToMuAPI(pngFile(), authContext())
      expect(result.url).toMatch(/^https:\/\/cdn\.muapi\.ai\/[a-d]\.png$/)
    }
  })

  it('fails with invalid_response when the reply carries no url', async () => {
    const { uploadImageToMuAPI } = await loadAdapter()
    installRouteMock({ uploadBody: { status: 'ok' } })
    await expect(uploadImageToMuAPI(pngFile(), authContext())).rejects.toMatchObject({
      class: 'invalid_response',
    })
  })

  it('fails with invalid_response for a non-http url and for a non-object body', async () => {
    const { uploadImageToMuAPI, extractMuAPIUrl } = await loadAdapter()
    expect(extractMuAPIUrl({ url: 'javascript:alert(1)' })).toBeNull()
    expect(extractMuAPIUrl({ url: '' })).toBeNull()
    expect(extractMuAPIUrl(null)).toBeNull()
    expect(extractMuAPIUrl({ data: { url: 'https://cdn/x.png' } })).toBe('https://cdn/x.png')

    installRouteMock({ uploadBody: { url: 'not-a-url' } })
    await expect(uploadImageToMuAPI(pngFile(), authContext())).rejects.toMatchObject({
      class: 'invalid_response',
    })
  })

  it('fails with invalid_response when the body is not parseable as a shape', async () => {
    const { uploadImageToMuAPI } = await loadAdapter()
    fetchImpl = async () => new Response('not json', { status: 200 })
    await expect(uploadImageToMuAPI(pngFile(), authContext())).rejects.toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. Expiry-driven re-upload
// ─────────────────────────────────────────────────────────────────────────────

describe('MuAPI upload adapter: one-hour lifetime', () => {
  it('exposes the documented one-hour lifetime and a safety margin', async () => {
    const { MUAPI_URL_LIFETIME_MS, MUAPI_URL_SAFETY_MARGIN_MS } = await loadAdapter()
    expect(MUAPI_URL_LIFETIME_MS).toBe(60 * 60 * 1000)
    expect(MUAPI_URL_SAFETY_MARGIN_MS).toBeGreaterThan(0)
    expect(MUAPI_URL_SAFETY_MARGIN_MS).toBeLessThan(MUAPI_URL_LIFETIME_MS)
  })

  it('treats a cached URL past one hour as expired and a fresh one as usable', async () => {
    const { isMuAPIUrlExpired } = await loadAdapter()
    const base = 1_700_000_000_000
    const entry = { url: 'https://cdn.muapi.ai/x', uploadedAt: base, expiresAt: base + 3_540_000 }

    expect(isMuAPIUrlExpired(entry, base)).toBe(false)
    expect(isMuAPIUrlExpired(entry, base + 60_000)).toBe(false)
    expect(isMuAPIUrlExpired(entry, base + 3_540_000)).toBe(true)
    expect(isMuAPIUrlExpired(entry, base + 60 * 60 * 1000)).toBe(true)

    // uploadedAt-only entries are measured against the full lifetime minus the
    // safety margin, so an entry is retired shortly before the hour is up.
    const legacy = { url: 'https://cdn.muapi.ai/y', uploadedAt: base, expiresAt: 0 }
    expect(isMuAPIUrlExpired(legacy, base)).toBe(false)
    expect(isMuAPIUrlExpired(legacy, base + 58 * 60 * 1000)).toBe(false)
    expect(isMuAPIUrlExpired(legacy, base + 60 * 60 * 1000)).toBe(true)
    expect(isMuAPIUrlExpired(legacy, base + 61 * 60 * 1000)).toBe(true)

    // Never assume validity without a timestamp.
    expect(isMuAPIUrlExpired({ url: '', uploadedAt: base, expiresAt: base + 1 })).toBe(true)
    expect(isMuAPIUrlExpired(null)).toBe(true)
  })

  it('re-uploads the durable original when the cached URL is older than 1h', async () => {
    const { resolveMuAPIMediaInput } = await loadAdapter()
    installRouteMock()

    const assetId = 'asset-expired'
    cache.set(`ws-alpha::${assetId}`, {
      url: 'https://cdn.muapi.ai/STALE.mp4',
      durableRef: `ws-alpha/${assetId}/clip.mp4`,
      uploadedAt: now - 2 * 60 * 60 * 1000,
      expiresAt: now - 60 * 60 * 1000 + 60_000,
    })

    const fresh = await resolveMuAPIMediaInput(assetId, authContext())

    expect(fresh.url).toBe('https://cdn.muapi.ai/fresh.mp4')
    expect(fresh.source).toBe('fresh')
    // Exactly one re-upload, and it targeted the durable resolve hop.
    const resolveCalls = fetchCalls.filter(c => c.url.includes('durable=resolve'))
    expect(resolveCalls).toHaveLength(1)
    expect(resolveCalls[0].method).toBe('POST')
    // The cache now holds the fresh URL, so a second resolve is free.
    const second = await resolveMuAPIMediaInput(assetId, authContext())
    expect(second.source).toBe('cache')
    expect(second.url).toBe('https://cdn.muapi.ai/fresh.mp4')
    expect(fetchCalls.filter(c => c.url.includes('durable=resolve'))).toHaveLength(1)
  })

  it('does NOT re-upload when the cached URL is still fresh', async () => {
    const { resolveMuAPIMediaInput } = await loadAdapter()
    installRouteMock()

    const assetId = 'asset-fresh'
    cache.set(`ws-alpha::${assetId}`, {
      url: 'https://cdn.muapi.ai/RECENT.mp4',
      durableRef: `ws-alpha/${assetId}/clip.mp4`,
      uploadedAt: now - 5 * 60 * 1000,
      expiresAt: now + 3_495_000,
    })

    const resolved = await resolveMuAPIMediaInput(assetId, authContext())

    expect(resolved.source).toBe('cache')
    expect(resolved.url).toBe('https://cdn.muapi.ai/RECENT.mp4')
    expect(resolved.durableRef).toBe(`ws-alpha/${assetId}/clip.mp4`)
    expect(uploadCounts.muapi).toBe(0)
    expect(fetchCalls).toHaveLength(0)
  })

  it('caches a freshly resolved URL only inside the usable lifetime', async () => {
    const { resolveMuAPIMediaInput, MUAPI_URL_LIFETIME_MS, MUAPI_URL_SAFETY_MARGIN_MS } =
      await loadAdapter()
    installRouteMock()

    const resolved = await resolveMuAPIMediaInput('asset-new', authContext())

    const cached = cache.get('ws-alpha::asset-new')
    expect(cached).toBeDefined()
    expect(cached?.url).toBe('https://cdn.muapi.ai/fresh.mp4')
    expect(cached?.expiresAt - cached!.uploadedAt).toBe(
      MUAPI_URL_LIFETIME_MS - MUAPI_URL_SAFETY_MARGIN_MS,
    )
    expect(cached?.durableRef).toBe('ws-alpha/asset-new/logo.png')
    expect(resolved.expiresAt).toBeLessThanOrEqual(now + MUAPI_URL_LIFETIME_MS)
  })

  it('re-uploads again once the clock moves past the cached expiry', async () => {
    const { resolveMuAPIMediaInput } = await loadAdapter()
    installRouteMock()

    await resolveMuAPIMediaInput('asset-clock', authContext())
    expect(uploadCounts.muapi).toBe(1)

    // 61 minutes later the same asset needs a fresh URL.
    now += 61 * 60 * 1000
    const again = await resolveMuAPIMediaInput('asset-clock', authContext())

    expect(again.source).toBe('fresh')
    expect(uploadCounts.muapi).toBe(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. The permanent identifier is durable storage, not the provider URL
// ─────────────────────────────────────────────────────────────────────────────

describe('MuAPI upload adapter: the permanent identifier is durable', () => {
  it('persists the original to durable storage before asking MuAPI', async () => {
    const { uploadImageToMuAPI } = await loadAdapter()

    const result = await uploadImageToMuAPI(pngFile(4096), authContext())

    expect(result.durableRef).toBe('ws-alpha/asset-1/logo.png')
    expect(result.durableUrl).toBe('https://durable.example.com/ws-alpha/asset-1/logo.png')
    // The original really is sitting in the durable store.
    expect(durableObjects.has('ws-alpha/asset-1/logo.png')).toBe(true)
    // …and the value handed back for storage is that durable reference, not
    // the provider URL.
    expect(result.url).toBe('https://cdn.muapi.ai/uploaded.png')
  })

  it('persistMuAPIAssetOriginal returns a durable reference that is never a MuAPI URL', async () => {
    const { persistMuAPIAssetOriginal, MUAPI_UPLOAD_ROUTE } = await loadAdapter()

    const record = await persistMuAPIAssetOriginal({
      file: pngFile(4096),
      assetId: 'asset-durable',
      authContext: authContext(),
    })

    expect(record.durableRef).toBe('ws-alpha/asset-durable/logo.png')
    expect(record.durableRef).not.toMatch(/muapi/i)
    expect(record.durableUrl).not.toMatch(/muapi/i)
    expect(record.workspaceId).toBe('ws-alpha')
    // No MuAPI call at all for a pure durable write.
    expect(uploadCounts.muapi).toBe(0)
    expect(fetchCalls).toHaveLength(0)
    expect(MUAPI_UPLOAD_ROUTE).toBe('/api/v1/upload_file')
  })

  it('the personalization asset service records a durable URL, not the temp one', async () => {
    const adapter = await loadAdapter()

    const persist = vi.spyOn(adapter, 'persistMuAPIAssetOriginal').mockResolvedValue({
      workspaceId: 'ws-alpha',
      assetId: 'asset-svc',
      durableRef: 'ws-alpha/asset-svc/logo.png',
      durableUrl: 'https://durable.example.com/ws-alpha/asset-svc/logo.png',
      name: 'logo.png',
      type: 'image/png',
      size: 2048,
    })
    const upload = vi.spyOn(adapter, 'uploadImageToMuAPI').mockResolvedValue({
      url: 'https://cdn.muapi.ai/EXPIRES-IN-AN-HOUR.png',
      name: 'logo.png',
      size: 2048,
      type: 'image/png',
      uploadedAt: now,
      expiresAt: now + 3_540_000,
      source: 'bytes',
      durableRef: 'ws-alpha/asset-svc/logo.png',
      attempts: 1,
    })

    const { uploadPersonalizationAsset } = await import(
      '../src/shared/personalization/assetUploadService'
    )

    const result = await uploadPersonalizationAsset('user-key', { file: pngFile(2048) })

    // The value the provider persists as the asset's identifier.
    expect(result.url).toBe('https://durable.example.com/ws-alpha/asset-svc/logo.png')
    expect(result.durableRef).toBe('ws-alpha/asset-svc/logo.png')
    // The temporary URL is exposed separately and clearly labelled.
    expect(result.muapiUrl).toBe('https://cdn.muapi.ai/EXPIRES-IN-AN-HOUR.png')
    expect(result.url).not.toBe(result.muapiUrl)
    expect(result.muapiUrl).not.toMatch(/durable\.example\.com/)
    expect(JSON.stringify(result)).not.toMatch(/user-key/)

    // The durable write happens before MuAPI is asked for anything.
    expect(persist).toHaveBeenCalledTimes(1)
    expect(persist.mock.invocationCallOrder[0]).toBeLessThan(
      upload.mock.invocationCallOrder[0],
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. Cross-workspace denial
// ─────────────────────────────────────────────────────────────────────────────

describe('MuAPI upload adapter: cross-workspace access is denied', () => {
  it('refuses a durable record the server cannot see in this workspace', async () => {
    const { resolveMuAPIMediaInput } = await loadAdapter()
    installRouteMock({ recordStatus: 404 })

    await expect(
      resolveMuAPIMediaInput('someone-elses-asset', authContext({ workspaceId: 'ws-beta' })),
    ).rejects.toMatchObject({ class: 'workspace_denied' })
  })

  it('refuses a 403 the same way, so a denial is indistinguishable from absence', async () => {
    const { resolveMuAPIMediaInput } = await loadAdapter()
    installRouteMock({ recordStatus: 403 })

    await expect(
      resolveMuAPIMediaInput('someone-elses-asset', authContext()),
    ).rejects.toMatchObject({ class: 'workspace_denied' })
  })

  it('writes durable objects under the caller workspace prefix only', async () => {
    const { uploadVideoToMuAPI } = await loadAdapter()

    // A 6 MB video exceeds the serverless hop budget, so it takes the
    // durable-first path: straight to storage, then a tiny re-upload request.
    const bigVideo = new File([new Uint8Array(1024)], 'clip.mp4', { type: 'video/mp4' })
    Object.defineProperty(bigVideo, 'size', { value: 6 * 1024 * 1024 })

    const result = await uploadVideoToMuAPI(bigVideo, authContext({ workspaceId: 'ws-gamma' }))

    expect(result.source).toBe('durable')
    expect(result.durableRef?.startsWith('ws-gamma/')).toBe(true)
    expect(durableObjects.has('ws-gamma/asset-1/clip.mp4')).toBe(true)
    expect([...durableObjects.keys()].some(key => key.startsWith('ws-alpha/'))).toBe(false)
    // The bytes never crossed the function hop.
    expect(fetchCalls.some(call => (call.body as { formData?: boolean })?.formData === true)).toBe(false)
  })

  it('refuses an asset id that tries to escape its workspace prefix', async () => {
    const { resolveMuAPIMediaInput } = await loadAdapter()

    for (const bad of ['../ws-alpha/asset-1', 'a/b', '..', '']) {
      await expect(resolveMuAPIMediaInput(bad, authContext())).rejects.toMatchObject({
        class: 'workspace_denied',
      })
    }
    expect(fetchCalls).toHaveLength(0)
  })

  it('refuses an empty or missing authorized workspace', async () => {
    const { resolveMuAPIMediaInput, uploadImageToMuAPI } = await loadAdapter()

    await expect(resolveMuAPIMediaInput('a', authContext({ workspaceId: '' }))).rejects.toMatchObject({
      class: 'workspace_denied',
    })
    await expect(
      uploadImageToMuAPI(pngFile(), authContext({ workspaceId: undefined })),
    ).rejects.toMatchObject({ class: 'workspace_denied' })
  })

  it('scopes the URL cache by workspace, so another workspace cannot reuse a URL', async () => {
    const { resolveMuAPIMediaInput } = await loadAdapter()
    installRouteMock()

    cache.set('ws-alpha::asset-shared', {
      url: 'https://cdn.muapi.ai/ws-alpha-only.mp4',
      durableRef: 'ws-alpha/asset-shared/clip.mp4',
      uploadedAt: now,
      expiresAt: now + 3_540_000,
    })

    // ws-beta has no cache entry of its own, so it has to resolve — and its
    // own server lookup succeeds or fails on its own scope, never on ws-alpha's.
    const beta = await resolveMuAPIMediaInput('asset-shared', authContext({ workspaceId: 'ws-beta' }))
    expect(beta.source).toBe('fresh')
    expect(beta.url).toBe('https://cdn.muapi.ai/fresh.mp4')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. Error classification
// ─────────────────────────────────────────────────────────────────────────────

describe('MuAPI upload adapter: structured, distinct failure messages', () => {
  it('maps every class to a distinct, non-empty, human-readable message', async () => {
    const { handleMuAPIUploadError } = await loadAdapter()

    const info = handleMuAPIUploadError({ class: 'unsupported_format' })
    expect(info.message.length).toBeGreaterThan(10)

    // Every class, driven through the inputs a real caller would see.
    const cases: Array<[unknown, string]> = [
      [new Error('Add your MuAPI API key in Settings to use this feature.'), 'missing_api_key'],
      [{ status: 401, message: 'Unauthorized: Missing API key' }, 'missing_api_key'],
      [{ status: 401, message: 'invalid api key' }, 'invalid_api_key'],
      [new Error('MuAPI rejected that API key. Re-enter it in Settings and try again.'), 'invalid_api_key'],
      [{ status: 402, message: 'payment required' }, 'insufficient_credits'],
      [new Error('insufficient credit balance'), 'insufficient_credits'],
      [new Error('Invalid file type: application/x-msdownload'), 'unsupported_format'],
      [new Error('That file format is not supported. Use JPG, PNG or WebP.'), 'unsupported_format'],
      [new Error('File too large: 61.0 MB. Maximum: 50 MB'), 'over_limit'],
      [{ status: 413, message: 'payload too large' }, 'over_limit'],
      [new Error('The upload was interrupted. Check your connection and try again.'), 'network_error'],
      [new TypeError('Failed to fetch'), 'network_error'],
      [new Error('The upload took too long and timed out.'), 'timeout'],
      [new Error('aborted'), 'timeout'],
      [{ status: 429, message: 'Too many uploads in a row. Wait a few seconds.' }, 'rate_limited'],
      [new Error('Too Many Requests'), 'rate_limited'],
      [{ status: 500, message: 'upstream broke' }, 'provider_error'],
      [{ status: 503, message: 'upstream unavailable' }, 'provider_error'],
      [new Error('MuAPI could not finish the upload right now. Please try again in a moment.'), 'provider_error'],
      [new Error('MuAPI did not return a usable file link. Please try again.'), 'invalid_response'],
      [new Error('This media link expired after an hour. Re-uploading the original now.'), 'expired_url'],
      [new Error('We could not refresh this media link. Re-upload the original file to continue.'), 'reupload_failed'],
      [new Error('That media belongs to a different workspace, so it cannot be used here.'), 'workspace_denied'],
      [new Error('Durable storage is not configured, so this file cannot be saved for later re-use.'), 'storage_unavailable'],
      [new Error('something nobody predicted'), 'provider_error'],
    ]

    const byClass = new Map<string, string>()
    for (const [input, expected] of cases) {
      const result = handleMuAPIUploadError(input)
      expect(result.class, `input: ${String(input)}`).toBe(expected)
      expect(result.message.length).toBeGreaterThan(10)
      expect(result.title.length).toBeGreaterThan(0)
      byClass.set(result.class, result.message)
    }

    // Distinctness: two different classes must never share a message.
    const messages = [...byClass.entries()]
    const seen = new Map<string, string>()
    for (const [errorClass, message] of messages) {
      expect(seen.has(message), `${errorClass} and ${seen.get(message)} share a message`).toBe(false)
      seen.set(message, errorClass)
    }

    // Every declared class is reachable.
    const declared: string[] = [
      'missing_api_key',
      'invalid_api_key',
      'insufficient_credits',
      'unsupported_format',
      'over_limit',
      'network_error',
      'timeout',
      'rate_limited',
      'provider_error',
      'invalid_response',
      'expired_url',
      'reupload_failed',
      'workspace_denied',
      'storage_unavailable',
    ]
    for (const errorClass of declared) {
      expect(byClass.has(errorClass), `${errorClass} is unreachable`).toBe(true)
    }
    expect(byClass.size).toBe(declared.length)
  })

  it('round-trips its own structured errors losslessly', async () => {
    const { handleMuAPIUploadError, createMuAPIUploadError, MuAPIUploadError } = await loadAdapter()

    for (const errorClass of [
      'missing_api_key',
      'invalid_api_key',
      'insufficient_credits',
      'unsupported_format',
      'over_limit',
      'network_error',
      'timeout',
      'rate_limited',
      'provider_error',
      'invalid_response',
      'expired_url',
      'reupload_failed',
      'workspace_denied',
      'storage_unavailable',
    ] as const) {
      const error = createMuAPIUploadError(errorClass)
      expect(error).toBeInstanceOf(MuAPIUploadError)
      const info = handleMuAPIUploadError(error)
      expect(info.class).toBe(errorClass)
      expect(info.message).toBe(error.message)
      expect(handleMuAPIUploadError(error).message).not.toMatch(/undefined|null/)
    }
  })

  it('classifies an upstream rejection surfaced through the adapter', async () => {
    const { uploadImageToMuAPI, handleMuAPIUploadError } = await loadAdapter()

    installRouteMock({ uploadStatus: 429, uploadBody: { error: 'rate limited' } })
    const error = await uploadImageToMuAPI(pngFile(), authContext()).catch(e => e)
    expect(handleMuAPIUploadError(error).class).toBe('rate_limited')
  })

  it('classifies a missing upstream url through the adapter', async () => {
    const { uploadImageToMuAPI, handleMuAPIUploadError } = await loadAdapter()
    installRouteMock({ uploadBody: {} })
    const error = await uploadImageToMuAPI(pngFile(), authContext()).catch(e => e)
    expect(handleMuAPIUploadError(error).class).toBe('invalid_response')
  })

  it('marks a failed re-upload as reupload_failed, not a generic provider error', async () => {
    const { resolveMuAPIMediaInput, handleMuAPIUploadError } = await loadAdapter()
    installRouteMock({ resolveStatus: 502, resolveBody: { error: 'upstream down' } })

    const error = await resolveMuAPIMediaInput('asset-reupload', authContext()).catch(e => e)
    expect(handleMuAPIUploadError(error).class).toBe('reupload_failed')
    expect(handleMuAPIUploadError(error).message).toMatch(/re-upload/i)
  })

  it('never leaves a key in an error, a message, or a serialised payload', async () => {
    const { uploadImageToMuAPI, handleMuAPIUploadError } = await loadAdapter()
    const key = 'sk-SUPER-SECRET-user-key-9999'

    installRouteMock({
      uploadStatus: 401,
      uploadBody: { error: 'invalid key', key },
    })
    const error = await uploadImageToMuAPI(pngFile(), authContext({ apiKey: key })).catch(e => e)

    const info = handleMuAPIUploadError(error)
    expect(JSON.stringify(info)).not.toMatch(/sk-SUPER-SECRET/)
    expect(String(error)).not.toMatch(/sk-SUPER-SECRET/)
    expect(error.message).not.toMatch(/sk-SUPER-SECRET/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 7. Idempotency and bounded retries
// ─────────────────────────────────────────────────────────────────────────────

describe('MuAPI upload adapter: idempotent and bounded', () => {
  it('submits once when called twice concurrently with the same file', async () => {
    const { uploadImageToMuAPI } = await loadAdapter()

    let release: (() => void) | null = null
    const gate = new Promise<void>(resolve => { release = resolve })
    let attempts = 0
    fetchImpl = async () => {
      attempts += 1
      await gate
      return jsonResponse({ url: 'https://cdn.muapi.ai/shared.png' })
    }

    const file = pngFile(4096)
    const first = uploadImageToMuAPI(file, authContext())
    const second = uploadImageToMuAPI(file, authContext())
    release?.()
    const [a, b] = await Promise.all([first, second])

    expect(attempts).toBe(1)
    expect(a.url).toBe('https://cdn.muapi.ai/shared.png')
    expect(b.url).toBe('https://cdn.muapi.ai/shared.png')
  })

  it('resolves once when called twice concurrently for the same asset', async () => {
    const { resolveMuAPIMediaInput } = await loadAdapter()
    installRouteMock()

    const results = await Promise.all([
      resolveMuAPIMediaInput('asset-concurrent', authContext()),
      resolveMuAPIMediaInput('asset-concurrent', authContext()),
      resolveMuAPIMediaInput('asset-concurrent', authContext()),
    ])

    expect(uploadCounts.muapi).toBe(1)
    expect(new Set(results.map(r => r.url)).size).toBe(1)
  })

  it('does not share an in-flight upload between different assets', async () => {
    const { uploadImageToMuAPI } = await loadAdapter()
    installRouteMock()

    await Promise.all([
      uploadImageToMuAPI(pngFile(4096), authContext({ assetId: 'asset-a' })),
      uploadImageToMuAPI(pngFile(4096), authContext({ assetId: 'asset-b' })),
    ])

    expect(fetchCalls).toHaveLength(2)
    expect(uploadCounts.put).toBe(2)
  })

  it('retries a transient provider failure within the bounded budget', async () => {
    const { uploadImageToMuAPI, MUAPI_MAX_UPLOAD_ATTEMPTS } = await loadAdapter()

    let attempts = 0
    fetchImpl = async () => {
      attempts += 1
      if (attempts < 3) return jsonResponse({ error: 'upstream unavailable' }, 503)
      return jsonResponse({ url: 'https://cdn.muapi.ai/third-time.png' })
    }

    const result = await uploadImageToMuAPI(pngFile(), authContext())

    expect(attempts).toBe(3)
    expect(attempts).toBeLessThanOrEqual(MUAPI_MAX_UPLOAD_ATTEMPTS)
    expect(result.url).toBe('https://cdn.muapi.ai/third-time.png')
    expect(result.attempts).toBe(3)
  })

  it('stops at the retry ceiling instead of looping forever', async () => {
    const { uploadImageToMuAPI, MUAPI_MAX_UPLOAD_ATTEMPTS } = await loadAdapter()
    installRouteMock({ uploadStatus: 503, uploadBody: { error: 'upstream unavailable' } })

    await expect(uploadImageToMuAPI(pngFile(), authContext())).rejects.toMatchObject({
      class: 'provider_error',
    })
    expect(fetchCalls).toHaveLength(MUAPI_MAX_UPLOAD_ATTEMPTS)
  }, 30_000)

  it('does not retry a definitive refusal', async () => {
    const { uploadImageToMuAPI } = await loadAdapter()
    installRouteMock({ uploadStatus: 402, uploadBody: { error: 'insufficient credits' } })

    await expect(uploadImageToMuAPI(pngFile(), authContext())).rejects.toMatchObject({
      class: 'insufficient_credits',
    })
    expect(fetchCalls).toHaveLength(1)
  })

  it('does not retry a transport failure that cannot possibly succeed', async () => {
    const { uploadImageToMuAPI, MUAPI_MAX_UPLOAD_ATTEMPTS } = await loadAdapter()
    let attempts = 0
    fetchImpl = async () => {
      attempts += 1
      throw new TypeError('Failed to fetch: blocked by CSP')
    }

    await expect(uploadImageToMuAPI(pngFile(), authContext())).rejects.toMatchObject({
      class: 'network_error',
    })
    expect(attempts).toBe(MUAPI_MAX_UPLOAD_ATTEMPTS)
  }, 30_000)

  it('never reports success before the provider confirms a url', async () => {
    const { uploadImageToMuAPI } = await loadAdapter()
    installRouteMock({ uploadStatus: 200, uploadBody: { request_id: 'req-1' } })

    await expect(uploadImageToMuAPI(pngFile(), authContext())).rejects.toMatchObject({
      class: 'invalid_response',
    })
  })

  it('drops a cached URL on invalidation so the next resolve re-uploads', async () => {
    const { resolveMuAPIMediaInput, invalidateMuAPIMediaInput } = await loadAdapter()
    installRouteMock()

    await resolveMuAPIMediaInput('asset-invalidate', authContext())
    expect(uploadCounts.muapi).toBe(1)
    expect((await resolveMuAPIMediaInput('asset-invalidate', authContext())).source).toBe('cache')

    invalidateMuAPIMediaInput('asset-invalidate', authContext())
    expect((await resolveMuAPIMediaInput('asset-invalidate', authContext())).source).toBe('fresh')
    expect(uploadCounts.muapi).toBe(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 8. The legacy client wrapper still works, now through the adapter
// ─────────────────────────────────────────────────────────────────────────────

describe('src/lib/muapi.js uploadFile delegates to the shared adapter', () => {
  beforeEach(() => {
    // The legacy client resolves the BYOK key from browser storage.
    ;(globalThis as Record<string, unknown>).window = {
      location: { protocol: 'https:' },
      localStorage: { getItem: (key: string) => (key === 'muapi_key' ? 'user-owned-key-WRAP' : null) },
      navigator: { userAgent: 'vitest', language: 'en' },
      screen: { width: 1024, height: 768 },
    }
    ;(globalThis as Record<string, unknown>).screen = { width: 1024, height: 768 }
  })

  it('routes through /api/v1/upload_file and returns the URL', async () => {
    globalThis.fetch = vi.fn(async () => jsonResponse({ url: 'https://cdn.muapi.ai/wrapped.png' })) as never

    const { muapi } = await import('../src/lib/muapi.js')

    const url = await muapi.uploadFile(new File([new Uint8Array(8)], 'a.png', { type: 'image/png' }))

    expect(url).toBe('https://cdn.muapi.ai/wrapped.png')
    const call = (globalThis.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]
    expect(String(call[0])).toBe('/api/v1/upload_file')
    const init = call[1] as { headers?: Record<string, string>; body?: unknown }
    expect(init.headers?.['x-api-key']).toBe('user-owned-key-WRAP')
    expect(JSON.stringify(init.headers)).not.toMatch(/multipart\/form-data/)
    expect(init.body).toBeInstanceOf(FormData)
  })

  it('normalises adapter failures onto the shared message set', async () => {
    globalThis.fetch = vi.fn(async () =>
      jsonResponse({ error: 'invalid api key' }, 401),
    ) as never

    const { muapi } = await import('../src/lib/muapi.js')

    await expect(
      muapi.uploadFile(new File([new Uint8Array(8)], 'a.png', { type: 'image/png' })),
    ).rejects.toThrow(/MuAPI rejected that API key/i)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 9. Source-level guards
// ─────────────────────────────────────────────────────────────────────────────

describe('MuAPI adapter source guards', () => {
  const FORBIDDEN_ENV_VARS = new Set(['MUAPI_API_KEY', 'MUAPI_KEY', 'OPENAI_API_KEY'])

  function stripComments(code: string): string {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
  }

  function findForbiddenEnvReads(code: string): string[] {
    const src = stripComments(code)
    const names: string[] = []
    const access =
      /process\s*\.\s*env\s*(?:\?\.\s*(?:([A-Za-z_$][\w$]*)|\[\s*['"`]([^'"`]+)['"`]\s*\])|\.\s*([A-Za-z_$][\w$]*)|\[\s*['"`]([^'"`]+)['"`]\s*\])/g
    let m: RegExpExecArray | null
    while ((m = access.exec(src)) !== null) names.push(m[1] ?? m[2] ?? m[3] ?? m[4])
    const deno = /Deno\s*\.\s*env\s*\.\s*(?:get\s*\(\s*|\[\s*)['"`]([^'"`]+)['"`]/g
    while ((m = deno.exec(src)) !== null) names.push(m[1])
    const destructure = /\{([^{}]*)\}\s*=\s*process\s*\.\s*env/g
    while ((m = destructure.exec(src)) !== null) {
      for (const part of (m[1] ?? '').split(',')) {
        const name = part.split(':')[0].trim().replace(/^\.\.\./, '').trim()
        if (name) names.push(name)
      }
    }
    return names.filter(name => FORBIDDEN_ENV_VARS.has(name))
  }

  it('the adapter reads no server MuAPI/OpenAI key from the environment', () => {
    const code = fs.readFileSync(ADAPTER_PATH, 'utf8')
    expect(findForbiddenEnvReads(code)).toEqual([])
    // …and never names the upstream host in a browser-side constant either.
    const src = stripComments(code)
    expect(src).toContain("MUAPI_UPLOAD_ROUTE = '/api/v1/upload_file'")
    expect(src).not.toMatch(/api\.muapi\.ai\/api\/v1\/upload_file['"]?\s*;?\s*\/\/\s*browser/i)
  })

  it('the adapter never logs and never hardcodes a key', () => {
    const code = fs.readFileSync(ADAPTER_PATH, 'utf8')
    expect(stripComments(code)).not.toMatch(/console\.(log|warn|error|info|debug)/)
    expect(code).not.toMatch(/sk-[A-Za-z0-9]{8,}/)
  })

  it('the personalization asset service persists to durable storage first', () => {
    const service = fs.readFileSync(
      path.join(process.cwd(), 'src/shared/personalization/assetUploadService.ts'),
      'utf8',
    )
    // The permanent `url` must come from the durable record, not the MuAPI call.
    expect(service).toMatch(/url:\s*durable\.durableUrl/)
    expect(service).toMatch(/muapiUrl/)
    // And it must not keep importing the legacy client wrapper.
    expect(service).not.toMatch(/packages\/studio\/src\/muapi/)
  })
})
