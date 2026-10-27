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
 *   → { url, title, page, pages, crops, images, logo, cutouts, emptyPlate, content, brand, transient }
 *
 * Each page's `layout` (section headings, cards) is in page CSS px, 1920 wide,
 * like upstream's layout.json.
 *
 * Captures a public site for Motion Studio the way upstream ShotCraft does
 * (see `capturePageScreenshots`): the page asked for and up to two more routes
 * of the same site, each a 1920-wide page at 2x with its card cutouts and
 * layout; the nav bar, search pill and button cutouts; an empty plate; the
 * site's logo, its own images, brand colours and what it says about itself.
 * All behind the discovery SSRF guard. The images are stored under the
 * caller's storage prefix and returned as URLs. Images are never inlined into
 * the project: the project is saved in localStorage, which multi-megabyte data
 * URLs would overflow.
 */
const BUCKET = 'personalization-assets'

const sanitize = (value: string) => value.replace(/[^A-Za-z0-9._-]/g, '-').slice(0, 96) || 'x'

type StoredImage = { name: string; body: Buffer; contentType: string }

/** Uploads every image at once; returns its public URL by name. */
async function storeImages(userId: string, images: StoredImage[]): Promise<Map<string, string>> {
  const { createServerClient } = await import('@/lib/supabase')
  const storage = createServerClient().storage.from(BUCKET)
  const folder = `${sanitize(userId)}/motion-capture/${randomUUID()}`
  const stored = await Promise.all(
    images.map(async (image) => {
      const path = `${folder}/${image.name}`
      const { error } = await storage.upload(path, image.body, { contentType: image.contentType, upsert: false })
      if (error) throw new Error(`storage upload failed: ${error.message}`)
      const { data } = storage.getPublicUrl(path)
      if (!data?.publicUrl) throw new Error('storage returned no public URL')
      return [image.name, data.publicUrl] as const
    }),
  )
  return new Map(stored)
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

  // Every image, by name: pages, card crops, the site's own images, cutouts, the empty plate and the logo.
  const jpeg = 'image/jpeg'
  const png = 'image/png'
  const siteImages = capture.images ?? []
  const routes = capture.routes ?? []
  const images: StoredImage[] = [
    { name: 'page.jpg', body: capture.page, contentType: jpeg },
    ...routes.map((r) => ({ name: `page-${sanitize(r.name)}.jpg`, body: r.page, contentType: jpeg })),
    ...capture.crops.map((body, i) => ({ name: `crop-${i + 1}.jpg`, body, contentType: jpeg })),
    ...siteImages.map((body, i) => ({ name: `image-${i + 1}.jpg`, body, contentType: jpeg })),
    ...(capture.cutouts?.nav ? [{ name: 'nav.jpg', body: capture.cutouts.nav, contentType: jpeg }] : []),
    ...(capture.cutouts?.search ? [{ name: 'float-search.png', body: capture.cutouts.search, contentType: png }] : []),
    ...(capture.cutouts?.button ? [{ name: 'float-button.png', body: capture.cutouts.button, contentType: png }] : []),
    ...(capture.emptyPlate ? [{ name: 'page-empty.jpg', body: capture.emptyPlate, contentType: jpeg }] : []),
    ...(capture.logo ? [{ name: 'logo.png', body: capture.logo, contentType: png }] : []),
  ]
  let urls: Map<string, string>
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
    urls = new Map(images.map((image) => [image.name, `data:${image.contentType};base64,${image.body.toString('base64')}`]))
    transient = true
  }
  const at = (name: string) => urls.get(name) ?? null
  const width = CAPTURE_VIEWPORT.width * CAPTURE_DEVICE_SCALE
  let homePath = '/'
  try {
    homePath = new URL(capture.url).pathname || '/'
  } catch {
    // keep '/'
  }
  const pages = [
    { name: 'home', path: homePath, url: at('page.jpg')!, width, height: capture.pageHeight * CAPTURE_DEVICE_SCALE, layout: capture.layout ?? null },
    ...routes.map((r) => ({ name: r.name, path: r.path, url: at(`page-${sanitize(r.name)}.jpg`)!, width, height: r.pageHeight * CAPTURE_DEVICE_SCALE, layout: r.layout })),
  ]

  return NextResponse.json({
    url: capture.url,
    title: capture.title,
    page: { url: pages[0].url, width, height: pages[0].height },
    pages,
    crops: capture.crops.map((_, i) => at(`crop-${i + 1}.jpg`)!),
    images: siteImages.map((_, i) => at(`image-${i + 1}.jpg`)!),
    logo: at('logo.png'),
    cutouts: { nav: at('nav.jpg'), search: at('float-search.png'), button: at('float-button.png') },
    emptyPlate: at('page-empty.jpg'),
    content: capture.content ?? null,
    brand: capture.brand,
    transient,
  })
}
