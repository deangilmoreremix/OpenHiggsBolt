import { NextRequest, NextResponse } from 'next/server'
const BASE = 'https://api.muapi.ai/api/v1/creative-agent'

// POST /api/design-agent/approve  ->  POST /api/v1/creative-agent/jobs/{jobId}/approve
// Approves a proposed plan so the agent proceeds with tool calls.
// https://muapi.ai/docs/design-agent-api
export async function POST(req: NextRequest) {
  const key = req.headers.get('x-api-key') || ''
  const { jobId } = await req.json()
  if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })
  const res = await fetch(`${BASE}/jobs/${jobId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key },
    signal: AbortSignal.timeout(30000),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
