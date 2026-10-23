/**
 * Persistence contract — Phase 3, item 1 (`400 MISSING_PROJECT_ID`).
 *
 * Two surfaces are under contract here:
 *
 * 1. `supabaseProjectPersistence.ts` (the client). INVARIANT: `loadProject`
 *    (and the sibling `listProjects` / `deleteProject`) NEVER issue a request
 *    to `/api/personalization/project` that lacks BOTH an `id` and a `list`
 *    param — that request shape is the one the route answers with
 *    `400 MISSING_PROJECT_ID`. Every branch, including the empty/whitespace
 *    guards, must either refuse to fetch or carry one of the two params.
 *
 * 2. `app/api/personalization/project/route.ts` (the server). The list RPC
 *    `personalization_saved_projects_list` returns `setof
 *    personalization_saved_projects` whose columns are
 *    id, clerk_user_id, source, client, assets, prompt, generation,
 *    output_type, mode, status, error_message, created_at, updated_at —
 *    there is NO top-level `sourceDemoId` column. The demo id lives at
 *    `source->>'id'`. The route's source filter must therefore read that
 *    location, keep the matching row, drop non-matching rows, and DEGRADE to
 *    the unfiltered list (never an empty one) when no row carries a source
 *    identifier at all. An empty list because a column name was wrong is
 *    indistinguishable from "the user never saved this project".
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import {
  loadProject,
  listProjects,
  deleteProject,
} from '../supabaseProjectPersistence'

// ── Route dependencies ────────────────────────────────────────────────────────
// The route imports @clerk/nextjs/server, @/lib/supabase,
// @/server/personalizationLog and @/server/envValidation. All four are mocked
// so the GET handler runs entirely in-process; the Supabase client is reduced
// to the single `rpc` entry point the route uses.

const routeMocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createServerClient: vi.fn(),
  logPersonalization: vi.fn(),
  createCorrelationId: vi.fn(() => 'corr-p3a-test'),
  requirePersonalizationEnv: vi.fn(),
}))

vi.mock('@clerk/nextjs/server', () => ({ auth: routeMocks.auth }))
vi.mock('@/lib/supabase', () => ({ createServerClient: routeMocks.createServerClient }))
vi.mock('@/server/personalizationLog', () => ({
  logPersonalization: routeMocks.logPersonalization,
  createCorrelationId: routeMocks.createCorrelationId,
}))
vi.mock('@/server/envValidation', () => ({
  requirePersonalizationEnv: routeMocks.requirePersonalizationEnv,
}))

// Imported AFTER the hoisted vi.mock registrations so the route module binds
// the mocked dependencies at evaluation time.
const { GET } = await import('@/app/api/personalization/project/route')

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Minimal stub of the pieces of `Response` the client actually reads. */
function stubResponse(
  body: unknown,
  init: { ok?: boolean; status?: number } = {},
): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
  } as unknown as Response
}

function createRouteRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/personalization/project')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return new NextRequest(url.toString(), { method: 'GET' })
}

type FetchInit = { method?: string; credentials?: string; signal?: AbortSignal }

/** Every issued request URL, in order. */
function issuedUrls(): URL[] {
  return fetchMock.mock.calls.map((call) => new URL(String(call[0])))
}

let fetchMock: ReturnType<typeof vi.fn>
let listData: unknown[]
let rpcMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()

  // Keep the loud-guard console output out of the reporter.
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})

  fetchMock = vi.fn(async () => stubResponse({ projects: [] }))
  vi.stubGlobal('fetch', fetchMock)

  routeMocks.auth.mockResolvedValue({ userId: 'user-123' })
  routeMocks.requirePersonalizationEnv.mockReturnValue({ valid: true, missingRequired: [] })

  listData = []
  rpcMock = vi.fn(async () => ({ data: listData, error: null }))
  routeMocks.createServerClient.mockReturnValue({ rpc: rpcMock })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// ── Client: request-shape contract ────────────────────────────────────────────

