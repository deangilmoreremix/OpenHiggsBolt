import { NextRequest, NextResponse } from 'next/server'
import { contactStats } from '@/src/lib/landingPages/server/pages.js'
import { errorResponse, serviceDb, signedInUser, unauthenticated } from '@/src/lib/landingPages/server/http'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Who watched, played, clicked and filled the form, per personal link. Owner only. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await signedInUser()
  if (!userId) return unauthenticated()
  try {
    return NextResponse.json({ stats: await contactStats(await serviceDb(), userId, (await params).id) })
  } catch (err) {
    return errorResponse(err)
  }
}
