import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

/**
 * `src/server/demoRateLimit.ts` keeps the anonymous demo quota in Supabase so
 * it is shared across Netlify Lambda instances, and it fails CLOSED: every
 * unusable-quota condition raises `DemoQuotaStoreError` (the route answers 503)
 * rather than letting anonymous outbound crawling through unmeasured.
 *
 * The fake RPC below mirrors `demo_consume_quota` from
 * supabase/migrations/20261014000000_demo_discovery_limits.sql: one atomic
 * increment per call, a window that restarts once it has expired, and a
 * `retry_after_ms` of 0 only while the caller is still allowed.
 */

let createServerClientImpl: () => unknown = () => {
  throw new Error('missing env')
}

let rpcCalls: Array<{ name: string; args: Record<string, unknown> }> = []

const DEMO_QUOTA_RPC = 'demo_consume_quota'
const DEMO_RATE_LIMIT_MAX_REQUESTS = 10
const DEMO_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000

beforeEach(() => {
  vi.resetModules()
  rpcCalls = []
  createServerClientImpl = () => {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable')
  }

  vi.doMock('@/lib/supabase', () => ({
    createServerClient: () => createServerClientImpl(),
  }))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

/** In-test fake of the windowed counter the migration implements in SQL. */
function createFakeQuotaStore() {
  const buckets = new Map<string, { requestCount: number; windowExpiresAt: number }>()
  let now = 1_700_000_000_000

  return {
    advance(ms: number) {
      now += ms
    },
    rpc: async (name: string, args?: Record<string, unknown>) => {
      rpcCalls.push({ name, args: args || {} })
      if (name !== DEMO_QUOTA_RPC) return { data: null, error: { message: 'unknown rpc' } }

      const key = String(args?.p_key ?? '')
      const max = Number(args?.p_max ?? 0)
      const windowMs = Number(args?.p_window_ms ?? 0)
      const previous = buckets.get(key)
      const next =
        !previous || previous.windowExpiresAt <= now
          ? { requestCount: 1, windowExpiresAt: now + windowMs }
          : { requestCount: previous.requestCount + 1, windowExpiresAt: previous.windowExpiresAt }
      buckets.set(key, next)

      const allowed = next.requestCount <= max
      return {
        data: {
          allowed,
          remaining: Math.max(0, max - next.requestCount),
          retry_after_ms: allowed ? 0 : Math.max(0, next.windowExpiresAt - now),
        },
        error: null,
      }
    },
  }
}

describe('demo_consume_quota: the shared, cross-instance limiter', () => {
  it('allows up to the named limit', async () => {
    const store = createFakeQuotaStore()
    createServerClientImpl = () => ({ rpc: store.rpc })

    const { consumeDemoQuota, DEMO_RATE_LIMIT_MAX_REQUESTS: max } = await import('@/server/demoRateLimit')

    expect(max).toBe(DEMO_RATE_LIMIT_MAX_REQUESTS)

    for (let attempt = 0; attempt < max; attempt += 1) {
      const result = await consumeDemoQuota('198.51.100.7')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(max - attempt - 1)
      expect(result.retryAfterMs).toBe(0)
    }
    expect(rpcCalls).toHaveLength(max)
  })

  it('blocks the request after the limit and reports the time left in the window', async () => {
    const store = createFakeQuotaStore()
    createServerClientImpl = () => ({ rpc: store.rpc })

    const { consumeDemoQuota, DEMO_RATE_LIMIT_MAX_REQUESTS: max } = await import('@/server/demoRateLimit')

    for (let attempt = 0; attempt < max; attempt += 1) {
      await consumeDemoQuota('198.51.100.8')
    }

    store.advance(60_000)
    const blocked = await consumeDemoQuota('198.51.100.8')

    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retryAfterMs).toBe(DEMO_RATE_LIMIT_WINDOW_MS - 60_000)
  })

  it('keeps buckets independent per key', async () => {
    const store = createFakeQuotaStore()
    createServerClientImpl = () => ({ rpc: store.rpc })

    const { consumeDemoQuota, DEMO_RATE_LIMIT_MAX_REQUESTS: max } = await import('@/server/demoRateLimit')

    for (let attempt = 0; attempt < max; attempt += 1) {
      expect((await consumeDemoQuota('198.51.100.9')).allowed).toBe(true)
    }
    expect((await consumeDemoQuota('198.51.100.9')).allowed).toBe(false)
    expect((await consumeDemoQuota('198.51.100.10')).allowed).toBe(true)
  })

  it('resets the bucket once the window has expired', async () => {
    const store = createFakeQuotaStore()
    createServerClientImpl = () => ({ rpc: store.rpc })

    const { consumeDemoQuota, DEMO_RATE_LIMIT_MAX_REQUESTS: max, DEMO_RATE_LIMIT_WINDOW_MS: windowMs } =
      await import('@/server/demoRateLimit')

    for (let attempt = 0; attempt < max; attempt += 1) {
      expect((await consumeDemoQuota('198.51.100.11')).allowed).toBe(true)
    }
    expect((await consumeDemoQuota('198.51.100.11')).allowed).toBe(false)

    store.advance(windowMs + 1)
    const afterWindow = await consumeDemoQuota('198.51.100.11')

    expect(afterWindow.allowed).toBe(true)
    expect(afterWindow.remaining).toBe(max - 1)
    expect(afterWindow.retryAfterMs).toBe(0)
  })

  it('calls the migration RPC by name with the documented arguments', async () => {
    const store = createFakeQuotaStore()
    createServerClientImpl = () => ({ rpc: store.rpc })

    const { consumeDemoQuota } = await import('@/server/demoRateLimit')
    await consumeDemoQuota('198.51.100.12')

    expect(rpcCalls).toHaveLength(1)
    expect(rpcCalls[0].name).toBe('demo_consume_quota')
    expect(rpcCalls[0].args).toMatchObject({
      p_key: '198.51.100.12',
      p_max: DEMO_RATE_LIMIT_MAX_REQUESTS,
      p_window_ms: DEMO_RATE_LIMIT_WINDOW_MS,
    })
  })

  it('honours an explicit max/window override', async () => {
    const store = createFakeQuotaStore()
    createServerClientImpl = () => ({ rpc: store.rpc })

    const { consumeDemoQuota } = await import('@/server/demoRateLimit')
    await consumeDemoQuota('198.51.100.13', { max: 2, windowMs: 5_000 })

    expect(rpcCalls[0].args).toMatchObject({ p_max: 2, p_window_ms: 5000 })
  })

  it('fails closed when the RPC errors', async () => {
    createServerClientImpl = () => ({
      rpc: async () => ({ data: null, error: { message: 'permission denied for function demo_consume_quota' } }),
    })

    const { consumeDemoQuota, DemoQuotaStoreError } = await import('@/server/demoRateLimit')

    await expect(consumeDemoQuota('198.51.100.14')).rejects.toBeInstanceOf(DemoQuotaStoreError)
  })

  it('fails closed when the RPC throws at the transport level', async () => {
    createServerClientImpl = () => ({
      rpc: async () => {
        throw new Error('fetch failed')
      },
    })

    const { consumeDemoQuota, DemoQuotaStoreError } = await import('@/server/demoRateLimit')

    await expect(consumeDemoQuota('198.51.100.15')).rejects.toBeInstanceOf(DemoQuotaStoreError)
  })

  it('fails closed when the RPC returns an unusable result', async () => {
    createServerClientImpl = () => ({ rpc: async () => ({ data: null, error: null }) })

    const { consumeDemoQuota, DemoQuotaStoreError } = await import('@/server/demoRateLimit')

    await expect(consumeDemoQuota('198.51.100.16')).rejects.toBeInstanceOf(DemoQuotaStoreError)
  })

  it('fails closed when the RPC result omits `allowed`', async () => {
    createServerClientImpl = () => ({ rpc: async () => ({ data: { remaining: 3 }, error: null }) })

    const { consumeDemoQuota, DemoQuotaStoreError } = await import('@/server/demoRateLimit')

    await expect(consumeDemoQuota('198.51.100.17')).rejects.toBeInstanceOf(DemoQuotaStoreError)
  })

  it('fails closed when Supabase is not configured', async () => {
    createServerClientImpl = () => {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable')
    }

    const { consumeDemoQuota, DemoQuotaStoreError } = await import('@/server/demoRateLimit')

    await expect(consumeDemoQuota('198.51.100.18')).rejects.toBeInstanceOf(DemoQuotaStoreError)
  })

  it('fails closed when the quota key is empty, so a bucket cannot be minted at will', async () => {
    const store = createFakeQuotaStore()
    createServerClientImpl = () => ({ rpc: store.rpc })

    const { consumeDemoQuota, DemoQuotaStoreError } = await import('@/server/demoRateLimit')

    await expect(consumeDemoQuota('   ')).rejects.toBeInstanceOf(DemoQuotaStoreError)
    expect(rpcCalls).toHaveLength(0)
  })

  it('exposes a stable error code for the safe 503 log line', async () => {
    createServerClientImpl = () => {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable')
    }

    const { consumeDemoQuota, DemoQuotaStoreError } = await import('@/server/demoRateLimit')

    await expect(consumeDemoQuota('198.51.100.19')).rejects.toMatchObject({
      code: 'DEMO_QUOTA_STORE_UNAVAILABLE',
    })
    await expect(consumeDemoQuota('198.51.100.19')).rejects.toBeInstanceOf(DemoQuotaStoreError)
  })
})
