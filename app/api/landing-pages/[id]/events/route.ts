import { NextRequest, NextResponse } from 'next/server'
import { recordEvent } from '@/src/lib/landingPages/server/pages.js'
import { errorResponse, limited, publicKey, readJson, serviceDb } from '@/src/lib/landingPages/server/http'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Public: a viewer of a PUBLISHED page reports view / play / progress / cta / like. No sign-in. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = limited(publicKey('lp-event', req), { windowMs: 60_000, max: 90 })
  if (blocked) return blocked
  const body = await readJson(req, 2_000)
  if (!body) return NextResponse.json({ error: 'Send JSON', code: 'BAD_BODY' }, { status: 400 })
  try {
    await recordEvent(await serviceDb(), (await params).id, String(body.kind || ''), typeof body.contactId === 'string' ? body.contactId : null)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return errorResponse(err)
  }
}
