import { NextRequest, NextResponse } from 'next/server'
import { analyzeBrand } from '@/lib/brandAnalyzer'
import { ok, apiError } from '@/lib/apiError'
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement'
import { ENTITLEMENTS } from '@/access/entitlements'

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
  const { url } = body
  if (!url || typeof url !== 'string') {
    return apiError('bad_request', 'url is required', 400)
  }

  try {
    const brand = await analyzeBrand(url)
    return ok(brand)
  } catch (err: any) {
    return apiError('analysis_failed', err.message || 'Brand analysis failed', 500)
  }
}
