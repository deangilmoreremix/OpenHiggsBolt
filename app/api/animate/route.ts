import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement'
import { ENTITLEMENTS } from '@/access/entitlements'
import { auth } from '@clerk/nextjs/server'
import { decryptMuapiKey } from '@/lib/muapiKeyCrypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getMuapiKeyForUser(): Promise<string | null> {
  const { userId } = await auth()
  if (!userId) return null

  const { data } = await supabase
    .from('app_users')
    .select('muapi_key')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  const stored = data?.muapi_key
  if (!stored) return null

  return decryptMuapiKey(stored)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const brandId = searchParams.get('brandId')

  const { data, error } = await supabase
    .from('brand_animations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(24)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json((data || []).map((a: any) => ({
    id: a.id,
    sourceImageUrl: a.source_image_url,
    videoUrl: a.video_url,
    prompt: a.prompt,
    duration: a.duration,
    resolution: a.resolution,
    sourceType: a.source_type,
    status: a.video_url ? 'done' : 'error',
  })))
}

export async function POST(req: NextRequest) {
  const entitlementCheck = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO)
  if (!entitlementCheck.allowed) {
    return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO)
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { sourceImageUrl, sourceType, prompt, duration, resolution, brandId } = body

  if (!sourceImageUrl || !prompt) {
    return NextResponse.json({ error: 'sourceImageUrl and prompt are required' }, { status: 400 })
  }

  const validSourceTypes = ['asset', 'photoshoot', 'upload']
  const resolvedSourceType = validSourceTypes.includes(sourceType) ? sourceType : 'upload'

  const row = await supabase
    .from('brand_animations')
    .insert({
      source_image_url: sourceImageUrl,
      source_type: resolvedSourceType,
      source_id: null,
      prompt,
      duration: duration || 5,
      resolution: resolution || '720p',
      brand_id: brandId || null,
    })
    .select()
    .single()

  if (row.error) {
    return NextResponse.json({ error: row.error.message }, { status: 500 })
  }

  const muapiKey = await getMuapiKeyForUser()
  if (!muapiKey) {
    return NextResponse.json({ error: 'MuAPI key not configured. Add your MuAPI key in Settings.' }, { status: 400 })
  }

  const animation = row.data

  try {
    const muapiRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/animate-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        sourceImageUrl: animation.source_image_url,
        prompt: animation.prompt,
        duration: animation.duration,
        resolution: animation.resolution,
        muapiKey,
      }),
    })

    const muapiData = await muapiRes.json()

    if (!muapiRes.ok || !muapiData.videoUrl) {
      await supabase.from('brand_animations').delete().eq('id', animation.id)
      return NextResponse.json({ error: muapiData.error || 'video generation failed' }, { status: 502 })
    }

    const updated = await supabase
      .from('brand_animations')
      .update({ video_url: muapiData.videoUrl })
      .eq('id', animation.id)
      .select()
      .single()

    return NextResponse.json({
      id: updated.data.id,
      videoUrl: updated.data.video_url,
      sourceImageUrl: updated.data.source_image_url,
      duration: updated.data.duration,
      resolution: updated.data.resolution,
      sourceType: updated.data.source_type,
      prompt: updated.data.prompt,
    })
  } catch (err: any) {
    await supabase.from('brand_animations').delete().eq('id', animation.id)
    return NextResponse.json({ error: err.message || 'video generation failed' }, { status: 500 })
  }
}
