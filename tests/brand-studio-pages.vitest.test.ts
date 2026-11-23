import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? walk(p) : [p] })
}

describe('Brand Studio pages use the cyan design tokens, not hard-coded accents', () => {
  const files = walk('app/(brand-studio)').filter((f) => /\.(tsx|ts)$/.test(f))
  it('finds the studio pages', () => expect(files.length).toBeGreaterThanOrEqual(8))
  it.each(files)('%s has no hard-coded accent colour', (f) => {
    const src = readFileSync(f, 'utf8')
    // cyan accent literals, the other repo's lime accent, and any non-neutral hex
    expect(src).not.toMatch(/22d3ee|34,\s*211,\s*238|d9ff00|06b6d4/i)
    const hexes = (src.match(/#[0-9a-fA-F]{6}\b/g) || []).map((h) => h.toLowerCase()).filter((h) => !['#000000', '#ffffff'].includes(h))
    expect(hexes).toEqual([])
  })
})

function mockUser(userId: string | null) {
  vi.doMock('@clerk/nextjs/server', () => ({ auth: async () => ({ userId }) }))
  vi.doMock('@/access/resolveAccess', () => ({
    resolveSmartVideoAccessForUser: vi.fn(async () => (userId ? { clerkUserId: userId, email: 'a@b.c', entitlements: { smartvideo_go: true }, status: 'active', source: 'manual', hasSmartVideoGo: true } : null)),
  }))
}

/** Records every supabase call so the owner predicate can be asserted. */
function fakeSupabase(rows: Record<string, any[]> = {}) {
  const calls: any[] = []
  const chain = (table: string, op: string, payload?: any) => {
    const filters: Record<string, any> = {}
    const c: any = {
      select: () => c, order: () => c, limit: () => c,
      eq: (k: string, v: any) => { filters[k] = v; return c },
      maybeSingle: async () => { calls.push({ table, op, filters, payload }); const r = (rows[table] || []).find((x) => Object.entries(filters).every(([k, v]) => x[k] === v)); return { data: r ?? null, error: null } },
      single: async () => { calls.push({ table, op, filters, payload }); return { data: { id: 'new1', ...payload }, error: null } },
      then: (res: any) => { calls.push({ table, op, filters, payload }); return Promise.resolve({ data: (rows[table] || []).filter((x) => Object.entries(filters).every(([k, v]) => x[k] === v)), error: null }).then(res) },
    }
    return c
  }
  const client = { from: (t: string) => ({ select: () => chain(t, 'select'), insert: (p: any) => chain(t, 'insert', p), update: (p: any) => chain(t, 'update', p), delete: () => chain(t, 'delete') }) }
  return { client, calls }
}

describe('/api/brand-studio/store owner scoping', () => {
  beforeEach(() => { vi.resetModules(); vi.resetAllMocks() })

  it('401s when signed out', async () => {
    mockUser(null)
    const { GET } = await import('@/app/api/brand-studio/store/route')
    const res = await GET(new NextRequest('http://x/api/brand-studio/store?kind=brand'))
    expect(res.status).toBe(401)
  })

  it('stamps the caller as owner on insert and ignores a client-supplied clerk_user_id', async () => {
    mockUser('user_a')
    const fake = fakeSupabase({ brand_dna: [{ id: 'b1', clerk_user_id: 'user_a' }] })
    vi.doMock('@/src/lib/supabaseServer', () => ({ getSupabaseAdmin: () => fake.client }))
    const { POST } = await import('@/app/api/brand-studio/store/route')
    const res = await POST(new NextRequest('http://x/s', { method: 'POST', body: JSON.stringify({ kind: 'campaign', data: { brand_id: 'b1', goal: 'sales', concepts: [], clerk_user_id: 'evil' } }) }))
    expect(res.status).toBe(200)
    const insert = fake.calls.find((c) => c.op === 'insert')
    expect(insert.payload.clerk_user_id).toBe('user_a')
  })

  it("404s when a child row points at another user's brand", async () => {
    mockUser('user_a')
    const fake = fakeSupabase({ brand_dna: [{ id: 'b9', clerk_user_id: 'user_b' }] })
    vi.doMock('@/src/lib/supabaseServer', () => ({ getSupabaseAdmin: () => fake.client }))
    const { POST } = await import('@/app/api/brand-studio/store/route')
    const res = await POST(new NextRequest('http://x/s', { method: 'POST', body: JSON.stringify({ kind: 'asset', data: { brand_id: 'b9', platform: 'twitter' } }) }))
    expect(res.status).toBe(404)
    expect(fake.calls.some((c) => c.op === 'insert')).toBe(false)
  })

  it('reads only the caller’s rows and 404s a non-owned id', async () => {
    mockUser('user_a')
    const fake = fakeSupabase({ brand_dna: [{ id: 'b9', clerk_user_id: 'user_b' }] })
    vi.doMock('@/src/lib/supabaseServer', () => ({ getSupabaseAdmin: () => fake.client }))
    const { GET } = await import('@/app/api/brand-studio/store/route')
    const res = await GET(new NextRequest('http://x/s?kind=brand&id=b9'))
    expect(res.status).toBe(404)
    expect(fake.calls[0].filters.clerk_user_id).toBe('user_a')
  })

  it('PATCH cannot change owner or id columns', async () => {
    mockUser('user_a')
    const fake = fakeSupabase({})
    vi.doMock('@/src/lib/supabaseServer', () => ({ getSupabaseAdmin: () => fake.client }))
    const { PATCH } = await import('@/app/api/brand-studio/store/route')
    await PATCH(new NextRequest('http://x/s', { method: 'PATCH', body: JSON.stringify({ kind: 'asset', id: 'a1', data: { headline: 'h', clerk_user_id: 'evil', id: 'zzz' } }) }))
    const upd = fake.calls.find((c) => c.op === 'update')
    expect(upd.payload).toEqual({ headline: 'h' })
    expect(upd.filters.clerk_user_id).toBe('user_a')
  })
})

describe('/api/brand-studio generation route', () => {
  beforeEach(() => { vi.resetModules(); vi.resetAllMocks() })
  it('requires the caller’s MuAPI key (BYOK)', async () => {
    mockUser('user_a')
    const { POST } = await import('@/app/api/brand-studio/route')
    const res = await POST(new NextRequest('http://x/b', { method: 'POST', body: JSON.stringify({ action: 'concepts' }) }))
    expect(res.status).toBe(400)
  })
  it('refuses private-network URLs for analyze', async () => {
    mockUser('user_a')
    const { POST } = await import('@/app/api/brand-studio/route')
    const res = await POST(new NextRequest('http://x/b', { method: 'POST', headers: { 'x-api-key': 'k' }, body: JSON.stringify({ action: 'analyze', url: 'http://169.254.169.254/latest/meta-data' }) }))
    expect(res.status).toBe(400)
  })
})
