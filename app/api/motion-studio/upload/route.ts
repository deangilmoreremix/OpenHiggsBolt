import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { sanitizeName } from '@/src/server/motionCapture'
import { rateLimit, rateLimit429 } from '../../../../lib/rateLimit'
import { requireMotionStudioUser } from '../lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** The app's media bucket: public, takes images, video and audio, up to MAX_UPLOAD_BYTES per file. */
const MEDIA_BUCKET = 'uploads'
/** The bucket's own per-file limit. */
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024
const KINDS = /^(image|video|audio)\//

/**
 * POST /api/motion-studio/upload  { name, type, size }
 *   → { uploadUrl, url }
 *
 * Where to store a file the person attached (music, video, images), so a saved film still has it after a
 * reload — a browser `blob:` address only lives as long as the tab. The browser PUTs the file to `uploadUrl`
 * (a one-time signed address straight into storage, so large videos never pass through this function,
 * whose request body is capped at a few MB) and keeps `url` in the project. Files go under the caller's own
 * `smartvideo/<user>/` prefix of the media bucket, like the asset library's.
 */
export async function POST(req: NextRequest) {
  const user = await requireMotionStudioUser(req)
  if (!user.ok) return user.response

  let name = ''
  let type = ''
  let size = 0
  try {
    const body = await req.json()
    name = typeof body?.name === 'string' ? body.name : ''
    type = typeof body?.type === 'string' ? body.type : ''
    size = typeof body?.size === 'number' ? body.size : 0
  } catch {
    // fall through to validation
  }
  if (!KINDS.test(type)) return NextResponse.json({ error: 'Only images, video and audio can be attached', code: 'BAD_TYPE' }, { status: 400 })
  if (!(size > 0) || size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: 'That file is too large to attach (100 MB at most)', code: 'TOO_LARGE' }, { status: 400 })

  const limit = rateLimit(`motion-studio-upload:${user.userId}`, { windowMs: 10 * 60_000, max: 60 })
  if (!limit.allowed) return rateLimit429(limit.retryAfterMs)

  const path = `smartvideo/${sanitizeName(user.userId)}/motion-media/${randomUUID()}-${sanitizeName(name || 'media')}`
  try {
    const { createServerClient } = await import('@/lib/supabase')
    const bucket = createServerClient().storage.from(MEDIA_BUCKET)
    const { data, error } = await bucket.createSignedUploadUrl(path)
    if (error || !data?.signedUrl) throw new Error(error?.message || 'no signed upload address')
    return NextResponse.json({ uploadUrl: data.signedUrl, url: bucket.getPublicUrl(path).data.publicUrl })
  } catch (err) {
    console.warn('[motion-studio/upload] failed', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Storage is not available', code: 'STORAGE_UNAVAILABLE' }, { status: 503 })
  }
}
