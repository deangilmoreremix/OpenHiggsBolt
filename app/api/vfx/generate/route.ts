import { NextRequest, NextResponse } from 'next/server'
import { getServerVFXClient } from '@/api/vfx'
import { validateMuAPIKey } from '../_helpers'
import { validateGenerationInput } from '../_validation'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validationErrors = validateGenerationInput(body)

    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors.join('; ') }, { status: 400 })
    }

    const {
      prompt,
      image_url,
      effect,
      aspect_ratio = '16:9',
      resolution = '480p',
      quality = 'medium',
      duration = 5,
    } = body

    const apiKey = await validateMuAPIKey()
    const client = getServerVFXClient(apiKey)

    const result = await client.generateVFX({
      prompt,
      image_url,
      effect,
      aspect_ratio,
      resolution,
      quality,
      duration: Number(duration),
    })

    return NextResponse.json({
      request_id: result.request_id,
      status: result.status,
      message: result.message,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[VFX generate]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
