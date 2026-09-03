import { safeApiJson } from '@/lib/safeApiResponse';
import { NextRequest, NextResponse } from 'next/server'
import { validateMuAPIKey } from '../_helpers'
import { validateUploadFile } from '../_validation'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, rateLimit429 } from '@/lib/rateLimit'
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement'
import { ENTITLEMENTS } from '@/access/entitlements'

// Per-key rate limit: 10 requests / 60s, keyed by the resolved MuAPI apiKey.
// Tune via rateLimit(key, { windowMs, max }).
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 60_000

export async function POST(req: NextRequest) {
  const entitlementCheck = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO);
  if (!entitlementCheck.allowed) {
    if (entitlementCheck.status === 401) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }
    return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO);
  }

  try {
    // Rate-limit key: env key OR client-provided x-api-key (do NOT call the
    // async cookie helper here just for the limit key — the route resolves the
    // real key via validateMuAPIKey() below).
    const clientKey = req.headers.get('x-api-key')?.trim()
    const limitKey =
      clientKey || process.env.MUAPI_API_KEY || process.env.MUAPI_KEY || ''
    const limit = rateLimit(limitKey, { windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX })
    if (!limit.allowed) {
      return rateLimit429(limit.retryAfterMs)
    }

    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Request must be multipart/form-data' }, { status: 400 })
    }

    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }

    const validationError = validateUploadFile(file)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const apiKey = await validateMuAPIKey(req)

    // Try MuAPI upload first
    const muapiForm = new FormData()
    muapiForm.append('file', file)

    const res = await fetch('https://api.muapi.ai/api/v1/upload_file', {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: muapiForm,
    })

    if (res.ok) {
      const data = await safeApiJson(res)
      const url = data.url || data.file_url || data.data?.url

      if (url && typeof url === 'string') {
        return NextResponse.json({
          url,
          name: file.name,
          size: file.size,
          type: file.type,
        })
      }
    }

    // MuAPI rejected the upload — surface the reason before falling back
    const muapiErrText = await res.text().catch(() => 'Upload failed')
    const muapiDetail = (() => {
      try {
        const parsed = JSON.parse(muapiErrText)
        return parsed.detail || parsed.error || parsed.message || muapiErrText
      } catch {
        return muapiErrText
      }
    })()
    console.warn(`[VFX upload] MuAPI responded ${res.status}: ${muapiDetail}`)

    // Fallback: upload to Supabase Storage
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      const muapiErrorSummary = muapiDetail || 'MuAPI upload rejected'
      return NextResponse.json({
        error: muapiErrorSummary,
        hint: 'Upload failed: MuAPI rejected the file and no fallback storage is configured.',
      }, { status: res.status || 502 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
    const bucket = 'vfx-uploads'

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[VFX upload supabase fallback]', uploadError)
      return NextResponse.json({
        error: `Storage upload failed: ${uploadError.message}`,
        hint: 'Ensure the "vfx-uploads" bucket exists and has write policies applied.',
      }, { status: 502 })
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return NextResponse.json({
      url: urlData.publicUrl,
      name: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[VFX upload exception]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
