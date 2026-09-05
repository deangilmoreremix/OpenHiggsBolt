import { NextRequest, NextResponse } from 'next/server'
import { getMuApiKeyFromRequest } from '../lib/auth'
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement'
import { ENTITLEMENTS } from '@/access/entitlements'
import { safeApiJson } from '@/lib/safeApiResponse'

const GENERATION_GET_PATTERNS = [
  /\/gpt-image-2$/,
  /\/text-to-video$/,
  /\/image-generation$/,
  /\/video-generation$/,
  /\/predictions\/[^/]+\/result$/,
]

function isGenerationGet(path: string): boolean {
  return GENERATION_GET_PATTERNS.some((re) => re.test(path))
}

const BASE = 'https://api.muapi.ai/api/v1'

export async function GET(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const path = '/' + (params.slug || []).join('/')

  if (isGenerationGet(path)) {
    const entitlementCheck = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO);
    if (!entitlementCheck.allowed) {
      if (entitlementCheck.status === 401) {
        return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
      }
      return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO);
    }
  }

  try {
    let key: string
    try {
      key = await getMuApiKeyFromRequest(req)
    } catch {
      return NextResponse.json({ error: 'Unauthorized: Missing API key' }, { status: 401 })
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
    const data = await safeApiJson(res)
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    const status = err instanceof Response ? err.status : 500
    const message = status === 401 ? 'Unauthorized' : status === 400 ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const path = '/' + (params.slug || []).join('/')

  const entitlementCheck = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO);
  if (!entitlementCheck.allowed) {
    if (entitlementCheck.status === 401) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }
    return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO);
  }

  try {
    let key: string
    try {
      key = await getMuApiKeyFromRequest(req)
    } catch {
      return NextResponse.json({ error: 'Unauthorized: Missing API key' }, { status: 401 })
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
    const isJson = !contentType.includes('multipart/form-data')
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: {
        'x-api-key': key,
        ...(isJson ? { 'content-type': 'application/json' } : {}),
      },
      body: isJson ? JSON.stringify(body) : body,
      signal: AbortSignal.timeout(120000),
    })
    const data = await safeApiJson(res)
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    const status = err instanceof Response ? err.status : 500
    const message = status === 401 ? 'Unauthorized' : status === 400 ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status })
  }
}
