import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabaseAsUser } from '@/lib/supabaseServer'
import { apiError } from '@/lib/apiError'
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement'
import { ENTITLEMENTS } from '@/access/entitlements'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return apiError('unauthorized', 'Authentication required', 401)
  }

  const supabase = await getSupabaseAsUser()
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return apiError('bad_request', 'id required', 400)

  const { data, error } = await supabase
    .from('brand_dna')
    .select('*, brand_campaigns(*)')
    .eq('id', id)
    .single()

  if (error || !data) {
    return apiError('not_found', 'Brand not found', 404)
  }

  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return apiError('unauthorized', 'Authentication required', 401)
  }

  const supabase = await getSupabaseAsUser()
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return apiError('bad_request', 'id required', 400)

  const entitlementCheck = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO)
  if (!entitlementCheck.allowed) {
    return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO)
  }

  const { data: existing } = await supabase
    .from('brand_dna')
    .select('id')
    .eq('id', id)
    .single()

  if (!existing) {
    return apiError('not_found', 'Brand not found', 404)
  }

  let body: any = {}
  try { body = await req.json() } catch {}

  const allowedFields = [
    'brand_name', 'industry', 'tagline', 'value_proposition',
    'tone_of_voice', 'brand_personality', 'target_audience',
    'key_messages', 'primary_colors', 'secondary_colors',
    'fonts', 'logo_url', 'screenshot_url', 'imagery_style',
    'layout_style', 'raw_json',
  ]

  const patch: any = {}
  for (const key of allowedFields) {
    if (body[key] !== undefined) {
      patch[key] = body[key]
    }
  }

  const toStringArray = (v: any): string[] => {
    if (!v) return []
    if (Array.isArray(v)) return v.filter((x: any) => typeof x === 'string')
    if (typeof v === 'string') return v.split(',').map((s: string) => s.trim()).filter(Boolean)
    return []
  }

  if (patch.tone_of_voice !== undefined) patch.tone_of_voice = toStringArray(patch.tone_of_voice).join(', ')
  if (patch.brand_personality !== undefined) patch.brand_personality = toStringArray(patch.brand_personality).join(', ')
  if (patch.key_messages !== undefined) patch.key_messages = toStringArray(patch.key_messages).join(', ')
  if (patch.primary_colors !== undefined) patch.primary_colors = toStringArray(patch.primary_colors).join(', ')
  if (patch.secondary_colors !== undefined) patch.secondary_colors = toStringArray(patch.secondary_colors).join(', ')
  if (patch.fonts !== undefined) patch.fonts = toStringArray(patch.fonts).join(', ')
  patch.updated_at = new Date().toISOString()

  const { data: updated, error } = await supabase
    .from('brand_dna')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return apiError('server_error', error.message, 500)
  }

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return apiError('unauthorized', 'Authentication required', 401)
  }

  const supabase = await getSupabaseAsUser()
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return apiError('bad_request', 'id required', 400)

  const entitlementCheck = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO)
  if (!entitlementCheck.allowed) {
    return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO)
  }

  const { error } = await supabase
    .from('brand_dna')
    .delete()
    .eq('id', id)

  if (error) {
    return apiError('server_error', error.message, 500)
  }

  return NextResponse.json({ ok: true })
}
