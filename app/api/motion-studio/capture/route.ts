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
 *   → { url, title, page, crops, images, logo, brand, transient }
 *
 * Captures one public page for Motion Studio's screenshot-based shots (a
 * 1920-wide page at 2x plus card crops and the page's brand colours) behind the
 * discovery SSRF guard, plus the site's own assets (its logo and its largest
 * images, taken from the rendered page), stores the images under the caller's storage prefix and
 * returns their URLs. Images are never inlined into the project: the project is
 * saved in localStorage, which multi-megabyte data URLs would overflow.
 */
const BUCKET = 'personalization-assets'

const sanitize = (value: string) => value.replace(/[^A-Za-z0-9._-]/g, '-').slice(0, 96) || 'x'

type StoredImage = { name: string; body: Buffer; contentType: string }

async function storeImages(userId: string, images: StoredImage[]): Promise<string[]> {
  const { createServerClient } = await import('@/lib/supabase')
  const storage = createServerClient().storage.from(BUCKET)
  const folder = `${sanitize(userId)}/motion-capture/${randomUUID()}`
  const urls: string[] = []
  for (const image of images) {
    const path = `${folder}/${image.name}`
    const { error } = await storage.upload(path, image.body, { contentType: image.contentType, upsert: false })
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

  // Page, card crops, the site's own images, then its logo — one upload batch, split back below.
  const jpeg = 'image/jpeg'
  const siteImages = capture.images ?? []
  const images: StoredImage[] = [
    { name: 'page.jpg', body: capture.page, contentType: jpeg },
    ...capture.crops.map((body, i) => ({ name: `crop-${i + 1}.jpg`, body, contentType: jpeg })),
    ...siteImages.map((body, i) => ({ name: `image-${i + 1}.jpg`, body, contentType: jpeg })),
    ...(capture.logo ? [{ name: 'logo.png', body: capture.logo, contentType: 'image/png' }] : []),
  ]
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
    urls = images.map((image) => `data:${image.contentType};base64,${image.body.toString('base64')}`)
    transient = true
  }

  return NextResponse.json({
    url: capture.url,
    title: capture.title,
    page: { url: urls[0], width: CAPTURE_VIEWPORT.width * CAPTURE_DEVICE_SCALE, height: capture.pageHeight * CAPTURE_DEVICE_SCALE },
    crops: urls.slice(1, 1 + capture.crops.length),
    images: urls.slice(1 + capture.crops.length, 1 + capture.crops.length + siteImages.length),
    logo: capture.logo ? urls[urls.length - 1] : null,
    brand: capture.brand,
    transient,
  })
}
