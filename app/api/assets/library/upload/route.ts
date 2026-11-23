import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { auth } from '@clerk/nextjs/server'
import { sanitizeName } from '@/src/server/motionCapture'
import { rateLimit, rateLimit429 } from '../../../../../lib/rateLimit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Same public media bucket and per-file limit as Motion Director's attachments. */
const MEDIA_BUCKET = 'uploads'
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024
const KINDS = /^(image|video|audio)\//

/**
 * POST /api/assets/library/upload  { name, type, size } → { uploadUrl, url, storagePath }
 * A one-time signed upload address for keeping a copy of an uploaded file in the user's library, so it
 * outlives the one-hour upload address MuAPI returns. The file goes under smartvideo/<user>/library/.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })

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
  if (!KINDS.test(type)) return NextResponse.json({ error: 'Only images, video and audio can be saved', code: 'BAD_TYPE' }, { status: 400 })
  if (!(size > 0) || size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: 'That file is too large to save (100 MB at most)', code: 'TOO_LARGE' }, { status: 400 })

  const limit = rateLimit(`assets-library-upload:${userId}`, { windowMs: 10 * 60_000, max: 120 })
  if (!limit.allowed) return rateLimit429(limit.retryAfterMs)

  const storagePath = `smartvideo/${sanitizeName(userId)}/library/${randomUUID()}-${sanitizeName(name || 'asset')}`
  try {
    const { createServerClient } = await import('@/lib/supabase')
    const bucket = createServerClient().storage.from(MEDIA_BUCKET)
    const { data, error } = await bucket.createSignedUploadUrl(storagePath)
    if (error || !data?.signedUrl) throw new Error(error?.message || 'no signed upload address')
    return NextResponse.json({ uploadUrl: data.signedUrl, url: bucket.getPublicUrl(storagePath).data.publicUrl, storagePath })
  } catch (err) {
    console.warn('[assets/library/upload] failed', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Storage is not available', code: 'STORAGE_UNAVAILABLE' }, { status: 503 })
  }
}
