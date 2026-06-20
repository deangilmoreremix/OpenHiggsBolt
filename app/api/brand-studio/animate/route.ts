import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/shared/api/supabase'

export const maxDuration = 120

const MUAPI_KEY = process.env.MUAPI_KEY || process.env.NEXT_PUBLIC_MUAPI_KEY || ''
const MUAPI_BASE = 'https://api.muapi.ai/api/v1'

export async function POST(req: NextRequest) {
  try {
    const { brandId, sourceUrl, resolution, duration, prompt } = await req.json()

    const { data: brand } = await supabase.from('brand_dna').select('*').eq('id', brandId).single()
    const brandPrompt = brand ? `${brand.name} brand video, ${brand.tone?.[0]} tone` : ''

    // Submit to MuAPI seedance-lite-i2v
    const submitRes = await fetch(`${MUAPI_BASE}/seedance-lite-i2v`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': MUAPI_KEY },
      body: JSON.stringify({
        image_url: sourceUrl,
        prompt: prompt || brandPrompt || 'cinematic smooth camera movement',
        resolution: resolution || '720p',
        duration: duration || 5,
      }),
    })

    const submitData = await submitRes.json()
    const requestId = submitData.request_id || submitData.id

    if (!requestId) throw new Error('No request ID from MuAPI')

    // Poll for result
    let videoUrl: string | null = null
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 5000))
      const pollRes = await fetch(`${MUAPI_BASE}/predictions/${requestId}/result`, {
        headers: { 'x-api-key': MUAPI_KEY },
      })
      const pollData = await pollRes.json()
      const status = (pollData.status || '').toLowerCase()
      if (status === 'completed' || pollData.outputs?.[0] || pollData.url) {
        videoUrl = pollData.outputs?.[0] || pollData.url || null
        break
      }
      if (status === 'failed') throw new Error('Animation generation failed')
    }

    const { data: animation, error } = await supabase.from('brand_animations').insert({
      brand_id: brandId,
      source_url: sourceUrl,
      video_url: videoUrl,
      resolution: resolution || '720p',
      duration: duration || 5,
    }).select().single()

    if (error) throw error
    return NextResponse.json(animation)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
