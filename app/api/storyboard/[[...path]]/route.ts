import { NextRequest, NextResponse } from 'next/server'

const MUAPI_BASE = process.env.MUAPI_BASE_URL || 'https://api.muapi.ai'
const STORYBOARD_MODEL = process.env.STORYBOARD_MODEL || 'openai-sora-2-pro-storyboard'
// Image model used to render per-shot storyboard frames (still previews).
const FRAME_MODEL = process.env.STORYBOARD_FRAME_MODEL || 'flux-dev'

const DURATIONS = [10, 15, 25]

function resolveKey(req: NextRequest): string {
  const headerKey = req.headers.get('x-api-key')?.trim()
  if (headerKey) return headerKey
  const envKey = process.env.MUAPI_API_KEY || process.env.MUAPI_KEY || ''
  if (envKey) return envKey
  const cookieKey = req.cookies.get('muapi_key')?.value
  return cookieKey || ''
}

function authHeaders(key: string): HeadersInit {
  const clean = key.replace(/[^\u0000-\u00FF]/g, '').trim()
  return { 'Content-Type': 'application/json', 'x-api-key': clean }
}

function parseError(text: string): string {
  try {
    const parsed = JSON.parse(text)
    return parsed.detail || parsed.error || parsed.message || text
  } catch {
    return text
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path = [] } = await params
    if (path.length > 0 && path[0] === 'frame') {
      return generateFrame(req)
    }
    if (path.length > 0 && path[0] !== 'generate') {
      return NextResponse.json({ error: `Unknown storyboard endpoint: ${path.join('/')}` }, { status: 404 })
    }

    const key = resolveKey(req)
    if (!key) return NextResponse.json({ error: 'MuAPI key is required' }, { status: 400 })

    const body = await req.json().catch(() => ({}))

    const rawShots = Array.isArray(body.shots) ? body.shots : []
    const shots = rawShots
      .map((s: any) => ({
        scene: String(s?.scene ?? '').trim(),
        duration: Math.min(10, Math.max(0, Number(s?.duration) || 1)),
      }))
      .filter((s: any) => s.scene)
      .slice(0, 30)

    if (shots.length === 0) {
      return NextResponse.json({ error: 'At least one shot with a scene description is required' }, { status: 400 })
    }

    const payload: any = {
      shots,
      duration: DURATIONS.includes(Number(body.duration)) ? Number(body.duration) : 10,
      aspect_ratio: body.aspect_ratio === '16:9' ? '16:9' : '9:16',
    }

    // Honor a client-selected storyboard-capable model, falling back to the
    // configured default when none (or an empty value) is provided.
    const bodyModel =
      typeof body?.model === 'string' && body.model.trim() ? body.model.trim() : STORYBOARD_MODEL

    if (Array.isArray(body.images_list) && body.images_list.length > 0) {
      payload.images_list = body.images_list.slice(0, 1).map(String)
    }

    const res = await fetch(`${MUAPI_BASE}/api/v1/${bodyModel}`, {
      method: 'POST',
      headers: authHeaders(key),
      body: JSON.stringify(payload),
    })

    const text = await res.text()
    if (!res.ok) {
      const detail = parseError(text)
      const status = res.status === 401 || res.status === 403 ? 401 : 500
      return NextResponse.json({ error: `Storyboard generation failed: ${res.status} - ${String(detail).slice(0, 300)}` }, { status })
    }

    const data = JSON.parse(text)
    const requestId = data.request_id || data.id || data.task_id
    if (!requestId) {
      return NextResponse.json({ error: 'No request id returned from storyboard API' }, { status: 502 })
    }

    return NextResponse.json({ request_id: requestId, status: data.status || 'queued' })
  } catch (err: any) {
    console.error('[storyboard generate]', err)
    return NextResponse.json({ error: err?.message || 'Storyboard generation error' }, { status: 500 })
  }
}

/**
 * Generate a single still frame for one shot using an image model (Flux by
 * default). Returns { request_id } and is polled via the same GET /result route.
 */
async function generateFrame(req: NextRequest) {
  try {
    const key = resolveKey(req)
    if (!key) return NextResponse.json({ error: 'MuAPI key is required' }, { status: 400 })

    const body = await req.json().catch(() => ({}))
    const prompt = String(body?.prompt ?? '').trim()
    if (!prompt) {
      return NextResponse.json({ error: 'A prompt is required to generate a frame' }, { status: 400 })
    }

    const model = typeof body?.model === 'string' && body.model.trim() ? body.model.trim() : FRAME_MODEL
    const payload: any = {
      prompt,
      aspect_ratio: body?.aspect_ratio === '16:9' ? '16:9' : '9:16',
    }
    if (Array.isArray(body?.images_list) && body.images_list.length > 0) {
      payload.images_list = body.images_list.slice(0, 4).map(String)
    } else if (typeof body?.image_url === 'string' && body.image_url.trim()) {
      payload.image_url = body.image_url.trim()
      payload.strength = typeof body?.strength === 'number' ? body.strength : 0.6
    }

    const res = await fetch(`${MUAPI_BASE}/api/v1/${model}`, {
      method: 'POST',
      headers: authHeaders(key),
      body: JSON.stringify(payload),
    })

    const text = await res.text()
    if (!res.ok) {
      const detail = parseError(text)
      const status = res.status === 401 || res.status === 403 ? 401 : 500
      return NextResponse.json(
        { error: `Frame generation failed: ${res.status} - ${String(detail).slice(0, 300)}` },
        { status }
      )
    }

    const data = JSON.parse(text)
    const requestId = data.request_id || data.id || data.task_id
    if (!requestId) {
      return NextResponse.json({ error: 'No request id returned from frame API' }, { status: 502 })
    }
    return NextResponse.json({ request_id: requestId, status: data.status || 'queued' })
  } catch (err: any) {
    console.error('[storyboard frame]', err)
    return NextResponse.json({ error: err?.message || 'Frame generation error' }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path = [] } = await params
    if (path.length > 0 && path[0] !== 'result') {
      return NextResponse.json({ error: `Unknown storyboard endpoint: ${path.join('/')}` }, { status: 404 })
    }

    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const key = resolveKey(req)
    if (!key) return NextResponse.json({ error: 'MuAPI key is required' }, { status: 400 })

    const res = await fetch(`${MUAPI_BASE}/api/v1/predictions/${id}/result`, {
      method: 'GET',
      headers: authHeaders(key),
    })

    const text = await res.text()
    if (!res.ok) {
      const detail = parseError(text)
      return NextResponse.json({ error: `Status check failed: ${res.status} - ${String(detail).slice(0, 300)}` }, { status: 500 })
    }

    const data = JSON.parse(text)
    const rawStatus = String(data?.data?.status || data?.status || '').toLowerCase()
    const status =
      rawStatus === 'completed' || rawStatus === 'succeeded' || rawStatus === 'success'
        ? 'completed'
        : rawStatus === 'failed' || rawStatus === 'error'
          ? 'failed'
          : 'processing'

    const output = data?.output
    const url =
      (typeof output === 'string' ? output : output?.url) ||
      data?.url ||
      data?.video_url ||
      (Array.isArray(data?.outputs) ? data.outputs[0] : undefined) ||
      (Array.isArray(data?.data?.outputs) ? data.data.outputs[0] : undefined) ||
      null

    return NextResponse.json({
      request_id: id,
      status,
      url,
      error: data?.error || data?.data?.error || null,
    })
  } catch (err: any) {
    console.error('[storyboard result]', err)
    return NextResponse.json({ error: err?.message || 'Storyboard result error' }, { status: 500 })
  }
}
