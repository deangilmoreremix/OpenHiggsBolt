import { NextRequest, NextResponse } from 'next/server'
import { getDesignAgentApiKey } from '../lib/auth'
import { safeJson } from '../lib/response'

const BASE = 'https://api.muapi.ai/api/v1/creative-agent'

export async function POST(req: NextRequest) {
  try {
    const key = await getDesignAgentApiKey(req)
    const { sessionId, url, kind } = await req.json()

    if (!sessionId || !url || !kind) {
      return NextResponse.json(
        { error: 'sessionId, url and kind are required' },
        { status: 400 },
      )
    }

    if (!['image', 'video', 'audio'].includes(kind)) {
      return NextResponse.json({ error: 'Unsupported asset kind' }, { status: 400 })
    }

    const res = await fetch(`${BASE}/sessions/${encodeURIComponent(sessionId)}/assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
      },
      body: JSON.stringify({ url, kind, source_tool: 'upload' }),
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
