import { NextRequest, NextResponse } from 'next/server'

const MUAPI_KEY = process.env.MUAPI_KEY || process.env.NEXT_PUBLIC_MUAPI_KEY || ''

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  try {
    const res = await fetch(`https://api.muapi.ai/api/v1/predictions/${id}/result`, {
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
      video_url: data.outputs?.[0] || data.output?.url || data.url || null,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
