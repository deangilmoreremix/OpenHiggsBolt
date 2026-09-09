import { NextRequest, NextResponse } from 'next/server'
import { analyzeBrand } from '@/lib/brandAnalyzer'
import { ok, apiError } from '@/lib/apiError'

export async function POST(req: NextRequest) {
  let body: any = {}
  try { body = await req.json() } catch {}
  const { url } = body
  if (!url || typeof url !== 'string') {
    return apiError('bad_request', 'url is required', 400)
  }

  try {
    const brand = await analyzeBrand(url)
    return ok(brand)
  } catch (err: any) {
    return apiError('analysis_failed', err.message || 'Brand analysis failed', 500)
  }
}
