import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { discoverBusinessAssets } from '@/server/discoverAssets'
import { getOpenAiKeyForUser } from '@/src/lib/openaiKeyServer'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    const body = await req.json().catch(() => ({}))
    const websiteUrl = typeof body?.websiteUrl === 'string' ? body.websiteUrl : ''

    if (!websiteUrl) {
      return NextResponse.json({ error: 'websiteUrl is required' }, { status: 400 })
    }

    const openAiKey = userId ? await getOpenAiKeyForUser() : null

    const results = await discoverBusinessAssets({
      websiteUrl,
      maxPages: 8,
      maxImages: 60,
      maxImageBytes: 5 * 1024 * 1024,
      openAiKey: openAiKey || undefined,
    })

    return NextResponse.json({
      ok: true,
      discoveredAssets: results,
      count: results.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const status = message.includes('not allowed') || message.includes('Private') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
