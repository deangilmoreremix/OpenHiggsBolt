import { NextRequest, NextResponse } from 'next/server'
import { getDesignAgentApiKey } from '../lib/auth'

const BASE = 'https://api.muapi.ai/api/v1/creative-agent'

export async function GET(req: NextRequest) {
  try {
    const key = await getDesignAgentApiKey()
    const res = await fetch(`${BASE}/sessions`, { headers: { 'x-api-key': key }, signal: AbortSignal.timeout(30000) })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    const status = err instanceof Response ? err.status : 500
    const message = status === 401 ? 'Unauthorized' : status === 400 ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const key = await getDesignAgentApiKey()
    const body = await req.json()
    const res = await fetch(`${BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key },
      body: JSON.stringify(body),
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
