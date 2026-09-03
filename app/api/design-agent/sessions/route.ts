import { safeApiJson } from '@/lib/safeApiResponse';
import { NextRequest, NextResponse } from 'next/server'
import { getDesignAgentApiKey } from '../lib/auth'
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement'
import { ENTITLEMENTS } from '@/access/entitlements'
import { auth } from '@clerk/nextjs/server'
import { recordOwnership } from '../lib/ownership'

const BASE = 'https://api.muapi.ai/api/v1/creative-agent'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }

    const entitlementCheck = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO);
    if (!entitlementCheck.allowed) {
      if (entitlementCheck.status === 401) {
        return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
      }
      return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO);
    }

    const key = await getDesignAgentApiKey(req)
    const res = await fetch(`${BASE}/sessions`, { headers: { 'x-api-key': key }, signal: AbortSignal.timeout(30000) })
    const data = await safeApiJson(res)
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    const status = err instanceof Response ? err.status : 500
    const message = status === 401 ? 'Unauthorized' : status === 400 ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(req: NextRequest) {
  const entitlementCheck = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO);
  if (!entitlementCheck.allowed) {
    if (entitlementCheck.status === 401) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }
    return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO);
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }

    const key = await getDesignAgentApiKey(req)
    const body = await req.json()
    const res = await fetch(`${BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    })
    const data = await safeApiJson(res)

    if (res.ok && data?.id) {
      recordOwnership({ userId, sessionId: data.id });
    }

    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    const status = err instanceof Response ? err.status : 500
    const message = status === 401 ? 'Unauthorized' : status === 400 ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status })
  }
}
