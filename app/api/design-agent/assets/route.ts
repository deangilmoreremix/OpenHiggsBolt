import { NextRequest, NextResponse } from 'next/server'
const BASE = 'https://api.muapi.ai/api/v1/creative-agent'
export async function GET(req: NextRequest) {
  const key = req.headers.get('x-api-key') || ''
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('sessionId')
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
  const res = await fetch(`${BASE}/sessions/${sessionId}/assets`, { headers: { 'x-api-key': key } })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
