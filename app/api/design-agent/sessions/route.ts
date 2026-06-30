import { NextRequest, NextResponse } from 'next/server'
import { proxyToCreativeAgent, corsPreflight } from '../_proxy'

export async function OPTIONS() {
  return corsPreflight()
}

export async function GET(req: NextRequest) {
  return proxyToCreativeAgent(req, { pathSegments: ['sessions'] })
}

export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  if (!body || typeof body.name !== 'string' || !body.name.trim()) {
    return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 })
  }
  const forwardReq = new NextRequest(req.url, {
    method: req.method,
    headers: req.headers,
    body: JSON.stringify(body),
  })
  return proxyToCreativeAgent(forwardReq, { pathSegments: ['sessions'] })
}
