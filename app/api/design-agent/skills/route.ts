import { NextRequest, NextResponse } from 'next/server'
const BASE = 'https://api.muapi.ai/api/v1/creative-agent'
export async function GET(req: NextRequest) {
  const key = req.headers.get('x-api-key') || ''
  const res = await fetch(`${BASE}/agent-skills`, { headers: { 'x-api-key': key }, signal: AbortSignal.timeout(30000) })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
