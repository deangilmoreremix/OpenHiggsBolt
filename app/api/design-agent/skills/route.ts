import { safeApiJson } from '@/lib/safeApiResponse';
import { NextRequest, NextResponse } from 'next/server'
import { getDesignAgentApiKey } from '../lib/auth'
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement'
import { ENTITLEMENTS } from '@/access/entitlements'

export const dynamic = "force-dynamic";

const BASE = 'https://api.muapi.ai/api/v1/creative-agent'

export async function GET(req: NextRequest) {
  // M1: previously this route needed nothing but a client-held MuAPI key, which
  // leaked the upstream creative-agent catalog and let anyone probe key validity.
  // Gate it like every sibling /api/design-agent/* route (see sessions/jobs).
  const entitlementCheck = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO);
  if (!entitlementCheck.allowed) {
    if (entitlementCheck.status === 401) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }
    return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO);
  }

  try {
    const key = await getDesignAgentApiKey(req)
    const res = await fetch(`${BASE}/agent-skills`, { headers: { 'x-api-key': key }, signal: AbortSignal.timeout(30000) })
    const data = await safeApiJson(res)
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    const status = err instanceof Response ? err.status : 500
    const message = status === 401 ? 'Unauthorized' : status === 400 ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status })
  }
}
