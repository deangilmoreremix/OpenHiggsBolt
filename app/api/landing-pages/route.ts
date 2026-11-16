import { NextRequest, NextResponse } from 'next/server'
import { createPage, listPages } from '@/src/lib/landingPages/server/pages.js'
import { errorResponse, limited, readJson, serviceDb, signedInUser, unauthenticated } from '@/src/lib/landingPages/server/http'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * The signed-in user's landing pages.
 *   GET  /api/landing-pages                      → { pages }
 *   POST /api/landing-pages { title, videoUrl, posterUrl?, duration?, source?, config } → { page }
 */
export async function GET() {
  const userId = await signedInUser()
  if (!userId) return unauthenticated()
  try {
    return NextResponse.json({ pages: await listPages(await serviceDb(), userId) })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  const userId = await signedInUser()
  if (!userId) return unauthenticated()
  const blocked = limited(`lp-create:${userId}`, { windowMs: 10 * 60_000, max: 60 })
  if (blocked) return blocked
  const body = await readJson(req)
  if (!body) return NextResponse.json({ error: 'Send JSON', code: 'BAD_BODY' }, { status: 400 })
  try {
    return NextResponse.json({ page: await createPage(await serviceDb(), userId, body) }, { status: 201 })
  } catch (err) {
    return errorResponse(err)
  }
}
