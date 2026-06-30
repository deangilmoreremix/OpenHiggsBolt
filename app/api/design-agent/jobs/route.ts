import { NextRequest, NextResponse } from 'next/server'
import { proxyToCreativeAgent, corsPreflight } from '../_proxy'

export async function OPTIONS() {
  return corsPreflight()
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const jobId = searchParams.get('jobId')
  const sessionId = searchParams.get('sessionId')
  if (jobId) {
    return proxyToCreativeAgent(req, { pathSegments: ['jobs', jobId, 'events'] })
  }
  if (sessionId) {
    return proxyToCreativeAgent(req, { pathSegments: ['sessions', sessionId, 'jobs'] })
  }
  return NextResponse.json(
    { error: 'Missing jobId or sessionId query parameter' },
    { status: 400 },
  )
}
