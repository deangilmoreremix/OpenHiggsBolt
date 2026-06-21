import { NextResponse } from 'next/server'

/**
 * Cancel endpoint.
 * MuAPI does not expose a public cancel endpoint, so this route acknowledges
 * the cancellation request and tells the client to stop polling.
 */
export async function POST() {
  return NextResponse.json({ cancelled: true, status: 'cancelled' })
}
