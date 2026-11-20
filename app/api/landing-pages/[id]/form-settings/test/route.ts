import { NextRequest, NextResponse } from 'next/server'
import { testWebhooks } from '@/src/lib/landingPages/server/leadsHeat.js'
import { errorResponse, limited, serviceDb, signedInUser, unauthenticated } from '@/src/lib/landingPages/server/http'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Owner only: send one signed sample lead to the saved webhooks and report how each receiver answered. */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await signedInUser()
  if (!userId) return unauthenticated()
  const blocked = limited(`lp-hooktest:${userId}`, { windowMs: 60_000, max: 6 })
  if (blocked) return blocked
  try {
    const results = await testWebhooks(await serviceDb(), userId, (await params).id)
    return NextResponse.json({ results: results.map((r) => ({ host: r.host, ok: r.ok, status: r.status, attempts: r.attempts, error: r.error })) })
  } catch (err) {
    return errorResponse(err)
  }
}
