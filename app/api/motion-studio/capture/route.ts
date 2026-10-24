import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { BrowserSsrfError, capturePageScreenshots, CAPTURE_DEVICE_SCALE, CAPTURE_VIEWPORT } from '@/src/server/browserDiscovery'
import { rateLimit, rateLimit429 } from '../../../../lib/rateLimit'
import { requireMotionStudioUser } from '../lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * POST /api/motion-studio/capture  { url }
 *
 * Captures one public page for Motion Studio's screenshot-based shots (a
 * 1920-wide page at 2x plus card crops and the page's brand colours) behind the
 * discovery SSRF guard, stores the images under the caller's storage prefix and
 * returns their URLs. Images are never inlined into the project: the project is
 * saved in localStorage, which multi-megabyte data URLs would overflow.
 */
const BUCKET = 'personalization-assets'

const sanitize = (value: string) => value.replace(/[^A-Za-z0-9._-]/g, '-').slice(0, 96) || 'x'

async function storeImages(userId: string, images: Buffer[]): Promise<string[]> {
  const { createServerClient } = await import('@/lib/supabase')
  const storage = createServerClient().storage.from(BUCKET)
  const folder = `${sanitize(userId)}/motion-capture/${randomUUID()}`
  const urls: string[] = []
  for (const [i, image] of images.entries()) {
    const path = `${folder}/${i === 0 ? 'page' : `crop-${i}`}.jpg`
    const { error } = await storage.upload(path, image, { contentType: 'image/jpeg', upsert: false })
    if (error) throw new Error(`storage upload failed: ${error.message}`)
    const { data } = storage.getPublicUrl(path)
    if (!data?.publicUrl) throw new Error('storage returned no public URL')
    urls.push(data.publicUrl)
  }
  return urls
}

export async function POST(req: NextRequest) {
  const user = await requireMotionStudioUser(req)
  if (!user.ok) return user.response

  let url = ''
  try {
    const body = await req.json()
    url = typeof body?.url === 'string' ? body.url.trim() : ''
  } catch {
    // fall through to validation
  }
  if (!url) return NextResponse.json({ error: 'A page URL is required', code: 'BAD_REQUEST' }, { status: 400 })
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`

  const limit = rateLimit(`motion-studio-capture:${user.userId}`, { windowMs: 10 * 60_000, max: 10 })
  if (!limit.allowed) return rateLimit429(limit.retryAfterMs)

  let capture
  try {
    capture = await capturePageScreenshots(url)
  } catch (err) {
    if (err instanceof BrowserSsrfError) {
      return NextResponse.json({ error: 'That address cannot be captured. Use a public http(s) page.', code: 'URL_REJECTED' }, { status: 400 })
    }
    console.warn('[motion-studio/capture] capture failed', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'The page could not be captured', code: 'CAPTURE_FAILED' }, { status: 502 })
  }

  const images = [capture.page, ...capture.crops]
  let urls: string[]
  let transient = false
  try {
    urls = await storeImages(user.userId, images)
  } catch (err) {
    // Local development without storage: hand the images back inline so the
    // flow can be exercised. Production never falls back to inline images.
    if (process.env.NODE_ENV === 'production') {
      console.warn('[motion-studio/capture] storage failed', err instanceof Error ? err.message : String(err))
      return NextResponse.json({ error: 'The capture could not be saved', code: 'STORAGE_FAILED' }, { status: 502 })
    }
    urls = images.map((image) => `data:image/jpeg;base64,${image.toString('base64')}`)
    transient = true
  }

  return NextResponse.json({
    url: capture.url,
    title: capture.title,
    page: { url: urls[0], width: CAPTURE_VIEWPORT.width * CAPTURE_DEVICE_SCALE, height: capture.pageHeight * CAPTURE_DEVICE_SCALE },
    crops: urls.slice(1),
    brand: capture.brand,
    transient,
  })
}
