import { NextRequest, NextResponse } from 'next/server'
import { getServerVFXClient } from '@/api/vfx'
import { validateMuAPIKey } from '../_helpers'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const apiKey = await validateMuAPIKey()
    const client = getServerVFXClient(apiKey)
    const status = await client.getGenerationResult(id)

    return NextResponse.json(status)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[VFX status]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
