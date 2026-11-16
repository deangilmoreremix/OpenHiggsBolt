import { NextRequest, NextResponse } from 'next/server'
import { pageStats } from '@/src/lib/landingPages/server/pages.js'
import { errorResponse, serviceDb, signedInUser, unauthenticated } from '@/src/lib/landingPages/server/http'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await signedInUser()
  if (!userId) return unauthenticated()
  try {
    return NextResponse.json({ stats: await pageStats(await serviceDb(), userId, (await params).id) })
  } catch (err) {
    return errorResponse(err)
  }
}
