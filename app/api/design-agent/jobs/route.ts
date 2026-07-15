import { NextRequest, NextResponse } from 'next/server'
const BASE = 'https://api.muapi.ai/api/v1/creative-agent'
export async function GET(req: NextRequest) {
  const key = req.headers.get('x-api-key') || ''
  const { searchParams } = new URL(req.url)
  const jobId = searchParams.get('jobId')
  const sessionId = searchParams.get('sessionId')
  if (jobId) {
    // Cursor-based polling: forward `since`/`limit` to the upstream events endpoint.
    const qs = new URLSearchParams()
    const since = searchParams.get('since')
    const limit = searchParams.get('limit')
    if (since) qs.set('since', since)
    if (limit) qs.set('limit', limit)
    const q = qs.toString()
    const res = await fetch(`${BASE}/jobs/${jobId}/events${q ? `?${q}` : ''}`, {
      headers: { 'x-api-key': key },
      signal: AbortSignal.timeout(30000),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  }
  if (sessionId) {
    const res = await fetch(`${BASE}/sessions/${sessionId}/jobs`, { headers: { 'x-api-key': key }, signal: AbortSignal.timeout(30000) })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  }
  return NextResponse.json({ error: 'jobId or sessionId required' }, { status: 400 })
}
