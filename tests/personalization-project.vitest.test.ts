import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

let authUserId: string | null = 'user-123'

type SupabaseMockState = {
  projectData: Record<string, unknown> | null
  listData: Record<string, unknown>[]
  insertData: Record<string, unknown> | null
  updateData: Record<string, unknown> | null
  deleteError: string | null
}

const supabaseMockState: SupabaseMockState = {
  projectData: {
    id: 'proj-123',
    source: { sourceType: 'landing-demo' },
    client: { businessName: 'Acme' },
    assets: {},
    prompt: { original: 'orig', personalized: 'pers', edited: 'edit' },
    output_type: 'video',
    mode: 'complete',
    generation: {},
    status: 'complete',
    error_message: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  },
  listData: [
    { id: 'p1', output_type: 'prompt', mode: null, status: 'idle', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-02T00:00:00Z' },
    { id: 'p2', output_type: 'video', mode: 'complete', status: 'complete', created_at: '2026-01-03T00:00:00Z', updated_at: '2026-01-04T00:00:00Z' },
  ],
  insertData: { id: 'new-proj-123', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  updateData: { id: 'existing-id', created_at: '2026-01-01T00:00:00Z', updated_at: new Date().toISOString() },
  deleteError: null,
}

beforeEach(() => {
  vi.resetModules()
  authUserId = 'user-123'

  // Reset mock state
  supabaseMockState.projectData = {
    id: 'proj-123',
    source: { sourceType: 'landing-demo' },
    client: { businessName: 'Acme' },
    assets: {},
    prompt: { original: 'orig', personalized: 'pers', edited: 'edit' },
    output_type: 'video',
    mode: 'complete',
    generation: {},
    status: 'complete',
    error_message: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  }
  supabaseMockState.listData = [
    { id: 'p1', output_type: 'prompt', mode: null, status: 'idle', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-02T00:00:00Z' },
    { id: 'p2', output_type: 'video', mode: 'complete', status: 'complete', created_at: '2026-01-03T00:00:00Z', updated_at: '2026-01-04T00:00:00Z' },
  ]
  supabaseMockState.insertData = { id: 'new-proj-123', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  supabaseMockState.updateData = { id: 'existing-id', created_at: '2026-01-01T00:00:00Z', updated_at: new Date().toISOString() }
  supabaseMockState.deleteError = null

  vi.doMock('@clerk/nextjs/server', () => ({
    auth: vi.fn(async () => ({ userId: authUserId })),
  }))

  vi.doMock('@/lib/supabase', () => {
    const createEqChain = (terminal: () => Promise<{ data: unknown; error: unknown }>) => {
      const eq = vi.fn(() => chain)
      const chain: Record<string, unknown> = { eq, single: terminal }
      return chain
    }

    const createSupabaseFrom = () => {
      const selectFn = vi.fn(() => {
        const orderFn = vi.fn(() => {
          const limitFn = vi.fn(async () => ({ data: supabaseMockState.listData, error: null }))
          return { limit: limitFn, ...createEqChain(async () => ({ data: null, error: null })) }
        })
        return { order: orderFn, ...createEqChain(async () => ({ data: supabaseMockState.projectData, error: null })) }
      })
      return {
        select: selectFn,
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => ({ data: supabaseMockState.insertData, error: null })),
          })),
        })),
        update: vi.fn(() => createEqChain(async () => ({ data: supabaseMockState.updateData, error: null }))),
        delete: vi.fn(() => createEqChain(async () => ({ error: supabaseMockState.deleteError }))),
      }
    }
    return {
      createServerClient: vi.fn(() => ({
        rpc: createRpcMock(),
        from: vi.fn(createSupabaseFrom),
      })),
    }
  })

  vi.doMock('@/server/personalizationLog', () => ({
    logPersonalization: vi.fn(),
    createCorrelationId: vi.fn(() => 'corr-123'),
    sanitizeForLog: vi.fn((v: unknown) => v),
  }))

  vi.doMock('@/server/envValidation', () => ({
    requirePersonalizationEnv: vi.fn(() => ({ valid: true, missingRequired: [] })),
  }))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

// The route talks to the database exclusively through the four
// personalization_saved_projects_* SECURITY DEFINER RPCs, which own the
// transaction-local identity GUC. Mock those instead of the PostgREST builder.
function createRpcMock() {
  return vi.fn(async (fnName: string, args?: { p_id?: string | null }) => {
    switch (fnName) {
      case 'personalization_saved_projects_list':
        return { data: supabaseMockState.listData || [], error: null }
      case 'personalization_saved_projects_get':
        return {
          data: supabaseMockState.projectData ? [supabaseMockState.projectData] : [],
          error: null,
        }
      case 'personalization_saved_projects_upsert':
        // a null p_id means INSERT, a present one means UPDATE
        return {
          data: args?.p_id ? supabaseMockState.updateData : supabaseMockState.insertData,
          error: null,
        }
      case 'personalization_saved_projects_delete':
        return { data: supabaseMockState.deleteError ? null : true, error: supabaseMockState.deleteError || null }
      default:
        return { data: null, error: null }
    }
  })
}

