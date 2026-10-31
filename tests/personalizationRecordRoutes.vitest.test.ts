import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// The two routes the personalization client already called but which did
// not exist (every call was a silent 404).

let authUserId: string | null = 'user-123'
const uploads: Array<{ path: string; type: string }> = []
const inserts: Array<{ table: string; row: Record<string, unknown> }> = []
let storageError: { message: string } | null = null

beforeEach(() => {
  vi.resetModules()
  authUserId = 'user-123'
  uploads.length = 0
  inserts.length = 0
  storageError = null

  vi.doMock('@clerk/nextjs/server', () => ({ auth: vi.fn(async () => ({ userId: authUserId })) }))
  vi.doMock('@/server/personalizationLog', () => ({
    logPersonalization: vi.fn(),
    createCorrelationId: vi.fn(() => 'corr-1'),
  }))
  vi.doMock('@/lib/supabase', () => ({
    createServerClient: vi.fn(() => ({
      storage: {
        from: () => ({
          upload: vi.fn(async (path: string, file: Blob) => {
            uploads.push({ path, type: file.type })
            return { error: storageError }
          }),
          getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.example/${path}` } }),
        }),
      },
      from: (table: string) => ({
        insert: (row: Record<string, unknown>) => {
          inserts.push({ table, row })
          return { select: () => ({ single: async () => ({ data: { id: 'row-1' }, error: null }) }) }
        },
      }),
    })),
  }))
})

function editedImageRequest(metadata: Record<string, unknown> = { assetId: 'asset-1', transparent: true }) {
  const form = new FormData()
  form.append('image', new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' }), 'logo.png')
  form.append('metadata', JSON.stringify(metadata))
  return new NextRequest('http://localhost/api/personalization/persist-edited-asset', { method: 'POST', body: form })
}

describe('POST /api/personalization/persist-edited-asset', () => {
  it('needs a signed-in user', async () => {
    authUserId = null
    const { POST } = await import('@/app/api/personalization/persist-edited-asset/route')
    const res = await POST(editedImageRequest())
    expect(res.status).toBe(401)
    expect(uploads).toHaveLength(0)
  })

  it('stores the image under the user\'s own folder and returns its URL', async () => {
    const { POST } = await import('@/app/api/personalization/persist-edited-asset/route')
    const res = await POST(editedImageRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(uploads).toEqual([{ path: 'user-123/edited/asset-1/edited.png', type: 'image/png' }])
    expect(body).toMatchObject({ ok: true, assetId: 'asset-1', publicUrl: 'https://cdn.example/user-123/edited/asset-1/edited.png', hasTransparency: true })
  })

  it('reports a storage failure', async () => {
    storageError = { message: 'bucket missing' }
    const { POST } = await import('@/app/api/personalization/persist-edited-asset/route')
    const res = await POST(editedImageRequest())
    expect(res.status).toBe(500)
  })

  it('rejects a request without an asset id', async () => {
    const { POST } = await import('@/app/api/personalization/persist-edited-asset/route')
    const res = await POST(editedImageRequest({}))
    expect(res.status).toBe(400)
  })
})

function recordRequest(entry: unknown) {
  return new NextRequest('http://localhost/api/video/record', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entry }),
  })
}

describe('POST /api/video/record', () => {
  it('needs a signed-in user', async () => {
    authUserId = null
    const { POST } = await import('@/app/api/video/record/route')
    const res = await POST(recordRequest({ model: 'm', prompt: '', video_url: 'https://cdn.example/v.mp4' }))
    expect(res.status).toBe(401)
  })

  it('inserts one row owned by the session user', async () => {
    const { POST } = await import('@/app/api/video/record/route')
    const res = await POST(recordRequest({
      model: 'seedance-2.5-motion-control',
      prompt: 'recast',
      video_url: 'https://cdn.example/v.mp4',
      clerk_user_id: 'someone-else',
    }))
    expect(res.status).toBe(200)
    expect(inserts).toHaveLength(1)
    expect(inserts[0].table).toBe('generated_videos')
    expect(inserts[0].row).toMatchObject({ clerk_user_id: 'user-123', model: 'seedance-2.5-motion-control', video_url: 'https://cdn.example/v.mp4' })
  })

  it('rejects a non-http video URL', async () => {
    const { POST } = await import('@/app/api/video/record/route')
    const res = await POST(recordRequest({ model: 'm', prompt: '', video_url: 'blob:http://x/1' }))
    expect(res.status).toBe(400)
    expect(inserts).toHaveLength(0)
  })
})
