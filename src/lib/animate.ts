import { getSupabaseAdmin } from '@/src/lib/supabaseServer'
import muapi from '@/lib/muapi'

interface MuapiPrediction {
  request_id?: string
  id?: string
  status?: string
  outputs?: string[]
  url?: string
  output?: { url?: string }
}

interface AnimationRecord {
  id: string
  brand_id: string | null
  source_url: string
  resolution: string
  duration: number
  request_id: string
  video_url: string | null
  created_at: string
  updated_at: string
}

export async function createAnimation(sourceUrl: string, brandId?: string, resolution: string = '720p', duration: number = 5): Promise<AnimationRecord & { request_id: string }> {
  const supabase = getSupabaseAdmin()

  const prediction = (await muapi.post('/seedance-lite-i2v', {
    image_url: sourceUrl,
    resolution,
    duration,
  })) as MuapiPrediction

  const requestId = prediction.request_id || prediction.id
  if (!requestId) throw new Error('MuAPI did not return a request_id')

  const { data: animation, error } = await supabase
    .from('brand_animations')
    .insert({
      brand_id: brandId || null,
      source_url: sourceUrl,
      resolution,
      duration,
      request_id: requestId,
    })
    .select('*')
    .single()

  if (error) throw error
  return { ...animation, request_id: requestId }
}

export async function pollAnimation(requestId: string): Promise<{ status: string; video_url: string }> {
  const supabase = getSupabaseAdmin()

  const result = (await muapi.get(`/predictions/${encodeURIComponent(requestId)}/result`)) as MuapiPrediction
  const status = result.status === 'completed' || result.status === 'succeeded' || result.status === 'success' ? 'completed' :
                 result.status === 'failed' || result.status === 'error' ? 'failed' : 'pending'

  if (status === 'completed') {
    const videoUrl = extractVideoUrl(result)
    await supabase
      .from('brand_animations')
      .update({ video_url: videoUrl, updated_at: new Date().toISOString() })
      .eq('request_id', requestId)
  }

  return { status, video_url: status === 'completed' ? extractVideoUrl(result) : '' }
}

function extractVideoUrl(result: MuapiPrediction): string {
  return result.outputs?.[0] || result.url || result.output?.url || ''
}
