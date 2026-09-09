import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(url, init)
}

describe('POST /api/animate', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('@clerk/nextjs/server', () => ({
      auth: async () => ({ userId: 'test_user' }),
    }))
  })

  it('returns 400 without source_url', async () => {
    const req = makeRequest('http://localhost/api/animate', { method: 'POST', body: JSON.stringify({}) })
    const res = await (await import('@/app/api/animate/route')).POST(req)
    expect(res.status).toBe(400)
  })
})
