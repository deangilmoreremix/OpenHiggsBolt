import { NextRequest, NextResponse } from 'next/server'
import { getDesignAgentApiKey } from '../lib/auth'
import { safeJson } from '../lib/response'
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement'
import { ENTITLEMENTS } from '@/access/entitlements'
import { requireOwnership } from '../lib/ownership'

const BASE = 'https://api.muapi.ai/api/v1/creative-agent'

export async function POST(req: NextRequest) {
  const entitlementCheck = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO);
  if (!entitlementCheck.allowed) {
    if (entitlementCheck.status === 401) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }
    return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO);
  }

  try {
    const key = await getDesignAgentApiKey(req)
    const { jobId } = await req.json()

    if (!jobId) {
      return NextResponse.json({ error: 'jobId required' }, { status: 400 })
    }

    const ownershipResult = await requireOwnership(jobId, 'job');
    if (ownershipResult instanceof Response) {
      return NextResponse.json({ error: ownershipResult.status === 401 ? 'UNAUTHENTICATED' : 'Forbidden' }, { status: ownershipResult.status });
    }

    const res = await fetch(`${BASE}/jobs/${encodeURIComponent(jobId)}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
      },
      signal: AbortSignal.timeout(30000),
    })

    const data = await safeJson(res)
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    if (err instanceof Response) {
      const body = await safeJson(err)
      return NextResponse.json(body, { status: err.status })
    }
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}
