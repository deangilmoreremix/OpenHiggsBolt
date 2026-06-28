import { NextRequest, NextResponse } from 'next/server'
import { getServerVFXClient } from '@/api/vfx'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const clientKey = req.headers.get('x-api-key')?.trim()
    const apiKey = clientKey || process.env.MUAPI_API_KEY || process.env.MUAPI_KEY || ''
    if (!apiKey) {
      return NextResponse.json({ error: 'MuAPI key is required' }, { status: 400 })
    }
    const client = getServerVFXClient(apiKey)
    const status = await client.getGenerationResult(id)

    return NextResponse.json(status)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[VFX status]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
