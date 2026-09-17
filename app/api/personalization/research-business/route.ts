import { NextRequest, NextResponse } from 'next/server'
import { researchBusiness } from '@/server/businessDiscovery/researchProvider'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const websiteUrl = typeof body?.websiteUrl === 'string' ? body.websiteUrl.trim() : ''

    if (!websiteUrl) {
      return NextResponse.json({ error: 'websiteUrl is required' }, { status: 400 })
    }

    const result = await researchBusiness(websiteUrl)

    return NextResponse.json({
      ok: true,
      research: result,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const status = message.includes('not allowed') || message.includes('Private') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
