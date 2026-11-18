import { NextRequest, NextResponse } from 'next/server'
import { pageLeads } from '@/src/lib/landingPages/server/leadsHeat.js'
import { errorResponse, serviceDb, signedInUser, unauthenticated } from '@/src/lib/landingPages/server/http'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Owner: this page's leads, each matched to the personal link it came from. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await signedInUser()
  if (!userId) return unauthenticated()
  try {
    return NextResponse.json({ leads: await pageLeads(await serviceDb(), userId, (await params).id) })
  } catch (err) {
    return errorResponse(err)
  }
}
