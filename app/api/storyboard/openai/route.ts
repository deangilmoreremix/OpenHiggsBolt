import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement'
import { ENTITLEMENTS } from '@/access/entitlements'
import { getOpenAiKeyForUser } from '@/src/lib/openaiKeyServer'
import {
  OPENAI_BASE,
  UPSTREAM_TIMEOUT_MS,
  edits,
  errorJson,
  gptImageSize,
  loadImage,
  readUpstream,
  toUrls,
  upstreamError,
  type ImagePart,
} from '@/src/lib/openaiImageApi'
import { defaultStoryboardOpenAiModel, storyboardOpenAiModels } from '@/src/lib/storyboardOpenAiModels'
import { rateLimit, rateLimit429 } from '../../../../lib/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Storyboard panels with OpenAI's image models, using the signed-in user's own OpenAI key.
 *
 *   GET  /api/storyboard/openai → { models, default }   which models this deployment offers
 *   POST /api/storyboard/openai { prompt, aspect_ratio?, model?, quality?, reference_urls?, image_url? }
 *        → { urls: [panel], model, revised_prompt? }
 *
 * One panel per request (the client runs the shots in turn), so a request stays within the function time
 * limit. Reference images (a sketch, character sheets, or the previous panel for an edit) switch the call
 * to images/edits. `image_url` is the panel being edited and always goes first.
 */
const MAX_REFERENCES = 4
const MAX_PROMPT = 8000
const QUALITIES = new Set(['low', 'medium', 'high'])
const RATIOS = new Set(['16:9', '9:16', '1:1', '4:3', '3:4'])

export async function GET() {
  const { userId } = await auth()
  if (!userId) return errorJson('UNAUTHENTICATED', 401)
  const models = storyboardOpenAiModels()
  return NextResponse.json({ models, default: defaultStoryboardOpenAiModel(models) })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return errorJson('UNAUTHENTICATED', 401)

  const entitlementCheck = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO)
  if (!entitlementCheck.allowed) {
    if (entitlementCheck.status === 401) return errorJson('UNAUTHENTICATED', 401)
    return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO)
  }

  const limit = rateLimit(`storyboard-openai:${userId}`, { windowMs: 10 * 60_000, max: 90 })
  if (!limit.allowed) return rateLimit429(limit.retryAfterMs)

  const key = await getOpenAiKeyForUser()
  if (!key) return errorJson('Add your OpenAI API key in Settings to generate storyboard panels.', 400)

  let body: Record<string, any>
  try {
    body = await req.json()
  } catch {
    return errorJson('Invalid JSON body', 400)
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim().slice(0, MAX_PROMPT) : ''
  if (!prompt) return errorJson('A prompt is required', 400)

  const models = storyboardOpenAiModels()
  const model = typeof body.model === 'string' && body.model ? body.model : defaultStoryboardOpenAiModel(models)
  if (!models.some((m) => m.id === model)) return errorJson('That model is not available for storyboards.', 400)

  const aspectRatio = typeof body.aspect_ratio === 'string' && RATIOS.has(body.aspect_ratio) ? body.aspect_ratio : '16:9'
  const quality = typeof body.quality === 'string' && QUALITIES.has(body.quality) ? body.quality : 'medium'

  const sources: string[] = []
  if (typeof body.image_url === 'string' && body.image_url) sources.push(body.image_url)
  if (Array.isArray(body.reference_urls)) {
    for (const ref of body.reference_urls) if (typeof ref === 'string' && ref) sources.push(ref)
  }
  const uniqueSources = Array.from(new Set(sources)).slice(0, MAX_REFERENCES)

  try {
    let result: { urls?: string[]; revised?: string; error?: NextResponse }
    if (uniqueSources.length > 0) {
      let images: ImagePart[]
      try {
        images = await Promise.all(uniqueSources.map((src, i) => loadImage(src, i)))
      } catch (err: any) {
        return errorJson(err?.message || 'Could not read a reference image', 400)
      }
      result = await edits(key, model, prompt, aspectRatio, 1, quality, images)
    } else {
      const res = await fetch(`${OPENAI_BASE}/images/generations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, n: 1, size: gptImageSize(aspectRatio), quality }),
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      })
      const payload = await readUpstream(res)
      result = res.ok ? toUrls(payload) : { error: upstreamError(res, payload) }
    }

    if (result.error) return result.error
    if (!result.urls || result.urls.length === 0) return errorJson('The image service returned no panel. Try again.', 502)
    return NextResponse.json({ urls: [result.urls[0]], model, revised_prompt: result.revised })
  } catch (err: any) {
    const timedOut = err?.name === 'TimeoutError' || err?.name === 'AbortError'
    return errorJson(timedOut ? 'Panel generation timed out. Try again.' : err?.message || 'Internal server error', timedOut ? 504 : 500)
  }
}
