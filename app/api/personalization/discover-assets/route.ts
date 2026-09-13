import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { orchestrateDiscovery } from '@/server/discoveryOrchestrator'
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
    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY || null

    const result = await orchestrateDiscovery({
      websiteUrl,
      maxPages: 8,
      maxImages: 60,
      maxImageBytes: 5 * 1024 * 1024,
      openAiKey: openAiKey || undefined,
      firecrawlApiKey: firecrawlApiKey || undefined,
    })

    return NextResponse.json({
      ok: true,
      providerUsed: result.providerUsed,
      providerAttempted: result.providerAttempted,
      discoveredAssets: [],
      candidates: result.candidates,
      count: result.candidates.length,
      pagesCrawled: result.pagesCrawled,
      rawCandidates: result.rawCandidates,
      duration: result.duration,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const status = message.includes('not allowed') || message.includes('Private') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
