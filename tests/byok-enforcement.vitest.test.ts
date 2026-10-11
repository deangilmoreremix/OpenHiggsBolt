import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

/**
 * BYOK (bring-your-own-key) enforcement tests.
 *
 * The non-negotiable property under test: MuAPI and OpenAI operations always
 * use the AUTHENTICATED USER'S OWN key. A server-side env key is never used as
 * a fallback, never preferred, and a missing user key always produces a clear
 * "add it in Settings" error instead of an operator-billed upstream call.
 *
 * To prove the negative, every test sets the forbidden server-side keys to a
 * sentinel value, then asserts the sentinel never reaches an upstream call.
 */

const ENV_MUAPI_SENTINEL = 'sk-SENTINEL-server-muapi-key-DO-NOT-USE'
const OPENAI_ENV_SENTINEL = 'sk-SENTINEL-server-openai-key-DO-NOT-USE'
const USER_HEADER_KEY = 'user-owned-muapi-key-AAAA'
const USER_STORED_KEY = 'user-owned-muapi-key-BBBB'
const USER_OPENAI_KEY = 'sk-user-openai-key-CCCC'

const MUAPI_KEY_MISSING_MESSAGE = 'Add your MuAPI API key in Settings to use this feature.'

const h = vi.hoisted(() => ({
  // Clerk session for the current test (null = unauthenticated).
  userId: null as string | null,
  // Per-user rows, emulating the DB filter on clerk_user_id.
  rowsByUser: {} as Record<string, { muapi_key?: string; openai_key?: string } | null>,
  // Every .eq(column, value) the code under test issued, in order.
  eqCalls: [] as Array<{ column: string; value: unknown }>,
  // Simulate an unavailable/misconfigured store.
  supabaseThrows: false,
  // Recorded rate-limit keys and a toggle for the limiter verdict.
  rateLimitCalls: [] as string[],
  rateLimitAllowed: true,
}))

let fetchMock: ReturnType<typeof vi.fn>

function makeUpstreamResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    async json() {
      return body
    },
    async text() {
      return JSON.stringify(body)
    },
  }
}

/** Every upstream call made so far, with its resolved headers. */
function upstreamCalls() {
  return fetchMock.mock.calls.map((call) => {
    const url = String(call[0])
    const init = (call[1] ?? {}) as { method?: string; headers?: Record<string, string> }
    return { url, method: init.method, headers: init.headers ?? {} }
  })
}

/** The `x-api-key` values actually sent to MuAPI upstream. */
function muapiUpstreamKeys() {
  return upstreamCalls()
    .filter((c) => c.url.includes('muapi'))
    .map((c) => c.headers['x-api-key'])
}

function generationRequest(extraHeaders: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/vfx/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...extraHeaders },
    body: JSON.stringify({
      prompt: 'make it explode',
      image_url: 'https://example.com/in.png',
      effect: 'Car Explosion',
    }),
  })
}

function statusRequest(id: string, extraHeaders: Record<string, string> = {}) {
  return new NextRequest(`http://localhost/api/vfx/status?id=${id}`, {
    headers: { ...extraHeaders },
  })
}

function cancelRequest(requestId: string, extraHeaders: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/vfx/cancel', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...extraHeaders },
    body: JSON.stringify({ request_id: requestId }),
  })
}

function uploadRequest(extraHeaders: Record<string, string> = {}) {
  const formData = new FormData()
  formData.append('file', new File(['x'], 'a.png', { type: 'image/png' }))
  return new NextRequest('http://localhost/api/vfx/upload', {
    method: 'POST',
    headers: { ...extraHeaders },
    body: formData,
  })
}

