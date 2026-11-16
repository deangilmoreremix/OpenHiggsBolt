import { NextRequest, NextResponse } from 'next/server'
import { addContacts, listContacts, removeContact } from '@/src/lib/landingPages/server/pages.js'
import { errorResponse, limited, readJson, serviceDb, signedInUser, unauthenticated } from '@/src/lib/landingPages/server/http'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Ctx = { params: Promise<{ id: string }> }

/**
 * Contacts of one page (each gets a personal link /p/<id>?c=<contactId>). Owner only.
 *   GET    → { contacts }
 *   POST   { contacts: [{ fields }] }  (up to 1000) → { contacts }
 *   DELETE ?contactId=…
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const userId = await signedInUser()
  if (!userId) return unauthenticated()
  try {
    return NextResponse.json({ contacts: await listContacts(await serviceDb(), userId, (await params).id) })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const userId = await signedInUser()
  if (!userId) return unauthenticated()
  const blocked = limited(`lp-contacts:${userId}`, { windowMs: 10 * 60_000, max: 30 })
  if (blocked) return blocked
  const body = await readJson(req, 600_000)
  if (!body) return NextResponse.json({ error: 'Send JSON', code: 'BAD_BODY' }, { status: 400 })
  try {
    return NextResponse.json({ contacts: await addContacts(await serviceDb(), userId, (await params).id, body.contacts) }, { status: 201 })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const userId = await signedInUser()
  if (!userId) return unauthenticated()
  try {
    await removeContact(await serviceDb(), userId, (await params).id, new URL(req.url).searchParams.get('contactId') || '')
    return NextResponse.json({ ok: true })
  } catch (err) {
    return errorResponse(err)
  }
}
