import { NextRequest, NextResponse } from 'next/server'
import { getFormSettings, saveFormSettings } from '@/src/lib/landingPages/server/leadsHeat.js'
import { errorResponse, readJson, serviceDb, signedInUser, unauthenticated } from '@/src/lib/landingPages/server/http'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Owner only: where this page's leads are delivered. Never part of the public page. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await signedInUser()
  if (!userId) return unauthenticated()
  try {
    return NextResponse.json({ settings: await getFormSettings(await serviceDb(), userId, (await params).id) })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await signedInUser()
  if (!userId) return unauthenticated()
  const body = await readJson(req, 20_000)
  if (!body) return NextResponse.json({ error: 'Send JSON', code: 'BAD_BODY' }, { status: 400 })
  try {
    return NextResponse.json({ settings: await saveFormSettings(await serviceDb(), userId, (await params).id, body.settings) })
  } catch (err) {
    return errorResponse(err)
  }
}