beforeEach(() => {
  vi.resetModules()
  h.userId = null
  h.rowsByUser = {}
  h.eqCalls = []
  h.supabaseThrows = false
  h.rateLimitCalls = []
  h.rateLimitAllowed = true

  // The forbidden server-side keys are present in EVERY test. Any code path
  // that uses them is a BYOK violation.
  process.env.MUAPI_API_KEY = ENV_MUAPI_SENTINEL
  process.env.MUAPI_KEY = ENV_MUAPI_SENTINEL
  process.env.OPENAI_API_KEY = OPENAI_ENV_SENTINEL

  vi.doMock('@clerk/nextjs/server', () => ({
    auth: async () => ({ userId: h.userId }),
  }))

  vi.doMock('@/src/lib/supabaseServer', () => ({
    getSupabaseAdmin: () => {
      if (h.supabaseThrows) throw new Error('supabase unavailable')
      return {
        from: (table: string) => ({
          select: (columns: string) => ({
            eq: (column: string, value: unknown) => {
              h.eqCalls.push({ column, value })
              // Emulate the DB: only the row whose clerk_user_id matches is
              // visible, so a wrong-scoped query would find nothing.
              return {
                maybeSingle: async () => ({
                  data: h.rowsByUser[String(value)] ?? null,
                  error: null,
                }),
              }
            },
          }),
        }),
      }
    },
    getSupabaseAsUser: async () => {
      throw new Error('not used in BYOK tests')
    },
    getSupabaseService: () => {
      throw new Error('not used in BYOK tests')
    },
  }))

  vi.doMock('@/access/apiRequireEntitlement', () => ({
    requireApiEntitlement: vi.fn(async () => ({ allowed: true })),
    entitlementForbiddenResponse: vi.fn(
      () => new Response(JSON.stringify({ error: 'PAYMENT_REQUIRED' }), { status: 403 })
    ),
  }))

  // The real limiter lives in lib/rateLimit.ts (a root-level module the VFX
  // routes import). It is mocked only to observe the limiter key and verdict;
  // the routes still call it exactly as before. resolveRateLimitKey is
  // re-implemented faithfully (userId || clientIp || 'anon').
  vi.doMock('@/lib/rateLimit', () => ({
    rateLimit: (key: string) => {
      h.rateLimitCalls.push(key)
      return { allowed: h.rateLimitAllowed, retryAfterMs: 60_000 }
    },
    rateLimit429: () =>
      new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429 }),
    resolveRateLimitKey: (userId?: string | null, clientIp?: string | null) =>
      userId || clientIp || 'anon',
  }))

  fetchMock = vi.fn(async () => makeUpstreamResponse({ request_id: 'req-1', status: 'queued' }))
  vi.spyOn(globalThis, 'fetch').mockImplementation(fetchMock as never)
})

afterEach(() => {
  vi.restoreAllMocks()
  delete process.env.MUAPI_API_KEY
  delete process.env.MUAPI_KEY
  delete process.env.OPENAI_API_KEY
  delete (globalThis as Record<string, unknown>).window
  delete (globalThis as Record<string, unknown>).localStorage
})

