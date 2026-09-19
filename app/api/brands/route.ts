import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabaseAsUser } from '@/lib/supabaseServer'
import { ok, apiError } from '@/lib/apiError'
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement'
import { ENTITLEMENTS } from '@/access/entitlements'

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return apiError('unauthorized', 'Authentication required', 401)
  }

  const supabase = await getSupabaseAsUser()
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const rawPageSize = parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, rawPageSize))

  const { data, error } = await supabase
    .from('brand_dna')
    .select('id, url, brand_name, industry, primary_colors, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return apiError('server_error', error.message, 500)
  }

  const all = data || []
  const total = all.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const items = all.slice(start, start + pageSize)

  return ok(items, { page: safePage, pageSize, total, totalPages })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return apiError('unauthorized', 'Authentication required', 401)
  }

  const entitlementCheck = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO)
  if (!entitlementCheck.allowed) {
    return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO)
  }

  const supabase = await getSupabaseAsUser()
  let body: any = {}
  try {
    body = await req.json()
  } catch {}

  const url = body.url
  const workspaceId = body.workspace_id
  if (!url || typeof url !== 'string') {
    return apiError('bad_request', 'url is required', 400)
  }
  if (!workspaceId || typeof workspaceId !== 'string') {
    return apiError('bad_request', 'workspace_id is required', 400)
  }

  const { data, error } = await supabase
    .from('brand_dna')
    .insert({
      url,
      brand_name: url,
      industry: 'General',
      workspace_id: workspaceId,
    })
    .select()
    .single()

  if (error) {
    return apiError('server_error', error.message, 500)
  }

  return NextResponse.json({ id: data.id, brand_name: data.brand_name, url: data.url })
}