function createRequest(overrides: Record<string, string> = {}): NextRequest {
  const url = new URL(overrides.url || 'http://localhost/api/personalization/project', 'http://localhost')
  if (overrides.id) url.searchParams.set('id', overrides.id)
  if (overrides.list) url.searchParams.set('list', 'true')

  return new NextRequest(url.toString(), {
    method: overrides.method || 'GET',
    body: overrides.body ? JSON.stringify(overrides.body) : undefined,
    headers: {
      'content-type': 'application/json',
    },
  })
}

describe('GET /api/personalization/project', () => {
  it('returns 401 when unauthenticated', async () => {
    authUserId = null
    const { GET } = await import('@/app/api/personalization/project/route')

    const response = await GET(createRequest())
    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('UNAUTHENTICATED')
  })

  it('returns 400 when missing project id', async () => {
    const { GET } = await import('@/app/api/personalization/project/route')

    const response = await GET(createRequest())
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Missing project id parameter')
  })

  it('returns project when id is provided', async () => {
    supabaseMockState.projectData = {
      id: 'proj-123',
      source: { sourceType: 'landing-demo' },
      client: { businessName: 'Acme' },
      assets: {},
      prompt: { original: 'orig', personalized: 'pers', edited: 'edit' },
      output_type: 'video',
      mode: 'complete',
      generation: {},
      status: 'complete',
      error_message: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-02T00:00:00Z',
    }

    const { GET } = await import('@/app/api/personalization/project/route')
    const response = await GET(createRequest({ id: 'proj-123' }))
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.project.id).toBe('proj-123')
    expect(data.project.output_type).toBe('video')
  })

  it('returns 404 when project not found', async () => {
    supabaseMockState.projectData = null

    const { createServerClient } = await import('@/lib/supabase')
    vi.mocked(createServerClient).mockReturnValue({
      rpc: vi.fn(async () => ({ data: [], error: null })),
      from: vi.fn(() => {
        const terminal = async () => ({ data: null, error: { code: 'PGRST116', message: 'Not found' } })
        const eq = vi.fn(() => chain)
        const chain: Record<string, unknown> = { eq, single: terminal }
        return {
          select: vi.fn(() => chain),
        }
      }),
    } as unknown as ReturnType<typeof createServerClient>)

    const { GET } = await import('@/app/api/personalization/project/route')
    const response = await GET(createRequest({ id: 'missing-id' }))
    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toBe('Project not found')
  })

  it('lists projects when list=true', async () => {
    supabaseMockState.listData = [
      { id: 'p1', output_type: 'prompt', mode: null, status: 'idle', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-02T00:00:00Z' },
      { id: 'p2', output_type: 'video', mode: 'complete', status: 'complete', created_at: '2026-01-03T00:00:00Z', updated_at: '2026-01-04T00:00:00Z' },
    ]

    const { createServerClient } = await import('@/lib/supabase')
    vi.mocked(createServerClient).mockReturnValue({
      rpc: createRpcMock(),
      from: vi.fn(() => {
        const makeChain = (terminal: () => Promise<{ data: unknown; error: unknown }>) => {
          const eq = vi.fn(() => chain)
          const order = vi.fn(() => {
            const limit = vi.fn(async () => terminal())
            return { limit }
          })
          const chain: Record<string, unknown> = { eq, order, single: terminal }
          return chain
        }
        return {
          select: vi.fn(() => makeChain(async () => ({ data: supabaseMockState.listData, error: null }))),
        }
      }),
    } as unknown as ReturnType<typeof createServerClient>)

    const { GET } = await import('@/app/api/personalization/project/route')
    const response = await GET(createRequest({ list: 'true' }))
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.projects.length).toBe(2)
  })
})

