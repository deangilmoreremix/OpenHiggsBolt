import { NextRequest, NextResponse } from 'next/server'

const MUAPI_KEY = process.env.MUAPI_KEY || process.env.NEXT_PUBLIC_MUAPI_KEY || ''
const MUAPI_BASE = 'https://api.muapi.ai/api/v1'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const res = await fetch(`${MUAPI_BASE}/predictions/${id}/result`, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': MUAPI_KEY,
      },
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: err }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json({
      ...data,
      video_url: data.outputs?.[0] || data.output?.url || null,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
