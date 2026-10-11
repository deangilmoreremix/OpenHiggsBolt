import { NextRequest, NextResponse } from 'next/server'
import { getServerVFXClient, MUAPI_KEY_MISSING_ERROR } from '@/api/vfx'
import { isRequestCancelled } from '../cancel/route'
import { validateMuAPIKey, isMuapiKeyMissingError } from '../_helpers'
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement'
import { ENTITLEMENTS } from '@/access/entitlements'

export const dynamic = "force-dynamic";

function cancelledResponse(id: string) {
  return { request_id: id, status: 'cancelled' as const }
}

export async function GET(req: NextRequest) {
  const entitlementCheck = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO);
  if (!entitlementCheck.allowed) {
    if (entitlementCheck.status === 401) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }
    return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO);
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // If this job was cancelled, never report a billable completion back to the
    // client. Return `cancelled` so polling stops and the result is discarded.
    if (isRequestCancelled(id)) {
      return NextResponse.json(cancelledResponse(id))
    }

    // BYOK: the caller's OWN MuAPI key only — request header first, then the
    // Clerk session's stored key. No server fallback exists, so a missing key
    // is a 400 naming Settings, never an operator-billed status poll.
    const apiKey = await validateMuAPIKey(req)
    const client = getServerVFXClient(apiKey)
    const status = await client.getGenerationResult(id)

    // Guard against a race: the job may have completed between the cancel call
    // and this poll. If it finished after cancellation, discard the result.
    if (isRequestCancelled(id)) {
      return NextResponse.json(cancelledResponse(id))
    }

    return NextResponse.json(status)
  } catch (err: unknown) {
    // Missing user key is user-actionable (400), not an internal failure.
    if (isMuapiKeyMissingError(err)) {
      return NextResponse.json({ error: MUAPI_KEY_MISSING_ERROR }, { status: 400 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[VFX status]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
