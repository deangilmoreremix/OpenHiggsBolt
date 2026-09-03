import { safeApiJson } from '@/lib/safeApiResponse';
import { NextRequest, NextResponse } from 'next/server'
import { getDesignAgentApiKey } from '../lib/auth'
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement'
import { ENTITLEMENTS } from '@/access/entitlements'
import { requireOwnership } from '../lib/ownership'

const BASE = 'https://api.muapi.ai/api/v1/creative-agent'

// POST /api/design-agent/approve  ->  POST /api/v1/creative-agent/jobs/{jobId}/approve
// Approves a proposed plan so the agent proceeds with tool calls.
// https://muapi.ai/docs/design-agent-api
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
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

    const ownershipResult = await requireOwnership(jobId, 'job');
    if (ownershipResult instanceof Response) {
      return NextResponse.json({ error: ownershipResult.status === 401 ? 'UNAUTHENTICATED' : 'Forbidden' }, { status: ownershipResult.status });
    }

    const res = await fetch(`${BASE}/jobs/${jobId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key },
      signal: AbortSignal.timeout(30000),
    })
    const data = await safeApiJson(res)
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    const status = err instanceof Response ? err.status : 500
    const message = status === 401 ? 'Unauthorized' : status === 400 ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status })
  }
}
