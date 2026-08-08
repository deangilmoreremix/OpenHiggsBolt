import { NextRequest, NextResponse } from 'next/server'
import { getDesignAgentApiKey } from '../lib/auth'

const BASE = 'https://api.muapi.ai/api/v1/creative-agent'

// POST /api/design-agent/approve  ->  POST /api/v1/creative-agent/jobs/{jobId}/approve
// Approves a proposed plan so the agent proceeds with tool calls.
// https://muapi.ai/docs/design-agent-api
export async function POST(req: NextRequest) {
  try {
    const key = await getDesignAgentApiKey()
    const { jobId } = await req.json()
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })
    const res = await fetch(`${BASE}/jobs/${jobId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key },
      signal: AbortSignal.timeout(30000),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    const status = err instanceof Response ? err.status : 500
    const message = status === 401 ? 'Unauthorized' : status === 400 ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status })
  }
}
