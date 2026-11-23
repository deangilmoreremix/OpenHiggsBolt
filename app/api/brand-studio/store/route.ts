import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ok, apiError } from '@/lib/apiError'
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement'
import { ENTITLEMENTS } from '@/access/entitlements'
import { getSupabaseAdmin } from '@/src/lib/supabaseServer'
import { brandToRow, pick, WRITABLE } from '@/src/lib/brandStudio/brandRows'

export const dynamic = 'force-dynamic'

/**
 * Owner-scoped persistence for Brand Studio over the existing brand_* tables. The service-role client bypasses RLS,
 * so every query carries an explicit clerk_user_id predicate; a non-owned id is a 404, never a 403.
 */
const TABLES: Record<string, string> = {
  brand: 'brand_dna', campaign: 'brand_campaigns', asset: 'brand_assets', photoshoot: 'brand_photoshoots', animation: 'brand_animations',
}
const ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/

async function session(): Promise<{ userId: string } | { response: NextResponse }> {
  const gate = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO)
  if (!gate.allowed) {
    if (gate.status === 401) return { response: NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 }) }
    return { response: entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO) }
  }
  const { userId } = await auth()
  if (!userId) return { response: NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 }) }
  return { userId }
}

function clean(kind: string, data: any) {
  if (kind === 'brand') return brandToRow(data || {})
  return pick(TABLES[kind] as keyof typeof WRITABLE, data || {})
}

export async function GET(req: NextRequest) {
  const s = await session(); if ('response' in s) return s.response
  const q = new URL(req.url).searchParams
  const table = TABLES[q.get('kind') || '']; if (!table) return apiError('bad_request', 'Unknown kind', 400)
  const id = q.get('id')
  const sb = getSupabaseAdmin()
  if (id) {
    if (!ID.test(id)) return apiError('bad_request', 'Invalid id', 400)
    const { data, error } = await sb.from(table).select('*').eq('id', id).eq('clerk_user_id', s.userId).maybeSingle()
    if (error) return apiError('server_error', error.message, 500)
    return data ? ok(data) : apiError('not_found', 'Not found', 404)
  }
  let query = sb.from(table).select('*').eq('clerk_user_id', s.userId).order('created_at', { ascending: false }).limit(200)
  const filters: string[] = table === 'brand_dna' ? [] : table === 'brand_assets' ? ['brand_id', 'campaign_id'] : ['brand_id']
  for (const f of filters) {
    const v = q.get(f)
    if (!v) continue
    if (!ID.test(v)) return apiError('bad_request', `Invalid ${f}`, 400)
    query = query.eq(f, v)
  }
  const { data, error } = await query
  if (error) return apiError('server_error', error.message, 500)
  return ok(data || [])
}

/** Child rows may only reference a brand / campaign the caller owns. */
async function ownsParents(sb: any, userId: string, row: Record<string, any>): Promise<boolean> {
  for (const [col, table] of [['brand_id', 'brand_dna'], ['campaign_id', 'brand_campaigns']] as const) {
    if (row[col] == null || row[col] === '') continue
    if (!ID.test(String(row[col]))) return false
    const { data } = await sb.from(table).select('id').eq('id', row[col]).eq('clerk_user_id', userId).maybeSingle()
    if (!data) return false
  }
  return true
}

export async function POST(req: NextRequest) {
  const s = await session(); if ('response' in s) return s.response
  let body: any; try { body = await req.json() } catch { return apiError('bad_request', 'Invalid JSON', 400) }
  const table = TABLES[body?.kind]; if (!table) return apiError('bad_request', 'Unknown kind', 400)
  const row: Record<string, any> = clean(body.kind, body.data)
  const sb = getSupabaseAdmin()
  if (!(await ownsParents(sb, s.userId, row))) return apiError('not_found', 'Parent not found', 404)
  const { data, error } = await sb.from(table).insert({ ...row, clerk_user_id: s.userId }).select('*').single()
  if (error) return apiError('server_error', error.message, 500)
  return ok(data)
}

export async function PATCH(req: NextRequest) {
  const s = await session(); if ('response' in s) return s.response
  let body: any; try { body = await req.json() } catch { return apiError('bad_request', 'Invalid JSON', 400) }
  const table = TABLES[body?.kind]; if (!table || !ID.test(String(body.id))) return apiError('bad_request', 'kind and id required', 400)
  const patch: Record<string, any> = clean(body.kind, body.data)
  if (!Object.keys(patch).length) return apiError('bad_request', 'No updatable fields', 400)
  const sb = getSupabaseAdmin()
  if (!(await ownsParents(sb, s.userId, patch))) return apiError('not_found', 'Parent not found', 404)
  const { data, error } = await sb.from(table).update(patch).eq('id', body.id).eq('clerk_user_id', s.userId).select('*').maybeSingle()
  if (error) return apiError('server_error', error.message, 500)
  return data ? ok(data) : apiError('not_found', 'Not found', 404)
}

export async function DELETE(req: NextRequest) {
  const s = await session(); if ('response' in s) return s.response
  const q = new URL(req.url).searchParams
  const table = TABLES[q.get('kind') || '']; const id = q.get('id') || ''
  if (!table || !ID.test(id)) return apiError('bad_request', 'kind and id required', 400)
  const { error } = await getSupabaseAdmin().from(table).delete().eq('id', id).eq('clerk_user_id', s.userId)
  if (error) return apiError('server_error', error.message, 500)
  return ok({ deleted: true })
}
