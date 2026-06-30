import { NextResponse } from 'next/server'

/**
 * Cancel endpoint.
 *
 * NOTE: Muapi.ai does not expose a real "cancel in-flight task" endpoint.
 * This route is therefore a CLIENT-SIDE FLAG ONLY — it acknowledges the
 * cancellation request so the browser/VFX client can stop polling the
 * status endpoint. The underlying generation on Muapi's backend will
 * continue to run to completion (or fail) regardless; we cannot abort it.
 */
export async function POST() {
  return NextResponse.json({
    cancelled: true,
    status: 'cancelled',
    note: 'Muapi.ai has no cancel endpoint; client should stop polling.',
  })
}
