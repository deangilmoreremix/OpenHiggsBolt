import { NextRequest, NextResponse } from 'next/server'

const MUAPI_KEY = process.env.MUAPI_KEY || process.env.NEXT_PUBLIC_MUAPI_KEY || ''

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, image_url, name, aspect_ratio, resolution, quality, duration } = body

    if (!image_url) {
      return NextResponse.json({ error: 'image_url is required' }, { status: 400 })
    }

    const payload = {
      prompt: prompt || `Apply ${name} effect cinematically`,
      image_url,
      name: name || 'Car Explosion',
      aspect_ratio: aspect_ratio || '16:9',
      resolution: resolution || '480p',
      quality: quality || 'medium',
      duration: Number(duration) || 5,
    }

    const res = await fetch('https://api.muapi.ai/api/v1/generate_wan_ai_effects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': MUAPI_KEY,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[VFX generate]', res.status, err)
      return NextResponse.json({ error: err }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[VFX generate exception]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
