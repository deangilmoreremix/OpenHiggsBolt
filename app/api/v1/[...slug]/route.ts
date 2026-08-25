import { NextRequest, NextResponse } from 'next/server'
import { getMuApiKeyFromRequest } from '../lib/auth'

const BASE = 'https://api.muapi.ai/api/v1'

function getDemoKey(): string | null {
  if (typeof process !== 'undefined') {
    return process.env.MUAPI_DEMO_KEY || null
  }
  return null
}

export async function GET(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const path = '/' + (params.slug || []).join('/')
  try {
    let key: string
    try {
      key = await getMuApiKeyFromRequest(req)
    } catch {
      key = getDemoKey() || ''
    }
    if (!key) {
      return NextResponse.json({ error: 'Unauthorized: Missing API key' }, { status: 401 })
    }
    const { searchParams } = new URL(req.url)
    const qs = searchParams.toString()
    const url = `${BASE}${path}${qs ? `?${qs}` : ''}`
    const res = await fetch(url, {
      headers: { 'x-api-key': key },
      signal: AbortSignal.timeout(60000),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    const status = err instanceof Response ? err.status : 500
    const message = status === 401 ? 'Unauthorized' : status === 400 ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const path = '/' + (params.slug || []).join('/')
  try {
    let key: string
    try {
      key = await getMuApiKeyFromRequest(req)
    } catch {
      key = getDemoKey() || ''
    }
    if (!key) {
      return NextResponse.json({ error: 'Unauthorized: Missing API key' }, { status: 401 })
    }
    const contentType = req.headers.get('content-type') || ''
    let body: any
    if (contentType.includes('multipart/form-data')) {
      body = await req.formData()
    } else {
      body = await req.json().catch(() => ({}))
    }
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'x-api-key': key },
      body,
      signal: AbortSignal.timeout(120000),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    const status = err instanceof Response ? err.status : 500
    const message = status === 401 ? 'Unauthorized' : status === 400 ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status })
  }
}
