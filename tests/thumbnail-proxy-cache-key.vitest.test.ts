/**
 * The same-origin thumbnail proxy (/api/thumbnail?url=...) serves every
 * workflow and agent card image. Netlify's cache key ignores query strings
 * unless the response names them in Netlify-Vary, so without it the first
 * cached image was served for every card ("all agents have the same
 * thumbnail").
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { GET } from '../app/api/thumbnail/route.js'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('GET /api/thumbnail', () => {
  it('varies the CDN cache on the url query parameter', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { 'content-type': 'image/jpeg' },
      })),
    )

    const target = 'https://d3adwkbyhxyrtq.cloudfront.net/data/186/1/agent.jpg'
    const res = await GET(new Request(`https://go.smartvid.app/api/thumbnail?url=${encodeURIComponent(target)}`))

    expect(res.status).toBe(200)
    expect(res.headers.get('netlify-vary')).toBe('query=url')
  })
})
