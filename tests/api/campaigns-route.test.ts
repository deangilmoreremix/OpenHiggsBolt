import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(url, init)
}

describe('POST /api/campaigns', () => {
  it('returns 400 without brand_id or goal', async () => {
    const req = makeRequest('http://localhost/api/campaigns', { method: 'POST', body: JSON.stringify({}) })
    const res = await (await import('@/app/api/campaigns/route')).POST(req)
    expect(res.status).toBe(400)
  })
})
