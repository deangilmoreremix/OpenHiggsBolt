import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { brands, getBrandsForUser, type Brand } from '@/shared/brandStore'
import { ok, apiError } from '@/lib/apiError'
import { assertSafeUrlString as assertSafeUrl } from '@/lib/networkSafety'

const MAX_BYTES = 1_000_000
const FETCH_TIMEOUT_MS = 5000
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

function meta(name: string, html: string): string | undefined {
  const a = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']*)["']`, 'i'))
  const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${name}["']`, 'i'))
  return (a || b)?.[1]?.trim()
}

/**
 * H4: both handlers used to be fully unauthenticated while reading and
 * writing a module-level store shared by every user of the instance.
 */
async function requireUserId(): Promise<{ userId: string } | { response: NextResponse }> {
  const { userId } = await auth()
  if (!userId) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { userId }
}

export async function GET(req: NextRequest) {
  const session = await requireUserId()
  if ('response' in session) return session.response

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const rawPageSize = parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, rawPageSize))

  // H4: only the caller's own brands are listed.
  const all = getBrandsForUser(session.userId).map((b) => ({
    id: b.id,
    url: b.url,
    brand_name: b.brand_name || '',
    industry: b.industry || '',
    primary_colors: b.primary_colors || '',
  }))

  const total = all.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const items = all.slice(start, start + pageSize)

  return ok(items, { page: safePage, pageSize, total, totalPages })
}

export async function POST(req: NextRequest) {
  // H4: brand creation used to be anonymous and unscoped.
  const session = await requireUserId()
  if ('response' in session) return session.response

  let body: any = {}
  try {
    body = await req.json()
  } catch {}
  const url = body.url
  if (!url || typeof url !== 'string') {
    return apiError('bad_request', 'url is required', 400)
  }

  let brand_name: string | undefined
  let tagline: string | undefined
  try {
    const safe = await assertSafeUrl(url)
    const res = await fetch(safe.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (res.status >= 300 && res.status < 400) {
    } else if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length <= MAX_BYTES) {
        const html = buf.toString('utf8')
        const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim()
        brand_name = (meta('og:site_name', html) || title || url).slice(0, 120)
        tagline = (meta('description', html) || meta('og:description', html))?.slice(0, 240)
      }
    }
  } catch {
    brand_name = url
  }

  const id = `br_${Date.now()}`
  const brand: Brand = {
    id,
    url,
    // H4: the entry is owned by the authenticated caller.
    owner: session.userId,
    brand_name,
    tagline,
    created_at: new Date().toISOString(),
  }
  brands.set(id, brand)
  return NextResponse.json({ id, brand_name, url })
}