// ─────────────────────────────────────────────────────────────────────────────
// 1. Env sentinel set + NO user key → every MuAPI surface fails with the
//    Settings-directed error and NEVER calls upstream with the env key.
// ─────────────────────────────────────────────────────────────────────────────
describe('BYOK: server env key is never used when the user has no key', () => {
  it('generate returns 400 with the Settings error (unauthenticated)', async () => {
    const { POST } = await import('@/app/api/vfx/generate/route')

    const res = await POST(generationRequest())

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe(MUAPI_KEY_MISSING_MESSAGE)
    expect(json.error).toMatch(/Settings/i)
    // No upstream call at all, hence never with the env key.
    expect(fetchMock).not.toHaveBeenCalled()
    expect(muapiUpstreamKeys()).not.toContain(ENV_MUAPI_SENTINEL)
  })

  it('generate returns 400 when a session exists but has no stored key', async () => {
    h.userId = 'user-1'
    h.rowsByUser = {}

    const { POST } = await import('@/app/api/vfx/generate/route')
    const res = await POST(generationRequest())

    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe(MUAPI_KEY_MISSING_MESSAGE)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('generate returns 400 when the store is unavailable (not a 500)', async () => {
    h.userId = 'user-1'
    h.supabaseThrows = true

    const { POST } = await import('@/app/api/vfx/generate/route')
    const res = await POST(generationRequest())

    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe(MUAPI_KEY_MISSING_MESSAGE)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('status returns 400 with the Settings error and never polls upstream', async () => {
    const { GET } = await import('@/app/api/vfx/status/route')

    const res = await GET(statusRequest('job-1'))

    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe(MUAPI_KEY_MISSING_MESSAGE)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('status returns 400 for a signed-in user with no stored key', async () => {
    h.userId = 'user-1'
    h.rowsByUser = {}

    const { GET } = await import('@/app/api/vfx/status/route')
    const res = await GET(statusRequest('job-1'))

    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('upload returns 400 with the Settings error and never uploads upstream', async () => {
    const { POST } = await import('@/app/api/vfx/upload/route')

    const res = await POST(uploadRequest())

    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe(MUAPI_KEY_MISSING_MESSAGE)
    expect(fetchMock).not.toHaveBeenCalled()
    // Rate limiting is not consumed for a request that cannot be authorized.
    expect(h.rateLimitCalls).not.toContain(ENV_MUAPI_SENTINEL)
  })

  it('cancel still succeeds locally but never probes upstream with a server key', async () => {
    const { POST } = await import('@/app/api/vfx/cancel/route')

    const res = await POST(cancelRequest('job-7'))

    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ cancelled: true, status: 'cancelled' })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(muapiUpstreamKeys()).not.toContain(ENV_MUAPI_SENTINEL)
  })

  it('resolveMuAPIKey returns "" with env sentinels set and no user key', async () => {
    const { resolveMuAPIKey } = await import('@/app/api/vfx/_helpers')
    await expect(resolveMuAPIKey()).resolves.toBe('')
    await expect(
      resolveMuAPIKey({ headers: new Headers() } as never)
    ).resolves.toBe('')

    h.userId = 'user-1'
    h.rowsByUser = {}
    await expect(resolveMuAPIKey({ headers: new Headers() } as never)).resolves.toBe('')
  })

  it('resolveMuAPIKey returns "" for a stored value that cannot be decrypted', async () => {
    h.userId = 'user-1'
    h.rowsByUser = { 'user-1': { muapi_key: 'v1:only:two' } }

    const { resolveMuAPIKey } = await import('@/app/api/vfx/_helpers')
    await expect(resolveMuAPIKey({ headers: new Headers() } as never)).resolves.toBe('')
  })

  it('validateMuAPIKey throws the Settings-directed error', async () => {
    const { validateMuAPIKey, isMuapiKeyMissingError, MUAPI_KEY_MISSING_MESSAGE } = await import(
      '@/app/api/vfx/_helpers'
    )

    await expect(validateMuAPIKey()).rejects.toThrow(MUAPI_KEY_MISSING_MESSAGE)
    await expect(validateMuAPIKey()).rejects.toSatisfy(isMuapiKeyMissingError)
  })

  it('getServerVFXClient refuses an empty key instead of using the env key', async () => {
    const { getServerVFXClient, MUAPI_KEY_MISSING_ERROR } = await import('@/api/vfx')

    expect(() => getServerVFXClient('')).toThrow(MUAPI_KEY_MISSING_ERROR)
    expect(() => getServerVFXClient('   ')).toThrow(/Settings/i)
    expect(() => (getServerVFXClient as unknown as () => void)()).toThrow(/Settings/i)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('MuAPIVFXClient refuses an empty apiKey with the Settings message', async () => {
    const { MuAPIVFXClient } = await import('@/api/vfx')
    expect(() => new MuAPIVFXClient({ apiKey: '' })).toThrow(/MuAPI key is required/)
    expect(() => new MuAPIVFXClient({ apiKey: '' })).toThrow(/Settings/i)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. Env sentinel AND a user key → the USER key is the one used upstream.
// ─────────────────────────────────────────────────────────────────────────────
describe('BYOK: the user key always wins over any server env key', () => {
  it('generate uses the x-api-key header key (env ignored)', async () => {
    fetchMock.mockImplementation(async () =>
      makeUpstreamResponse({ request_id: 'req-1', status: 'queued' })
    )

    const { POST } = await import('@/app/api/vfx/generate/route')
    const res = await POST(generationRequest({ 'x-api-key': USER_HEADER_KEY }))

    expect(res.status).toBe(200)
    expect((await res.json()).request_id).toBe('req-1')
    expect(muapiUpstreamKeys()).toContain(USER_HEADER_KEY)
    expect(muapiUpstreamKeys()).not.toContain(ENV_MUAPI_SENTINEL)
    // Rate limiting is maintained and keyed by authenticated identity — never
    // by client-supplied key material, which a caller could rotate.
    expect(h.rateLimitCalls).toEqual(['anon'])
    expect(h.rateLimitCalls).not.toContain(USER_HEADER_KEY)
    expect(h.rateLimitCalls).not.toContain(ENV_MUAPI_SENTINEL)
  })

  it('generate still rate-limits the user key when the limiter rejects', async () => {
    h.rateLimitAllowed = false

    const { POST } = await import('@/app/api/vfx/generate/route')
    const res = await POST(generationRequest({ 'x-api-key': USER_HEADER_KEY }))

    expect(res.status).toBe(429)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('generate uses the signed-in user stored key (env ignored)', async () => {
    h.userId = 'user-1'
    h.rowsByUser = { 'user-1': { muapi_key: USER_STORED_KEY } }

    const { POST } = await import('@/app/api/vfx/generate/route')
    const res = await POST(generationRequest())

    expect(res.status).toBe(200)
    expect(muapiUpstreamKeys()).toEqual([USER_STORED_KEY])
    expect(muapiUpstreamKeys()).not.toContain(ENV_MUAPI_SENTINEL)
  })

  it('status uses the header key and returns the upstream result', async () => {
    fetchMock.mockImplementation(async () =>
      makeUpstreamResponse({ status: 'completed', outputs: ['https://cdn/out.mp4'] })
    )

    const { GET } = await import('@/app/api/vfx/status/route')
    const res = await GET(statusRequest('job-2', { 'x-api-key': USER_HEADER_KEY }))

    expect(res.status).toBe(200)
    expect((await res.json()).video_url).toBe('https://cdn/out.mp4')
    expect(muapiUpstreamKeys()).toEqual([USER_HEADER_KEY])
  })

  it('status uses the signed-in user stored key', async () => {
    h.userId = 'user-2'
    h.rowsByUser = { 'user-2': { muapi_key: USER_STORED_KEY } }
    fetchMock.mockImplementation(async () =>
      makeUpstreamResponse({ status: 'completed', video_url: 'https://cdn/v.mp4' })
    )

    const { GET } = await import('@/app/api/vfx/status/route')
    const res = await GET(statusRequest('job-3'))

    expect(res.status).toBe(200)
    expect(muapiUpstreamKeys()).toEqual([USER_STORED_KEY])
  })

  it('upload uploads with the header key (env ignored)', async () => {
    fetchMock.mockImplementation(async () => makeUpstreamResponse({ url: 'https://cdn/up.png' }))

    const { POST } = await import('@/app/api/vfx/upload/route')
    const res = await POST(uploadRequest({ 'x-api-key': USER_HEADER_KEY }))

    expect(res.status).toBe(200)
    expect((await res.json()).url).toBe('https://cdn/up.png')
    const calls = upstreamCalls().filter((c) => c.url.includes('muapi'))
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe('https://api.muapi.ai/api/v1/upload_file')
    expect(calls[0].headers['x-api-key']).toBe(USER_HEADER_KEY)
    // Rate limiting maintained, keyed by identity rather than key material.
    expect(h.rateLimitCalls).toEqual(['anon'])
    expect(h.rateLimitCalls).not.toContain(USER_HEADER_KEY)
  })

  it('cancel probes upstream with the header key (env ignored)', async () => {
    fetchMock.mockImplementation(async () => makeUpstreamResponse({}, false, 404))

    const { POST } = await import('@/app/api/vfx/cancel/route')
    const res = await POST(cancelRequest('job-9', { 'x-api-key': USER_HEADER_KEY }))

    expect(res.status).toBe(200)
    expect(muapiUpstreamKeys()).toEqual([USER_HEADER_KEY])
    expect(muapiUpstreamKeys()).not.toContain(ENV_MUAPI_SENTINEL)
  })

  it('resolveMuAPIKey prefers the header key, then the stored key — never env', async () => {
    const { resolveMuAPIKey } = await import('@/app/api/vfx/_helpers')

    await expect(
      resolveMuAPIKey({ headers: new Headers({ 'x-api-key': `  ${USER_HEADER_KEY}  ` }) } as never)
    ).resolves.toBe(USER_HEADER_KEY)

    h.userId = 'user-1'
    h.rowsByUser = { 'user-1': { muapi_key: USER_STORED_KEY } }
    await expect(resolveMuAPIKey({ headers: new Headers() } as never)).resolves.toBe(USER_STORED_KEY)
  })

  it('getServerVFXClient binds exactly the caller key it was given', async () => {
    fetchMock.mockImplementation(async () =>
      makeUpstreamResponse({ status: 'completed', outputs: ['https://cdn/v.mp4'] })
    )

    const { getServerVFXClient } = await import('@/api/vfx')
    const client = getServerVFXClient(USER_HEADER_KEY)
    await client.getGenerationResult('job-4')

    expect(muapiUpstreamKeys()).toEqual([USER_HEADER_KEY])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. No cross-user key access: the stored key is always resolved for the
//    Clerk-authenticated userId only.
// ─────────────────────────────────────────────────────────────────────────────
describe('BYOK: stored keys are scoped to the authenticated clerk user id', () => {
  it('resolves user A row for session A and user B row for session B', async () => {
    h.rowsByUser = {
      'user-A': { muapi_key: 'key-for-A' },
      'user-B': { muapi_key: 'key-for-B' },
    }
    const { resolveMuAPIKey } = await import('@/app/api/vfx/_helpers')

    h.userId = 'user-A'
    await expect(resolveMuAPIKey({ headers: new Headers() } as never)).resolves.toBe('key-for-A')
    expect(h.eqCalls).toEqual([{ column: 'clerk_user_id', value: 'user-A' }])

    h.eqCalls.length = 0
    h.userId = 'user-B'
    await expect(resolveMuAPIKey({ headers: new Headers() } as never)).resolves.toBe('key-for-B')
    expect(h.eqCalls).toEqual([{ column: 'clerk_user_id', value: 'user-B' }])
  })

  it('an unauthenticated caller gets no key even when rows exist', async () => {
    h.rowsByUser = { 'user-A': { muapi_key: 'key-for-A' } }
    h.userId = null

    const { resolveMuAPIKey } = await import('@/app/api/vfx/_helpers')
    await expect(resolveMuAPIKey({ headers: new Headers() } as never)).resolves.toBe('')
    // No DB query at all without a session.
    expect(h.eqCalls).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. Source scan: no code path under src/, app/, lib/ resolves a MuAPI/OpenAI
//    key from process.env (regex-based, robust to formatting).
// ─────────────────────────────────────────────────────────────────────────────
describe('BYOK: source scan — no process.env key resolution', () => {
  const FORBIDDEN_ENV_VARS = new Set(['MUAPI_API_KEY', 'MUAPI_KEY', 'OPENAI_API_KEY'])
  const SCAN_DIRS = ['src', 'app', 'lib']
  const SCAN_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
  const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', '__tests__'])

  function stripComments(code: string): string {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      // Strip // line comments but never URLs (the char before // is ':').
      .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
  }

  function findForbiddenEnvReads(code: string): string[] {
    const src = stripComments(code)
    const names: string[] = []

    // process.env.NAME  |  process.env['NAME']  |  process.env?.["NAME"]
    const access = /process\s*\.\s*env\s*(?:\?\.\s*(?:([A-Za-z_$][\w$]*)|\[\s*['"`]([^'"`]+)['"`]\s*\])|\.\s*([A-Za-z_$][\w$]*)|\[\s*['"`]([^'"`]+)['"`]\s*\])/g
    let m: RegExpExecArray | null
    while ((m = access.exec(src)) !== null) {
      names.push(m[1] ?? m[2] ?? m[3] ?? m[4])
    }

    // const { NAME, OTHER: alias } = process.env
    const destructure = /\{([^{}]*)\}\s*=\s*process\s*\.\s*env/g
    while ((m = destructure.exec(src)) !== null) {
      for (const part of (m[1] ?? '').split(',')) {
        const name = part.split(':')[0].trim().replace(/^\.\.\./, '').trim()
        if (name) names.push(name)
      }
    }

    return names.filter((n) => FORBIDDEN_ENV_VARS.has(n))
  }

  function* walk(dir: string): Generator<string> {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SKIP_DIRS.has(entry.name)) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        yield* walk(full)
      } else if (SCAN_EXTS.has(path.extname(entry.name))) {
        if (/\.(test|spec)\./.test(entry.name)) continue
        if (entry.name.endsWith('.d.ts')) continue
        yield full
      }
    }
  }

  it('nothing under src/, app/, lib/ reads a server MuAPI/OpenAI key from process.env', () => {
    const violations: string[] = []
    let scanned = 0

    for (const dir of SCAN_DIRS) {
      const abs = path.join(process.cwd(), dir)
      if (!fs.existsSync(abs)) continue
      for (const file of walk(abs)) {
        scanned += 1
        const found = findForbiddenEnvReads(fs.readFileSync(file, 'utf8'))
        if (found.length > 0) {
          violations.push(`${path.relative(process.cwd(), file)} -> ${found.join(', ')}`)
        }
      }
    }

    // Sanity: the scan must actually have looked at the codebase.
    expect(scanned).toBeGreaterThan(50)
    expect(violations).toEqual([])
  })

  it('the VFX routes themselves contain no env key resolution', async () => {
    const routeFiles = [
      'app/api/vfx/_helpers.ts',
      'app/api/vfx/generate/route.ts',
      'app/api/vfx/status/route.ts',
      'app/api/vfx/cancel/route.ts',
      'app/api/vfx/upload/route.ts',
      'lib/muapi.js',
      'src/shared/api/vfx.ts',
      'src/lib/keys.js',
      'src/lib/openaiKeyServer.ts',
    ]
    for (const rel of routeFiles) {
      const code = fs.readFileSync(path.join(process.cwd(), rel), 'utf8')
      expect(findForbiddenEnvReads(code), `${rel} must not read env keys`).toEqual([])
    }
  })

  it('the shared missing-key message is the one every route returns', async () => {
    const { MUAPI_KEY_MISSING_ERROR } = await import('@/api/vfx')
    expect(MUAPI_KEY_MISSING_ERROR).toBe(MUAPI_KEY_MISSING_MESSAGE)
    const { MUAPI_KEY_MISSING_MESSAGE: helperMessage } = await import('@/app/api/vfx/_helpers')
    expect(helperMessage).toBe(MUAPI_KEY_MISSING_MESSAGE)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. OpenAI: getOpenAiKeyForUser stays user-only — null, never the env key.
// ─────────────────────────────────────────────────────────────────────────────
describe('BYOK: OpenAI key resolution stays user-only', () => {
  it('returns null (never the env key) when unauthenticated', async () => {
    process.env.OPENAI_API_KEY = OPENAI_ENV_SENTINEL
    h.userId = null

    const { getOpenAiKeyForUser } = await import('@/src/lib/openaiKeyServer')
    await expect(getOpenAiKeyForUser()).resolves.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns null when the signed-in user has no stored key', async () => {
    process.env.OPENAI_API_KEY = OPENAI_ENV_SENTINEL
    h.userId = 'user-1'
    h.rowsByUser = {}

    const { getOpenAiKeyForUser } = await import('@/src/lib/openaiKeyServer')
    await expect(getOpenAiKeyForUser()).resolves.toBeNull()
  })

  it('returns the user own key when stored (env ignored)', async () => {
    process.env.OPENAI_API_KEY = OPENAI_ENV_SENTINEL
    h.userId = 'user-1'
    h.rowsByUser = { 'user-1': { openai_key: USER_OPENAI_KEY } }

    const { getOpenAiKeyForUser } = await import('@/src/lib/openaiKeyServer')
    await expect(getOpenAiKeyForUser()).resolves.toBe(USER_OPENAI_KEY)
    expect(h.eqCalls).toEqual([{ column: 'clerk_user_id', value: 'user-1' }])
  })

  it('returns null when the stored value cannot be decrypted', async () => {
    h.userId = 'user-1'
    h.rowsByUser = { 'user-1': { openai_key: 'v1:only:two' } }

    const { getOpenAiKeyForUser } = await import('@/src/lib/openaiKeyServer')
    await expect(getOpenAiKeyForUser()).resolves.toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. Client-side resolution helpers.
// ─────────────────────────────────────────────────────────────────────────────
describe('BYOK: client-side key resolution', () => {
  it('src/lib/keys.js resolveMuapiKey never falls back to the server env key', async () => {
    const { resolveMuapiKey } = await import('../src/lib/keys.js')

    process.env.MUAPI_API_KEY = ENV_MUAPI_SENTINEL
    process.env.MUAPI_KEY = ENV_MUAPI_SENTINEL

    expect(resolveMuapiKey()).toBe('')
    expect(resolveMuapiKey(undefined)).toBe('')
    expect(resolveMuapiKey('')).toBe('')
  })

  it('src/lib/keys.js prefers the explicit arg, then the browser user key', async () => {
    const { resolveMuapiKey } = await import('../src/lib/keys.js')

    expect(resolveMuapiKey(`  ${USER_HEADER_KEY}  `)).toBe(USER_HEADER_KEY)

    ;(globalThis as Record<string, unknown>).window = {
      __MUAPI_KEY__: USER_HEADER_KEY,
      localStorage: { getItem: () => null },
    }
    expect(resolveMuapiKey()).toBe(USER_HEADER_KEY)

    ;(globalThis as Record<string, unknown>).window = {
      localStorage: { getItem: (k: string) => (k === 'muapi_key' ? USER_STORED_KEY : null) },
    }
    expect(resolveMuapiKey()).toBe(USER_STORED_KEY)
  })

  it('src/lib/keys.js OpenAI resolution only uses the public user-supplied value', async () => {
    const { resolveOpenAIKey } = await import('../src/lib/keys.js')

    process.env.NEXT_PUBLIC_OPENAI_API_KEY = 'sk-public-user-supplied'
    expect(resolveOpenAIKey()).toBe('sk-public-user-supplied')
    delete process.env.NEXT_PUBLIC_OPENAI_API_KEY

    ;(globalThis as Record<string, unknown>).window = {
      localStorage: { getItem: (k: string) => (k === 'openai_key' ? USER_OPENAI_KEY : null) },
    }
    expect(resolveOpenAIKey()).toBe(USER_OPENAI_KEY)
  })

  it('lib/muapi.js singleton refuses to run without a user key (env ignored)', async () => {
    const { muapi } = await import('../lib/muapi.js')

    expect(() => muapi.generateVFX({ prompt: 'p', image_url: 'u' } as never)).toThrow(
      /MuAPI key is required/
    )
    expect(() => muapi.generateVFX({ prompt: 'p', image_url: 'u' } as never)).toThrow(/Settings/i)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('lib/muapi.js uses the browser user key and ignores the server env key', async () => {
    ;(globalThis as Record<string, unknown>).window = {}
    ;(globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => (k === 'muapi_key' ? USER_STORED_KEY : null),
    }
    fetchMock.mockImplementation(async () =>
      makeUpstreamResponse({ request_id: 'r-1', status: 'queued' })
    )

    const { muapi } = await import('../lib/muapi.js')
    await muapi.generateVFX({ prompt: 'p', image_url: 'u', effect: 'Car Explosion' })

    expect(muapiUpstreamKeys()).toEqual([USER_STORED_KEY])
    expect(muapiUpstreamKeys()).not.toContain(ENV_MUAPI_SENTINEL)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 7. Regression guard for the cancel/status race, now under BYOK.
//    (Replaces the coverage in the node-only tests/vfx-route.test.js, which
//    depended on the removed server env fallback and is not run by any script
//    or CI workflow.)
// ─────────────────────────────────────────────────────────────────────────────
describe('BYOK: cancel/status race guard with a user key', () => {
  it('pre-cancel poll surfaces the completed MuAPI result', async () => {
    fetchMock.mockImplementation(async () =>
      makeUpstreamResponse({
        status: 'completed',
        outputs: ['https://muapi.ai/video.mp4'],
        video_url: 'https://muapi.ai/video.mp4',
      })
    )

    const { GET } = await import('@/app/api/vfx/status/route')
    const res = await GET(statusRequest('JOB-2', { 'x-api-key': USER_HEADER_KEY }))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('completed')
    expect(json.video_url).toBe('https://muapi.ai/video.mp4')
    expect(muapiUpstreamKeys()).toEqual([USER_HEADER_KEY])
  })

  it('cancel then poll returns cancelled and discards the completed result', async () => {
    fetchMock.mockImplementation(async () =>
      makeUpstreamResponse({
        status: 'completed',
        outputs: ['https://muapi.ai/video.mp4'],
        video_url: 'https://muapi.ai/video.mp4',
      })
    )

    const { POST: cancelPOST } = await import('@/app/api/vfx/cancel/route')
    await cancelPOST(cancelRequest('JOB-1', { 'x-api-key': USER_HEADER_KEY }))

    const { GET } = await import('@/app/api/vfx/status/route')
    const res = await GET(statusRequest('JOB-1', { 'x-api-key': USER_HEADER_KEY }))

    const json = await res.json()
    expect(json.status).toBe('cancelled')
    expect(json.video_url).toBeUndefined()
  })
})
