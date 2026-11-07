import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Storyboard panels are saved to the project's own Supabase storage; the GIF export draws them through
// /api/thumbnail, so that host must be allowed (and other hosts must stay blocked).
describe('/api/thumbnail storage host', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abc123.supabase.co'
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-type': 'image/png' } })))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
  })

  const call = async (url: string) => {
    const { GET } = await import('../app/api/thumbnail/route.js')
    return GET(new Request(`http://localhost/api/thumbnail?url=${encodeURIComponent(url)}`))
  }

  it('serves images from the configured storage host', async () => {
    expect((await call('https://abc123.supabase.co/storage/v1/object/public/uploads/a.png')).status).toBe(200)
  })

  it('still refuses other hosts', async () => {
    expect((await call('https://evil.example.com/a.png')).status).toBe(403)
    expect((await call('https://other.supabase.co/storage/v1/object/public/uploads/a.png')).status).toBe(403)
  })
})