describe('POST /api/personalization/project', () => {
  it('returns 401 when unauthenticated', async () => {
    authUserId = null
    const { POST } = await import('@/app/api/personalization/project/route')

    const response = await POST(createRequest({ method: 'POST', body: { project: { source: {} } } }))
    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('UNAUTHENTICATED')
  })

  it('creates a new project and returns id', async () => {
    supabaseMockState.insertData = { id: 'new-proj-123', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }

    const { POST } = await import('@/app/api/personalization/project/route')
    const response = await POST(createRequest({
      method: 'POST',
      body: {
        project: {
          source: { sourceType: 'landing-demo', id: 'src-1', title: 'Test', mediaType: 'image', sourceMetadata: {} },
          client: {},
          assets: { identities: [], primaryIdentity: null, logos: [], primaryLogo: null, products: [], brandReferences: [], firstFrame: null, lastFrame: null, ctaGraphic: null, audio: [], savedReferences: [] },
          prompt: { original: 'orig', personalized: 'pers', edited: 'edit' },
          outputType: 'video',
          mode: 'complete',
          generation: { engine: 'smartvideo-recommended', preserveAudio: true, exactLogoHandling: 'final-overlay', exactCtaHandling: 'final-end-card', firstFrameMode: 'none', lastFrameMode: 'none', consentGiven: false },
          status: 'idle',
          errorMessage: null,
        },
      },
    }))

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.ok).toBe(true)
    expect(data.project.id).toBe('new-proj-123')
  })

  it('updates existing project when id is provided', async () => {
    supabaseMockState.updateData = { id: 'existing-id', created_at: '2026-01-01T00:00:00Z', updated_at: new Date().toISOString() }

    const { createServerClient } = await import('@/lib/supabase')
    vi.mocked(createServerClient).mockReturnValue({
      rpc: createRpcMock(),
      from: vi.fn(() => {
        const makeChain = (terminal: () => Promise<{ data: unknown; error: unknown }>) => {
          const eq = vi.fn(() => chain)
          const select = vi.fn(() => chain)
          const chain: Record<string, unknown> = { eq, select, single: terminal }
          return chain
        }
        return {
          update: vi.fn(() => makeChain(async () => ({ data: supabaseMockState.updateData, error: null }))),
        }
      }),
    } as unknown as ReturnType<typeof createServerClient>)

    const { POST } = await import('@/app/api/personalization/project/route')
    const response = await POST(createRequest({
      method: 'POST',
      body: {
        project: {
          id: 'existing-id',
          source: { sourceType: 'landing-demo', id: 'src-1', title: 'Test', mediaType: 'image', sourceMetadata: {} },
          client: {},
          assets: { identities: [], primaryIdentity: null, logos: [], primaryLogo: null, products: [], brandReferences: [], firstFrame: null, lastFrame: null, ctaGraphic: null, audio: [], savedReferences: [] },
          prompt: { original: 'orig', personalized: 'pers', edited: 'edit' },
          outputType: 'video',
          mode: 'complete',
          generation: { engine: 'smartvideo-recommended', preserveAudio: true, exactLogoHandling: 'final-overlay', exactCtaHandling: 'final-end-card', firstFrameMode: 'none', lastFrameMode: 'none', consentGiven: false },
          status: 'idle',
          errorMessage: null,
        },
      },
    }))

    const text = await response.text()
    expect(response.status).toBe(200)
    const data = JSON.parse(text)
    expect(data.ok).toBe(true)
    expect(data.project.id).toBe('existing-id')
  })

  it('returns 404 when the database reports the row is owned by someone else', async () => {
    // The SECURITY DEFINER upsert re-asserts ownership in-database and raises
    // 42501 when the caller does not own the row. The route must map that to
    // 404, not 500 and not 403, so a caller probing another user's id cannot
    // distinguish "exists but not yours" from "absent".
    const { createServerClient } = await import('@/lib/supabase')
    vi.mocked(createServerClient).mockReturnValue({
      rpc: vi.fn(async () => ({
        data: null,
        error: { code: '42501', message: 'project not owned by caller' },
      })),
    } as unknown as ReturnType<typeof createServerClient>)

    const { POST } = await import('@/app/api/personalization/project/route')
    const response = await POST(createRequest({
      method: 'POST',
      body: { project: { id: 'someone-elses-project', source: {}, client: {}, assets: {}, prompt: {} } },
    }))

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toBe('Project not found')
  })

  it('returns 404 when a delete matches no owned row', async () => {
    const { createServerClient } = await import('@/lib/supabase')
    vi.mocked(createServerClient).mockReturnValue({
      rpc: vi.fn(async () => ({ data: false, error: null })),
    } as unknown as ReturnType<typeof createServerClient>)

    const { DELETE } = await import('@/app/api/personalization/project/route')
    const response = await DELETE(createRequest({ method: 'DELETE', id: 'someone-elses-project' }))

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toBe('Project not found')
  })
})

describe('DELETE /api/personalization/project', () => {
  it('returns 401 when unauthenticated', async () => {
    authUserId = null
    const { DELETE } = await import('@/app/api/personalization/project/route')

    const response = await DELETE(createRequest({ method: 'DELETE', id: 'proj-123' }))
    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('UNAUTHENTICATED')
  })

  it('returns 400 when missing project id', async () => {
    const { DELETE } = await import('@/app/api/personalization/project/route')

    const response = await DELETE(createRequest({ method: 'DELETE' }))
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Missing project id parameter')
  })

  it('deletes project and returns ok', async () => {
    supabaseMockState.deleteError = null

    const { DELETE } = await import('@/app/api/personalization/project/route')
    const response = await DELETE(createRequest({ method: 'DELETE', id: 'proj-123' }))
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.ok).toBe(true)
  })
})
