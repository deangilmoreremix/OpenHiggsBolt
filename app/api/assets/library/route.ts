import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { rateLimit, rateLimit429 } from '../../../../lib/rateLimit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * The signed-in user's asset library (uploads and generated results), shared by every studio.
 *   GET    /api/assets/library?kind=image|video|audio&limit=60  → { assets }
 *   POST   /api/assets/library  { url, kind, name?, source?, storagePath? } → { asset }
 *   DELETE /api/assets/library?id=<uuid>  → { ok }
 * Any signed-in user may use it; rows are always scoped to the caller's Clerk id.
 */
const KINDS = new Set(['image', 'video', 'audio'])
const SOURCES = new Set(['upload', 'result'])
const MAX_LIMIT = 200
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function signedInUser(): Promise<string | null> {
  const { userId } = await auth()
  return userId || null
}

const unauthenticated = () => NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
const storageDown = () => NextResponse.json({ error: 'Library is not available', code: 'STORAGE_UNAVAILABLE' }, { status: 503 })

async function db() {
  const { createServerClient } = await import('@/lib/supabase')
  return createServerClient()
}

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048) return false
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  const userId = await signedInUser()
  if (!userId) return unauthenticated()
  const { searchParams } = new URL(req.url)
  const kind = searchParams.get('kind')
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 60, 1), MAX_LIMIT)
  if (kind && !KINDS.has(kind)) return NextResponse.json({ error: 'Unknown kind', code: 'BAD_KIND' }, { status: 400 })
  try {
    let query = (await db())
      .from('user_assets')
      .select('id, kind, source, name, url, created_at')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (kind) query = query.eq('kind', kind)
    const { data, error } = await query
    if (error) throw new Error(error.message)
    return NextResponse.json({ assets: data ?? [] })
  } catch (err) {
    console.warn('[assets/library] list failed', err instanceof Error ? err.message : String(err))
    return storageDown()
  }
}

export async function POST(req: NextRequest) {
  const userId = await signedInUser()
  if (!userId) return unauthenticated()
  const limit = rateLimit(`assets-library:${userId}`, { windowMs: 10 * 60_000, max: 300 })
  if (!limit.allowed) return rateLimit429(limit.retryAfterMs)

  let body: Record<string, unknown> = {}
  try {
    const parsed = await req.json()
    if (parsed && typeof parsed === 'object') body = parsed as Record<string, unknown>
  } catch {
    // fall through to validation
  }
  const { url, kind, name, source, storagePath } = body
  if (!isHttpsUrl(url)) return NextResponse.json({ error: 'A https url is required', code: 'BAD_URL' }, { status: 400 })
  if (typeof kind !== 'string' || !KINDS.has(kind)) return NextResponse.json({ error: 'kind must be image, video or audio', code: 'BAD_KIND' }, { status: 400 })
  const row = {
    clerk_user_id: userId,
    url,
    kind,
    source: typeof source === 'string' && SOURCES.has(source) ? source : 'upload',
    name: typeof name === 'string' ? name.slice(0, 200) : '',
    storage_path: typeof storagePath === 'string' ? storagePath.slice(0, 512) : null,
  }
  try {
    const { data, error } = await (await db())
      .from('user_assets')
      .upsert(row, { onConflict: 'clerk_user_id,url' })
      .select('id, kind, source, name, url, created_at')
      .single()
    if (error) throw new Error(error.message)
    return NextResponse.json({ asset: data })
  } catch (err) {
    console.warn('[assets/library] save failed', err instanceof Error ? err.message : String(err))
    return storageDown()
  }
}

export async function DELETE(req: NextRequest) {
  const userId = await signedInUser()
  if (!userId) return unauthenticated()
  const id = new URL(req.url).searchParams.get('id') || ''
  if (!UUID.test(id)) return NextResponse.json({ error: 'A valid id is required', code: 'BAD_ID' }, { status: 400 })
  try {
    const { error } = await (await db()).from('user_assets').delete().eq('id', id).eq('clerk_user_id', userId)
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.warn('[assets/library] delete failed', err instanceof Error ? err.message : String(err))
    return storageDown()
  }
}
