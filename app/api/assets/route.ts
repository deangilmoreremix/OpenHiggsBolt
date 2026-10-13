import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/src/lib/supabaseServer'
import { generateAsset } from '@/src/lib/assetGenerator'
import { ok, apiError } from '@/src/lib/apiError'
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement'
import { ENTITLEMENTS } from '@/access/entitlements'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const campaignId = searchParams.get('campaign_id')

  const supabase = getSupabaseAdmin()
  let query = supabase.from('brand_assets').select('*').order('created_at', { ascending: false })

  if (campaignId) {
    query = query.eq('campaign_id', campaignId)
  }

  const { data: assets, error } = await query
  if (error) return apiError('server_error', error.message, 500)

  return ok(assets || [])
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
  const { campaign_id, platform, concept_index } = body

  if (!campaign_id || !platform) {
    return apiError('bad_request', 'campaign_id and platform are required', 400)
  }

  try {
    const asset = await generateAsset(campaign_id, platform, Number(concept_index) || 0)
    return ok(asset)
  } catch (err: any) {
    return apiError('generation_failed', err.message || 'Asset generation failed', 500)
  }
}
