import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('/app/api/v1/lib/auth', () => ({
  getMuApiKeyFromRequest: vi.fn(async () => 'test-key'),
}))

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => ({
    ok: true, status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    async json() { return { items: [] } },
    async text() { return '{}' },
  }))
})

afterEach(() => { vi.restoreAllMocks() })

describe('alias mock test', () => {
  it('mocks /app/api/v1/lib/auth', async () => {
    const { GET } = await import('@/app/api/v1/[...slug]/route')
    const { NextRequest } = await import('next/server')
    const req = new NextRequest(new URL('http://localhost/api/v1/get_upload_url'), {
      headers: { 'x-api-key': 'direct' }
    })
    const res = await GET(req, { params: { slug: ['get_upload_url'] } })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('items')
  })
})
