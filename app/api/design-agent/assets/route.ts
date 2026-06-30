import { NextRequest, NextResponse } from 'next/server'
import { proxyToCreativeAgent, corsPreflight } from '../_proxy'

export async function OPTIONS() {
  return corsPreflight()
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('sessionId')
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId query parameter' }, { status: 400 })
  }
  return proxyToCreativeAgent(req, { pathSegments: ['sessions', sessionId, 'assets'] })
}
