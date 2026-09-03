import { NextRequest, NextResponse } from 'next/server'
import { getDesignAgentApiKey } from '../lib/auth'
import { safeJson } from '../lib/response'

const BASE = 'https://api.muapi.ai/api/v1/creative-agent'

export async function POST(req: NextRequest) {
  try {
    const key = await getDesignAgentApiKey(req)
    const { jobId } = await req.json()

    if (!jobId) {
      return NextResponse.json({ error: 'jobId required' }, { status: 400 })
    }

    const res = await fetch(`${BASE}/jobs/${encodeURIComponent(jobId)}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
      },
      signal: AbortSignal.timeout(30000),
    })

    const data = await safeJson(res)
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    if (err instanceof Response) {
      const body = await safeJson(err)
      return NextResponse.json(body, { status: err.status })
    }
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}
