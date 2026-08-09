import { NextRequest, NextResponse } from 'next/server'
import { getServerVFXClient } from '@/api/vfx'
import { isRequestCancelled } from '../cancel/route'

function cancelledResponse(id: string) {
  return { request_id: id, status: 'cancelled' as const }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // If this job was cancelled, never report a billable completion back to the
    // client. Return `cancelled` so polling stops and the result is discarded.
    if (isRequestCancelled(id)) {
      return NextResponse.json(cancelledResponse(id))
    }

    const clientKey = req.headers.get('x-api-key')?.trim()
    const apiKey = clientKey || process.env.MUAPI_API_KEY || process.env.MUAPI_KEY || ''
    if (!apiKey) {
      return NextResponse.json({ error: 'MuAPI key is required' }, { status: 400 })
    }
    const client = getServerVFXClient(apiKey)
    const status = await client.getGenerationResult(id)

    // Guard against a race: the job may have completed between the cancel call
    // and this poll. If it finished after cancellation, discard the result.
    if (isRequestCancelled(id)) {
      return NextResponse.json(cancelledResponse(id))
    }

    return NextResponse.json(status)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[VFX status]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
