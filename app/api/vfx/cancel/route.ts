import { NextRequest, NextResponse } from 'next/server'
import { getServerVFXClient } from '@/api/vfx'
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement'
import { ENTITLEMENTS } from '@/access/entitlements'

/**
 * Cancel endpoint.
 *
 * MuAPI does NOT expose a public cancel/delete endpoint for predictions
 * (verified against api.muapi.ai/openapi.json: only GET /predictions/{id}/result
 * and GET /predictions/{id}/media exist). Billing is debited on completion, so
 * the only way to avoid a charge is to stop caring about the job *before* it
 * completes and never treat its result as delivered.
 *
 * This route therefore:
 *   1. Records the request_id as cancelled in an in-memory set (module-scoped,
 *      good enough for a single server instance / serverless warm window).
 *   2. Best-effort attempts any MuAPI-side stop so the worker may abandon it
 *      early — non-fatal if MuAPI returns 404/405/4xx.
 *   3. The status route checks the cancelled set and returns `cancelled`
 *      instead of a real completion, so the client never surfaces a billable
 *      result for an abandoned job.
 */

// Module-scoped cancellation registry. Survives requests within a warm
// server instance. Not shared across instances — acceptable because cancel is
// inherently best-effort for an async third-party job.
const cancelledRequestIds = new Set<string>()

export function isRequestCancelled(requestId: string): boolean {
  return cancelledRequestIds.has(requestId)
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
    const body = await req.json().catch(() => ({}))
    const requestId: string | undefined = body?.request_id || body?.id

    if (requestId) {
      cancelledRequestIds.add(requestId)

      // Best-effort server-side stop. MuAPI has no documented prediction
      // cancel endpoint; we probe the two plausible shapes and ignore any
      // 404/405 so this never fails the cancel request.
      const clientKey = req.headers.get('x-api-key')?.trim()
      const apiKey = clientKey || process.env.MUAPI_API_KEY || process.env.MUAPI_KEY || ''
      if (apiKey) {
        try {
          const client = getServerVFXClient(apiKey)
          await client.requestCancellation(requestId)
        } catch {
          // Non-fatal: MuAPI may not support cancellation for this model.
        }
      }
    }

    return NextResponse.json({ cancelled: true, status: 'cancelled' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[VFX cancel]', message)
    return NextResponse.json({ cancelled: true, status: 'cancelled' })
  }
}
