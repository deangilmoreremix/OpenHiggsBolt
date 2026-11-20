import { NextRequest, NextResponse } from 'next/server'
import { pageHeat, recordHeat } from '@/src/lib/landingPages/server/leadsHeat.js'
import { errorResponse, limited, publicKey, readJson, serviceDb, signedInUser, unauthenticated } from '@/src/lib/landingPages/server/http'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Public: a batch of click / scroll / watch samples from a published page. No sign-in; limited per client IP. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = limited(publicKey('lp-heat', req), { windowMs: 60_000, max: 40 })
  if (blocked) return blocked
  const body = await readJson(req, 12_000)
  if (!body) return NextResponse.json({ error: 'Send JSON', code: 'BAD_BODY' }, { status: 400 })
  try {
    await recordHeat(await serviceDb(), (await params).id, body)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return errorResponse(err)
  }
}

/** Owner: the aggregated heat maps (a spot or second needs 3 visitors) and one row per personal link. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await signedInUser()
  if (!userId) return unauthenticated()
  const q = new URL(req.url).searchParams
  try {
    return NextResponse.json({ heat: await pageHeat(await serviceDb(), userId, (await params).id, { days: Number(q.get('days')) || 30, viewport: q.get('viewport') || 'all' }) })
  } catch (err) {
    return errorResponse(err)
  }
}
