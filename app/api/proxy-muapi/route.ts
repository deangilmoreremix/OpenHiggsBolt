import { NextRequest, NextResponse } from 'next/server'
import { validateMuAPIKey } from '../vfx/_helpers'

const MUAPI_BASE = 'https://api.muapi.ai'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const apiKey = await validateMuAPIKey()

    const res = await fetch(`${MUAPI_BASE}/api/v1/predictions/${id}/result`, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json({ error: errText }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json({
      ...data,
      video_url:
        data.video_url ||
        data.url ||
        (typeof data.output === 'string' ? data.output : data.output?.url) ||
        (Array.isArray(data.outputs) ? data.outputs[0] : null),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[proxy-muapi]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
