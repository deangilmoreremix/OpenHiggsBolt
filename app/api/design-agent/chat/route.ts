import { NextRequest, NextResponse } from 'next/server'
const BASE = 'https://api.muapi.ai/api/v1/creative-agent'
export async function POST(req: NextRequest) {
  const key = req.headers.get('x-api-key') || ''
  const { sessionId, ...body } = await req.json()
  const res = await fetch(`${BASE}/sessions/${sessionId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
