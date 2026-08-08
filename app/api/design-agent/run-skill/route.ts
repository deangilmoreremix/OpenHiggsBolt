import { NextRequest, NextResponse } from 'next/server'
const BASE = 'https://api.muapi.ai/api/v1/creative-agent'

// POST /api/design-agent/run-skill  ->  POST /api/v1/creative-agent/sessions/{sessionId}/run-skill
// Directly invokes a named expert skill (bypasses the agent's intent detection).
// https://muapi.ai/docs/design-agent-api
export async function POST(req: NextRequest) {
  const key = req.headers.get('x-api-key') || ''
  const { sessionId, ...body } = await req.json()
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
  const res = await fetch(`${BASE}/sessions/${sessionId}/run-skill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
