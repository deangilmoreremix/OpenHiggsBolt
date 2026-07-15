import { NextRequest, NextResponse } from 'next/server'

// Photo Studio — MuAPI-backed product photography generation.
// Pattern: POST submits the job and returns { requestId } immediately (no
// blocking). The browser then polls GET ?requestId=..., which performs a
// single non-blocking status check against MuAPI and (on completion) records
// the result to history. This keeps the HTTP request short so it works on
// serverless (Netlify/Vercel) function runtimes.
// https://muapi.ai/docs/introduction  (submit + poll pattern)
const MUAPI = 'https://api.muapi.ai/api/v1'
const STATUS_TIMEOUT_MS = 30000
const SUBMIT_TIMEOUT_MS = 30000

function getKey(req: NextRequest): string {
  return req.headers.get('x-api-key') || req.cookies.get('muapi_key')?.value || ''
}

type PhotoRecord = {
  id: string
  requestId?: string
  brand_id?: string
  image_url: string
  style: string
  category: string
  created_at: string
  status: string
}
const history: PhotoRecord[] = []
const jobs = new Map<string, { brand_id?: string; style: string; category: string }>()

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
  const { searchParams } = new URL(req.url)
  const requestId = searchParams.get('requestId')
  const brandId = searchParams.get('brand_id')

  if (requestId) {
    const key = getKey(req)
    if (!key) return NextResponse.json({ error: 'MuAPI key required' }, { status: 400 })
    const meta = jobs.get(requestId)
    try {
      const poll = await fetch(`${MUAPI}/predictions/${requestId}/result`, {
        headers: { 'x-api-key': key },
        signal: AbortSignal.timeout(STATUS_TIMEOUT_MS),
      })
      const pollText = await poll.text()
      if (!poll.ok) {
        let detail = pollText
        try { detail = JSON.parse(pollText)?.detail || detail } catch {}
        return NextResponse.json({ status: 'failed', error: `MuAPI poll failed (${poll.status}): ${detail}` }, { status: 502 })
      }
      const data = JSON.parse(pollText)
      const status = statusFrom(data)
      if (status === 'completed') {
        const imageUrl = data.outputs?.[0] || data.url || data.output?.url || ''
        if (meta && imageUrl && !history.some((h) => h.requestId === requestId)) {
          history.unshift({
            id: `ph_${Date.now()}`,
            requestId,
            brand_id: meta.brand_id,
            image_url: imageUrl,
            style: meta.style,
            category: meta.category,
            created_at: new Date().toISOString(),
            status: 'completed',
          })
        }
        return NextResponse.json({ status: 'completed', image_url: imageUrl })
      }
      if (status === 'failed') {
        return NextResponse.json({ status: 'failed', error: data.error || 'Generation failed' })
      }
      return NextResponse.json({ status: 'pending' })
    } catch (err: any) {
      return NextResponse.json({ status: 'failed', error: err.message || 'Polling failed' }, { status: 502 })
    }
  }

  // History by brand (or all)
  const list = brandId ? history.filter((h) => h.brand_id === brandId) : history
  return NextResponse.json(list)
}

export async function POST(req: NextRequest) {
  const key = getKey(req)
  if (!key) return NextResponse.json({ error: 'MuAPI key required' }, { status: 400 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { brand_id, product_url, category, style } = body
  if (!style) return NextResponse.json({ error: 'style is required' }, { status: 400 })

  const prompt = [
    'Professional product photography',
    category ? `of a ${category} product` : '',
    `in a ${style} style`,
    'clean commercial studio lighting, high-resolution, e-commerce shot',
  ].filter(Boolean).join(', ')

  const payload: any = { prompt, aspect_ratio: '1:1', n: 1 }
  if (product_url) payload.image_url = product_url // image-to-image reference

  try {
    const requestId = await submitImage(payload, key)
    jobs.set(requestId, { brand_id: brand_id || undefined, style, category: category || '' })
    return NextResponse.json({ requestId, status: 'pending' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Submission failed' }, { status: 500 })
  }
}
