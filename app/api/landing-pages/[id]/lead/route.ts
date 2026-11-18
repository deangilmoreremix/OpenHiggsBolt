import { NextRequest, NextResponse, after } from 'next/server'
import { submitLead } from '@/src/lib/landingPages/server/pages.js'
import { deliverLead } from '@/src/lib/landingPages/server/leadsHeat.js'
import { errorResponse, limited, publicKey, readJson, serviceDb } from '@/src/lib/landingPages/server/http'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Public: a viewer submits the lead form of a PUBLISHED page. No sign-in; limited per client IP. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = limited(publicKey('lp-lead', req), { windowMs: 10 * 60_000, max: 12 })
  if (blocked) return blocked
  const body = await readJson(req, 20_000)
  if (!body) return NextResponse.json({ error: 'Send JSON', code: 'BAD_BODY' }, { status: 400 })
  try {
    const db = await serviceDb()
    const id = (await params).id
    const saved = await submitLead(db, id, typeof body.contactId === 'string' ? body.contactId : null, body.data)
    // The owner's webhooks run after the visitor has their answer, so a slow receiver never keeps the form waiting.
    const send = () => deliverLead(db, { pageId: id, contactId: saved.contactId, data: saved.data }).catch((e: unknown) => console.warn('[landing-pages] delivery failed:', (e as Error)?.name))
    try { after(send) } catch { await send() } // outside a request scope (unit tests) run it inline
    return NextResponse.json({ ok: true })
  } catch (err) {
    return errorResponse(err)
  }
}
