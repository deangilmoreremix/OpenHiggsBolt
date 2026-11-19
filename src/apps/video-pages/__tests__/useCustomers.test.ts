// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('@/shared/personalization/DemoPersonalizeProvider', () => ({ useDemoPersonalize: () => null, usePersonalizeOrNull: () => null }))
const { fetchWithin, CUSTOMER_REQUEST_LIMIT_MS } = await import('../useCustomers')

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

describe('fetchWithin', () => {
  it('aborts a request that never answers, so "loading" can end', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_res, rej) => {
      init.signal?.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')))
    })))
    const settled = fetchWithin('/api/personalization/project?list=true').then(() => 'answered', () => 'failed')
    await vi.advanceTimersByTimeAsync(CUSTOMER_REQUEST_LIMIT_MS + 1)
    await expect(settled).resolves.toBe('failed')
  })
  it('passes a normal answer through', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ projects: [] }) })))
    const res = await fetchWithin('/api/personalization/leads')
    expect(res.ok).toBe(true)
  })
})
