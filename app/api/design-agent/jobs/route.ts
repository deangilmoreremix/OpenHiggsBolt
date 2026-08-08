import { NextRequest, NextResponse } from 'next/server'
import { getDesignAgentApiKey } from '../lib/auth'

const BASE = 'https://api.muapi.ai/api/v1/creative-agent'

export async function GET(req: NextRequest) {
  try {
    const key = await getDesignAgentApiKey()
    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get('jobId')
    const sessionId = searchParams.get('sessionId')
    if (jobId) {
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
  } catch (err: any) {
    const status = err instanceof Response ? err.status : 500
    const message = status === 401 ? 'Unauthorized' : status === 400 ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status })
  }
}
