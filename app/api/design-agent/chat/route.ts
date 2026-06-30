import { NextRequest, NextResponse } from 'next/server'
import { proxyToCreativeAgent, corsPreflight } from '../_proxy'

export async function OPTIONS() {
  return corsPreflight()
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url)
  const sessionId = url.pathname.split('/').filter(Boolean).pop()
  if (!sessionId || sessionId === 'chat') {
    return NextResponse.json({ error: 'Missing sessionId in path' }, { status: 400 })
  }
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Empty request body' }, { status: 400 })
  }
  const hasMessages = Array.isArray(body.messages) && body.messages.length > 0
  const hasContent = typeof body.content === 'string' && body.content.length > 0
  if (!hasMessages && !hasContent) {
    return NextResponse.json(
      { error: 'Request body must include a non-empty "messages" array or a "content" field' },
      { status: 400 },
    )
  }
  const forwardReq = new NextRequest(req.url, {
    method: req.method,
    headers: req.headers,
    body: JSON.stringify(body),
  })
  return proxyToCreativeAgent(forwardReq, { pathSegments: ['sessions', sessionId, 'chat'] })
}
