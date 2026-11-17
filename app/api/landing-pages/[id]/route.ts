import { NextRequest, NextResponse } from 'next/server'
import { deletePage, getOwnedPage, updatePage } from '@/src/lib/landingPages/server/pages.js'
import { errorResponse, limited, readJson, serviceDb, signedInUser, unauthenticated } from '@/src/lib/landingPages/server/http'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const userId = await signedInUser()
  if (!userId) return unauthenticated()
  try {
    return NextResponse.json({ page: await getOwnedPage(await serviceDb(), userId, (await params).id) })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const userId = await signedInUser()
  if (!userId) return unauthenticated()
  const blocked = limited(`lp-save:${userId}`, { windowMs: 60_000, max: 120 })
  if (blocked) return blocked
  const body = await readJson(req)
  if (!body) return NextResponse.json({ error: 'Send JSON', code: 'BAD_BODY' }, { status: 400 })
  try {
    return NextResponse.json({ page: await updatePage(await serviceDb(), userId, (await params).id, body) })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const userId = await signedInUser()
  if (!userId) return unauthenticated()
  try {
    await deletePage(await serviceDb(), userId, (await params).id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return errorResponse(err)
  }
}
