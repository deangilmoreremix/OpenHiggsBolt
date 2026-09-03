import { NextRequest, NextResponse } from 'next/server'
import { ok, apiError } from '@/lib/apiError'
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement'
import { ENTITLEMENTS } from '@/access/entitlements'
import { auth } from '@clerk/nextjs/server'
import { getSupabaseAdmin } from '@/src/lib/supabaseServer'

const MUAPI = 'https://api.muapi.ai/api/v1'
const STATUS_TIMEOUT_MS = 30000
const SUBMIT_TIMEOUT_MS = 30000
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

function getKey(req: NextRequest): string {
  return req.headers.get('x-api-key') || ''
}

async function submitImage(payload: any, key: string): Promise<string> {
  const submit = await fetch(`${MUAPI}/gpt-image-2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(SUBMIT_TIMEOUT_MS),
  })
  const submitText = await submit.text()
  if (!submit.ok) {
    let detail = submitText
    try { detail = JSON.parse(submitText)?.detail || detail } catch {}
    throw new Error(`MuAPI submit failed (${submit.status}): ${detail}`)
  }
  const submitData = JSON.parse(submitText)
  const requestId = submitData.request_id || submitData.id
  if (!requestId) throw new Error('MuAPI did not return a request_id')
  return requestId
}

function statusFrom(data: any): 'pending' | 'completed' | 'failed' {
  const s = (data?.status || '').toLowerCase()
  if (s === 'completed' || s === 'succeeded' || s === 'success') return 'completed'
  if (s === 'failed' || s === 'error') return 'failed'
  return 'pending'
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  const entitlementCheck = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO);
  if (!entitlementCheck.allowed) {
    if (entitlementCheck.status === 401) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }
    return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO);
  }

  const { searchParams } = new URL(req.url)
  const requestId = searchParams.get('requestId')
  const brandId = searchParams.get('brand_id')

  if (requestId) {
    const key = getKey(req)
    if (!key) return apiError('bad_request', 'MuAPI key required', 400)

    const supabase = getSupabaseAdmin()
    const { data: record } = await supabase
      .from('photo_studio_records')
      .select('*')
      .eq('request_id', requestId)
      .eq('clerk_user_id', userId)
      .maybeSingle()

    if (!record) {
      return apiError('forbidden', 'You do not own this request', 403)
    }

    try {
      const poll = await fetch(`${MUAPI}/predictions/${requestId}/result`, {
        headers: { 'x-api-key': key },
        signal: AbortSignal.timeout(STATUS_TIMEOUT_MS),
      })
      const pollText = await poll.text()
      if (!poll.ok) {
        let detail = pollText
        try { detail = JSON.parse(pollText)?.detail || detail } catch {}
        return apiError('upstream_error', `MuAPI poll failed (${poll.status}): ${detail}`, 502)
      }
      const data = JSON.parse(pollText)
      const status = statusFrom(data)
      if (status === 'completed') {
        const imageUrl = data.outputs?.[0] || data.url || data.output?.url || ''
        if (imageUrl && record.status !== 'completed') {
          await supabase
            .from('photo_studio_records')
            .update({
              status: 'completed',
              image_url: imageUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('id', record.id)
        }
        return ok({ status: 'completed', image_url: imageUrl })
      }
      if (status === 'failed') {
        await supabase
          .from('photo_studio_records')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', record.id)
        return apiError('generation_failed', data.error || 'Generation failed', 502)
      }
      return ok({ status: 'pending' })
    } catch (err: any) {
      return apiError('poll_failed', err.message || 'Polling failed', 502)
    }
  }

  // List history
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const rawPageSize = parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, rawPageSize))

  const supabase = getSupabaseAdmin()
  let query = supabase
    .from('photo_studio_records')
    .select('*', { count: 'exact' })
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })

  if (brandId) {
    query = query.eq('brand_id', brandId)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data: items, count } = await query.range(from, to)

  const total = count || 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)

  return ok(items || [], { page: safePage, pageSize, total, totalPages })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  const entitlementCheck = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO);
  if (!entitlementCheck.allowed) {
    if (entitlementCheck.status === 401) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }
    return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO);
  }

  const key = getKey(req)
  if (!key) return apiError('bad_request', 'MuAPI key required', 400)

  let body: any
  try { body = await req.json() } catch { return apiError('bad_request', 'Invalid JSON', 400) }
  const { brand_id, product_url, category, style } = body
  if (!style) return apiError('bad_request', 'style is required', 400)

  const prompt = [
    'Professional product photography',
    category ? `of a ${category} product` : '',
    `in a ${style} style`,
    'clean commercial studio lighting, high-resolution, e-commerce shot',
  ].filter(Boolean).join(', ')

  const payload: any = { prompt, aspect_ratio: '1:1', n: 1 }
  if (product_url) payload.image_url = product_url

  try {
    const requestId = await submitImage(payload, key)
    const supabase = getSupabaseAdmin()
    await supabase
      .from('photo_studio_records')
      .insert({
        clerk_user_id: userId,
        request_id: requestId,
        brand_id: brand_id || undefined,
        style,
        category: category || '',
        status: 'pending',
      })
    return ok({ requestId, status: 'pending' })
  } catch (err: any) {
    return apiError('submit_failed', err.message || 'Submission failed', 500)
  }
}