describe('loadProject request shape', () => {
  it('a sourceId request carries list=true and no id', async () => {
    await loadProject({ sourceId: 'demo-1' })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const url = issuedUrls()[0]
    expect(url.pathname).toBe('/api/personalization/project')
    expect(url.searchParams.get('list')).toBe('true')
    expect(url.searchParams.get('sourceId')).toBe('demo-1')
    expect(url.searchParams.has('id')).toBe(false)
  })

  it('a projectId request carries id and no list', async () => {
    await loadProject({ projectId: 'proj-9' })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const url = issuedUrls()[0]
    expect(url.searchParams.get('id')).toBe('proj-9')
    expect(url.searchParams.has('list')).toBe(false)
    expect(url.searchParams.has('sourceId')).toBe(false)
  })

  it('when both are supplied the projectId wins and no list param is sent', async () => {
    await loadProject({ projectId: 'proj-9', sourceId: 'demo-1' })

    const url = issuedUrls()[0]
    expect(url.searchParams.get('id')).toBe('proj-9')
    expect(url.searchParams.has('list')).toBe(false)
  })

  it('never issues a request without id or list — every branch, including the guards', async () => {
    const guardedBranches: Array<Parameters<typeof loadProject>[0]> = [
      {},
      { projectId: '' },
      { projectId: '   ' },
      { sourceId: '' },
      { sourceId: ' \t ' },
      { projectId: '', sourceId: '' },
      { projectId: '   ', sourceId: '  ' },
    ]

    for (const opts of guardedBranches) {
      fetchMock.mockClear()
      await loadProject(opts)
      // The guarded branches must refuse to fetch at all; anything that IS
      // fetched must carry one of the two params.
      for (const url of issuedUrls()) {
        const hasParam = url.searchParams.has('id') || url.searchParams.has('list')
        expect(hasParam, `request ${url} for ${JSON.stringify(opts)}`).toBe(true)
      }
      expect(fetchMock).not.toHaveBeenCalled()
    }

    // The happy branches do fetch, and they are the ONLY callers.
    fetchMock.mockClear()
    await loadProject({ sourceId: 'demo-1' })
    expect(issuedUrls()[0].searchParams.has('list')).toBe(true)

    fetchMock.mockClear()
    await loadProject({ projectId: 'proj-1' })
    expect(issuedUrls()[0].searchParams.has('id')).toBe(true)
  })

  it('an empty/whitespace id fails loudly and never reaches the server', async () => {
    for (const opts of [
      { projectId: '' },
      { projectId: '   ' },
      { sourceId: '' },
      { sourceId: '   ' },
      { projectId: '', sourceId: '' },
    ] as Array<Parameters<typeof loadProject>[0]>) {
      fetchMock.mockClear()
      const res = await loadProject(opts)
      expect(res.ok).toBe(false)
      expect(res.error).toMatch(/non-empty string|requires a projectId/)
      expect(fetchMock).not.toHaveBeenCalled()
    }
    // Loud: the dev guard writes to console.error (suppressed above but spied).
    expect(console.error).toHaveBeenCalled()
  })

  it('sibling helpers keep the same invariant (list / delete)', async () => {
    fetchMock.mockClear()
    await listProjects()
    expect(issuedUrls()[0].searchParams.get('list')).toBe('true')

    fetchMock.mockClear()
    await deleteProject('proj-1')
    expect(issuedUrls()[0].searchParams.get('id')).toBe('proj-1')

    fetchMock.mockClear()
    const blank = await deleteProject('   ')
    expect(blank.ok).toBe(false)
    expect(blank.error).toMatch(/non-empty string/)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

// ── Client: restore semantics ─────────────────────────────────────────────────

describe('loadProject restore semantics', () => {
  it('a restore of a saved project returns that project', async () => {
    fetchMock.mockImplementation(async () =>
      stubResponse({
        projects: [
          {
            id: 'row-1',
            source: { id: 'demo-1', sourceType: 'landing-demo' },
            client: {},
            assets: {},
            prompt: { original: 'orig', personalized: 'pers' },
            generation: {},
            output_type: 'video',
            status: 'complete',
          },
        ],
        sourceFilter: 'applied',
      }),
    )

    const res = await loadProject({ sourceId: 'demo-1' })

    expect(res.ok).toBe(true)
    expect(res.error).toBeUndefined()
    expect(res.data?.id).toBe('row-1')
    expect(res.data?.sourceDemoId).toBe('demo-1')
    expect(res.data?.originalPrompt).toBe('orig')
    expect(res.data?.personalizedPrompt).toBe('pers')
    expect(res.data?.outputType).toBe('video')
  })

  it('a restore of a never-saved project returns the ok/empty shape, never an error', async () => {
    const res = await loadProject({ sourceId: 'demo-never-saved' })

    expect(res.ok).toBe(true)
    expect(res.data).toBeUndefined()
    expect(res.error).toBeUndefined()
  })

  it('a row that carries no source id is accepted (degraded mode) with a dev warning', async () => {
    fetchMock.mockImplementation(async () =>
      stubResponse({
        projects: [
          {
            id: 'row-2',
            source: {},
            client: {},
            assets: {},
            prompt: { personalized: 'pers' },
            generation: {},
          },
        ],
        sourceFilter: 'unavailable',
      }),
    )

    const res = await loadProject({ sourceId: 'demo-1' })

    expect(res.ok).toBe(true)
    expect(res.data?.id).toBe('row-2')
    // Degraded mode is surfaced, never silent.
    expect(console.warn).toHaveBeenCalled()
  })

  it('a row for a DIFFERENT source is not restored', async () => {
    fetchMock.mockImplementation(async () =>
      stubResponse({
        projects: [{ id: 'row-3', source: { id: 'demo-2' }, client: {}, assets: {}, prompt: {}, generation: {} }],
      }),
    )

    const res = await loadProject({ sourceId: 'demo-1' })

    expect(res.ok).toBe(true)
    expect(res.data).toBeUndefined()
  })
})

// ── Route ─────────────────────────────────────────────────────────────────────

describe('GET /api/personalization/project', () => {
  it('the list RPC returns nothing → 200 with an empty projects array, never 400', async () => {
    listData = []

    const res = await GET(createRouteRequest({ list: 'true' }))

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.projects).toEqual([])
  })

  it('returns 400 MISSING_PROJECT_ID only when BOTH id and list are absent', async () => {
    const res = await GET(createRouteRequest())

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Missing project id parameter')
    expect(routeMocks.logPersonalization).toHaveBeenCalledWith(
      expect.objectContaining({ safeErrorCode: 'MISSING_PROJECT_ID' }),
    )
  })

  it('a present-but-empty id alone still 400s; list=true alone still 200s', async () => {
    const emptyId = await GET(createRouteRequest({ id: '' }))
    expect(emptyId.status).toBe(400)

    const listOnly = await GET(createRouteRequest({ list: 'true' }))
    expect(listOnly.status).toBe(200)
  })

  it('the source filter keeps the matching row and drops non-matching ones', async () => {
    listData = [
      {
        id: 'match',
        source: { id: 'demo-1', sourceType: 'landing-demo' },
        client: {},
        assets: {},
        prompt: {},
        generation: {},
        output_type: 'video',
        status: 'complete',
      },
      {
        id: 'other',
        source: { id: 'demo-2', sourceType: 'landing-demo' },
        client: {},
        assets: {},
        prompt: {},
        generation: {},
        output_type: 'prompt',
        status: 'idle',
      },
    ]

    const res = await GET(createRouteRequest({ list: 'true', sourceId: 'demo-1' }))

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.projects.map((p: { id: string }) => p.id)).toEqual(['match'])
    expect(data.sourceFilter).toBe('applied')
  })

  it('degrades to the unfiltered list when no row carries a source identifier', async () => {
    // Real RPC shape: source is a jsonb object and there is no top-level
    // sourceDemoId column. A row whose source carries no id can be matched by
    // nothing, so the filter must NOT turn "no match" into "empty list".
    listData = [
      {
        id: 'row-a',
        source: {},
        client: {},
        assets: {},
        prompt: {},
        generation: {},
        output_type: 'prompt',
        status: 'idle',
      },
      {
        id: 'row-b',
        client: {},
        assets: {},
        prompt: {},
        generation: {},
        output_type: 'prompt',
        status: 'idle',
      },
    ]

    const res = await GET(createRouteRequest({ list: 'true', sourceId: 'demo-1' }))

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.projects.map((p: { id: string }) => p.id)).toEqual(['row-a', 'row-b'])
    expect(data.sourceFilter).toBe('unavailable')
    // The degrade is logged, not silent.
    expect(routeMocks.logPersonalization).toHaveBeenCalledWith(
      expect.objectContaining({ safeErrorCode: 'SOURCE_FILTER_UNAVAILABLE' }),
    )
  })

  it('an id request returns the single project', async () => {
    listData = []
    routeMocks.createServerClient.mockReturnValue({
      rpc: vi.fn(async () => ({
        data: [
          {
            id: 'proj-7',
            source: { id: 'demo-1' },
            client: {},
            assets: {},
            prompt: { original: 'o', personalized: 'p' },
            generation: {},
            output_type: 'video',
            status: 'complete',
          },
        ],
        error: null,
      })),
    })

    const res = await GET(createRouteRequest({ id: 'proj-7' }))

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.project.id).toBe('proj-7')
  })
})
