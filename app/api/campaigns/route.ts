import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/src/lib/supabaseServer'
import { generateCampaign } from '@/lib/campaignGenerator'
import { ok, apiError } from '@/lib/apiError'
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement'
import { ENTITLEMENTS } from '@/access/entitlements'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const brandId = searchParams.get('brand_id')

  const supabase = getSupabaseAdmin()
  let query = supabase.from('brand_campaigns').select('*').order('created_at', { ascending: false })

  if (brandId) {
    query = query.eq('brand_id', brandId)
  }

  const { data: campaigns, error } = await query
  if (error) return apiError('server_error', error.message, 500)

  return ok(campaigns || [])
}

export async function POST(req: NextRequest) {
  const entitlementCheck = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO)
  if (!entitlementCheck.allowed) {
    if (entitlementCheck.status === 401) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
    }
    return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO)
  }

  let body: any = {}
  try { body = await req.json() } catch {}
  const { brand_id, goal, direction } = body

  if (!brand_id || !goal) {
    return apiError('bad_request', 'brand_id and goal are required', 400)
  }

  try {
    const campaign = await generateCampaign(brand_id, goal, direction)
    return ok(campaign)
  } catch (err: any) {
    return apiError('generation_failed', err.message || 'Campaign generation failed', 500)
  }
}
