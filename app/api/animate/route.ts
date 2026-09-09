import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/src/lib/supabaseServer'
import { createAnimation, pollAnimation } from '@/lib/animate'
import { ok, apiError } from '@/lib/apiError'

export async function POST(req: NextRequest) {
  const { userId } = await (await import('@clerk/nextjs/server')).auth()
  if (!userId) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })

  let body: any = {}
  try { body = await req.json() } catch {}
  const { source_url, brand_id, resolution, duration } = body

  if (!source_url) {
    return apiError('bad_request', 'source_url is required', 400)
  }

  try {
    const animation = await createAnimation(source_url, brand_id, resolution, duration)
    return ok({ request_id: animation.request_id, id: animation.id })
  } catch (err: any) {
    return apiError('generation_failed', err.message || 'Animation failed', 500)
  }
}

export async function GET(req: NextRequest) {
  const { userId } = await (await import('@clerk/nextjs/server')).auth()
  if (!userId) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const requestId = searchParams.get('requestId')
  const brandId = searchParams.get('brand_id')

  if (requestId) {
    try {
      const result = await pollAnimation(requestId)
      return ok(result)
    } catch (err: any) {
      return apiError('poll_failed', err.message || 'Polling failed', 502)
    }
  }

  const supabase = getSupabaseAdmin()
  let query = supabase.from('brand_animations').select('*').order('created_at', { ascending: false })

  if (brandId) query = query.eq('brand_id', brandId)

  const { data: animations, error } = await query
  if (error) return apiError('server_error', error.message, 500)

  return ok(animations || [])
}
