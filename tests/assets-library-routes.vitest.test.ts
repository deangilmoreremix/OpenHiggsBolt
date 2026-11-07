import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

/** /api/assets/library and /api/assets/library/upload with Clerk and Supabase mocked. */

let userId: string | null = 'user_1'
const calls: Array<[string, unknown]> = []
let listResult: { data: unknown; error: { message: string } | null } = { data: [], error: null }
let saveResult: { data: unknown; error: { message: string } | null } = { data: { id: 'a1' }, error: null }
const signUpload = vi.fn()

function fakeDb() {
  const chain: any = {
    select: (...a: unknown[]) => { calls.push(['select', a]); return chain },
    eq: (...a: unknown[]) => { calls.push(['eq', a]); return chain },
    order: (...a: unknown[]) => { calls.push(['order', a]); return chain },
    limit: (...a: unknown[]) => { calls.push(['limit', a]); return chain },
    upsert: (...a: unknown[]) => { calls.push(['upsert', a]); return chain },
    delete: (...a: unknown[]) => { calls.push(['delete', a]); return chain },
    single: async () => saveResult,
    then: (resolve: (v: unknown) => void) => resolve(listResult),
  }
  return {
    from: (t: string) => { calls.push(['from', t]); return chain },
    storage: {
      from: () => ({
        createSignedUploadUrl: signUpload,
        getPublicUrl: (p: string) => ({ data: { publicUrl: `https://storage.test/public/${p}` } }),
      }),
    },
  }
}

const req = (path: string, method = 'GET', body?: unknown) =>
  new NextRequest(new URL(`http://localhost${path}`), {
    method,
    headers: { 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })

beforeEach(() => {
  vi.resetModules()
  userId = 'user_1'
  calls.length = 0
  listResult = { data: [{ id: 'a1', kind: 'image', url: 'https://x.test/a.png' }], error: null }
  saveResult = { data: { id: 'a1', url: 'https://x.test/a.png' }, error: null }
  signUpload.mockReset().mockImplementation(async (p: string) => ({ data: { signedUrl: `https://storage.test/sign/${p}?t=1` }, error: null }))
  vi.doMock('@clerk/nextjs/server', () => ({ auth: async () => ({ userId }) }))
  vi.doMock('@/lib/supabase', () => ({ createServerClient: () => fakeDb() }))
})

describe('/api/assets/library', () => {
  it('rejects signed-out callers on every method', async () => {
    userId = null
    const { GET, POST, DELETE } = await import('../app/api/assets/library/route')
    expect((await GET(req('/api/assets/library'))).status).toBe(401)
    expect((await POST(req('/api/assets/library', 'POST', { url: 'https://x.test/a.png', kind: 'image' }))).status).toBe(401)
    expect((await DELETE(req('/api/assets/library?id=3f2b8c1e-1111-4222-8333-444444444444', 'DELETE'))).status).toBe(401)
  })

  it('lists only the caller\'s assets, filtered by kind', async () => {
    const { GET } = await import('../app/api/assets/library/route')
    const res = await GET(req('/api/assets/library?kind=image&limit=5'))
    expect(res.status).toBe(200)
    expect((await res.json()).assets).toHaveLength(1)
    expect(calls).toContainEqual(['eq', ['clerk_user_id', 'user_1']])
    expect(calls).toContainEqual(['eq', ['kind', 'image']])
    expect(calls).toContainEqual(['limit', [5]])
  })

  it('rejects an unknown kind and a non-https url', async () => {
    const { GET, POST } = await import('../app/api/assets/library/route')
    expect((await GET(req('/api/assets/library?kind=gif'))).status).toBe(400)
    expect((await POST(req('/api/assets/library', 'POST', { url: 'http://x.test/a.png', kind: 'image' }))).status).toBe(400)
    expect((await POST(req('/api/assets/library', 'POST', { url: 'https://x.test/a.png', kind: 'pdf' }))).status).toBe(400)
  })

  it('answers 400, not 500, for a null or non-object body', async () => {
    const { POST } = await import('../app/api/assets/library/route')
    const nullBody = new NextRequest(new URL('http://localhost/api/assets/library'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: 'null' })
    expect((await POST(nullBody)).status).toBe(400)
  })

  it('saves an asset under the caller\'s id, ignoring a client-sent owner', async () => {
    const { POST } = await import('../app/api/assets/library/route')
    const res = await POST(req('/api/assets/library', 'POST', { url: 'https://x.test/a.png', kind: 'image', name: 'a.png', clerk_user_id: 'someone_else' }))
    expect(res.status).toBe(200)
    const upsert = calls.find(([k]) => k === 'upsert')![1] as unknown[]
    expect((upsert[0] as any).clerk_user_id).toBe('user_1')
    expect(upsert[1]).toEqual({ onConflict: 'clerk_user_id,url' })
  })

  it('deletes only rows the caller owns, and validates the id', async () => {
    const { DELETE } = await import('../app/api/assets/library/route')
    expect((await DELETE(req('/api/assets/library?id=nope', 'DELETE'))).status).toBe(400)
    const res = await DELETE(req('/api/assets/library?id=3f2b8c1e-1111-4222-8333-444444444444', 'DELETE'))
    expect(res.status).toBe(200)
    expect(calls).toContainEqual(['eq', ['clerk_user_id', 'user_1']])
  })

  it('answers 503 when storage fails', async () => {
    listResult = { data: null, error: { message: 'boom' } }
    const { GET } = await import('../app/api/assets/library/route')
    expect((await GET(req('/api/assets/library'))).status).toBe(503)
  })
})

describe('/api/assets/library/upload', () => {
  it('requires sign-in, a media type and a sane size', async () => {
    const { POST } = await import('../app/api/assets/library/upload/route')
    userId = null
    expect((await POST(req('/api/assets/library/upload', 'POST', { name: 'a.png', type: 'image/png', size: 10 }))).status).toBe(401)
    userId = 'user_1'
    expect((await POST(req('/api/assets/library/upload', 'POST', { name: 'a.pdf', type: 'application/pdf', size: 10 }))).status).toBe(400)
    expect((await POST(req('/api/assets/library/upload', 'POST', { name: 'a.mp4', type: 'video/mp4', size: 101 * 1024 * 1024 }))).status).toBe(400)
  })

  it('returns a signed address under the caller\'s own library prefix', async () => {
    const { POST } = await import('../app/api/assets/library/upload/route')
    const res = await POST(req('/api/assets/library/upload', 'POST', { name: 'a b.png', type: 'image/png', size: 1000 }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.storagePath).toMatch(/^smartvideo\/user_1\/library\/[0-9a-f-]+-/)
    expect(body.uploadUrl).toContain('/sign/')
    expect(body.url).toContain('/public/smartvideo/user_1/library/')
  })
})
