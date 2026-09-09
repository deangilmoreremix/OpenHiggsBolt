import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(url, init)
}

describe('POST /api/assets', () => {
  it('returns 400 without campaign_id or platform', async () => {
    const req = makeRequest('http://localhost/api/assets', { method: 'POST', body: JSON.stringify({}) })
    const res = await (await import('@/app/api/assets/route')).POST(req)
    expect(res.status).toBe(400)
  })
})
