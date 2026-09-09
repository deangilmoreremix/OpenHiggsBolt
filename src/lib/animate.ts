import { getSupabaseAdmin } from '@/src/lib/supabaseServer'
import muapi from '@/lib/muapi'

export async function createAnimation(sourceUrl: string, brandId?: string, resolution: string = '720p', duration: number = 5): Promise<any> {
  const supabase = getSupabaseAdmin()

  const prediction = await muapi.post('/seedance-lite-i2v', {
    image_url: sourceUrl,
    resolution,
    duration,
  })

  const requestId = prediction.request_id || prediction.id
  if (!requestId) throw new Error('MuAPI did not return a request_id')

  const { data: animation, error } = await supabase
    .from('brand_animations')
    .insert({
      brand_id: brandId || null,
      source_url: sourceUrl,
      resolution,
      duration,
    })
    .select('*')
    .single()

  if (error) throw error
  return { ...animation, request_id: requestId }
}

export async function pollAnimation(requestId: string): Promise<any> {
  const supabase = getSupabaseAdmin()

  const result = await muapi.get(`/predictions/${encodeURIComponent(requestId)}/result`)
  const status = result.status === 'completed' || result.status === 'succeeded' || result.status === 'success' ? 'completed' :
                 result.status === 'failed' || result.status === 'error' ? 'failed' : 'pending'

  if (status === 'completed') {
    const videoUrl = result.outputs?.[0] || result.url || result.output?.url || ''
    await supabase
      .from('brand_animations')
      .update({ video_url: videoUrl, updated_at: new Date().toISOString() })
      .eq('id', requestId)
  }

  return { status, video_url: status === 'completed' ? (result.outputs?.[0] || result.url || result.output?.url || '') : '' }
}
