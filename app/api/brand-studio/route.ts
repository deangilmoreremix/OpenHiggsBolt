import { NextRequest, NextResponse } from 'next/server'
import { ok, apiError } from '@/lib/apiError'
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement'
import { ENTITLEMENTS } from '@/access/entitlements'
import { createMuapi, MuapiError } from '@/src/lib/brandStudio/muapiServer'
import { analyzeSite, generateConcepts, generateAsset, regenerateAssetImage, generateProductPhoto } from '@/src/lib/brandStudio/pipeline'
import { scrapeBrandStatic, UnsafeUrlError } from '@/src/lib/brandStudio/staticScrape'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Stateless Brand Studio generation endpoint (Open-Pomelli parity). BYOK: the caller's MuAPI key comes in the
 * x-api-key header and is used for that request only. Persistence stays with /api/brand(s), /api/assets.
 */
export async function POST(req: NextRequest) {
  const gate = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO)
  if (!gate.allowed) {
    if (gate.status === 401) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
    return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO)
  }
  const key = req.headers.get('x-api-key') || ''
  if (!key) return apiError('bad_request', 'MuAPI key required', 400)

  let body: any
  try { body = await req.json() } catch { return apiError('bad_request', 'Invalid JSON', 400) }
  const mu = createMuapi({ key })

  try {
    switch (body.action) {
      case 'analyze': {
        const raw = String(body.url || '').trim()
        if (!raw) return apiError('bad_request', 'url is required', 400)
        const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
        const site = await scrapeBrandStatic(url).catch((e) => {
          if (e instanceof UnsafeUrlError) throw e
          return null // unreachable site: the model infers from the domain, as upstream does
        })
        const empty = { url, title: '', description: '', bodyText: '', ogImage: null, favicon: null, logoCandidates: [], fonts: [], rawColors: [], images: [], videos: [], screenshot: null, blocked: false }
        return ok(await analyzeSite(mu, site ?? empty, url))
      }
      case 'concepts':
        if (!body.brand || !body.goal) return apiError('bad_request', 'brand and goal are required', 400)
        return ok(await generateConcepts(mu, body.brand, String(body.goal), String(body.direction || '')))
      case 'asset':
        if (!body.brand || !body.concept || !body.platform) return apiError('bad_request', 'brand, concept and platform are required', 400)
        return ok(await generateAsset(mu, body.brand, body.concept, String(body.platform), { noText: body.noText }))
      case 'regenerate-image':
        if (!body.brand || !body.concept || !body.platform) return apiError('bad_request', 'brand, concept and platform are required', 400)
        return ok({ imageUrl: await regenerateAssetImage(mu, body.brand, body.concept, String(body.platform), String(body.headline || ''), { noText: body.noText }) })
      case 'photo':
        if (!body.productImageUrl) return apiError('bad_request', 'productImageUrl is required', 400)
        return ok(await generateProductPhoto(mu, body))
      case 'upload':
        if (typeof body.data !== 'string') return apiError('bad_request', 'data is required', 400)
        return ok({ url: await mu.upload(body.data, String(body.filename || 'upload.png'), String(body.contentType || 'image/png')) })
      case 'animate': {
        if (!body.sourceUrl) return apiError('bad_request', 'sourceUrl is required', 400)
        const duration = Math.min(12, Math.max(3, Number(body.duration) || 5))
        const resolution = ['480p', '720p', '1080p'].includes(body.resolution) ? body.resolution : '480p'
        const sub = await mu.submit('seedance-lite-i2v', { prompt: String(body.prompt || ''), image_url: body.sourceUrl, resolution, duration })
        const requestId = sub?.request_id || sub?.id
        if (!requestId) return apiError('generation_failed', 'MuAPI did not return a request_id', 502)
        return ok({ requestId, resolution, duration })
      }
      case 'poll': {
        if (!body.requestId) return apiError('bad_request', 'requestId is required', 400)
        const r = await mu.pollOnce(String(body.requestId))
        const s = String(r?.status || '').toLowerCase()
        if (['completed', 'succeeded', 'success'].includes(s)) return ok({ status: 'completed', url: (r.outputs?.[0] || r.url || r.output?.url || '') as string })
        if (['failed', 'error'].includes(s) || r?.detail?.status === 'failed') return ok({ status: 'failed', error: String(r.error || r.detail?.error || 'Generation failed') })
        return ok({ status: 'pending' })
      }
      default:
        return apiError('bad_request', 'Unknown action', 400)
    }
  } catch (err: any) {
    if (err instanceof UnsafeUrlError) return apiError('bad_request', err.message, 400)
    if (err instanceof MuapiError) return apiError('upstream_error', err.message, err.status === 401 || err.status === 403 ? err.status : 502)
    return apiError('generation_failed', err?.message || 'Request failed', 500)
  }
}
