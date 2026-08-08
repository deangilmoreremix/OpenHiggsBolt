import { NextRequest, NextResponse } from 'next/server'
import dns from 'node:dns/promises'
import { brands, type Brand } from '@/shared/brandStore'
import { ok, apiError } from '@/lib/apiError'

const MAX_BYTES = 1_000_000
const FETCH_TIMEOUT_MS = 5000
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

function isPrivateIp(ip: string): boolean {
  if (ip.includes(':')) {
    if (ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80')) return true
    return false
  }
  const p = ip.split('.').map(Number)
  if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true
  if (p[0] === 10) return true
  if (p[0] === 127) return true
  if (p[0] === 169 && p[1] === 254) return true
  if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true
  if (p[0] === 192 && p[1] === 168) return true
  return false
}

async function assertSafeUrl(raw: string): Promise<URL> {
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    throw new Error('Invalid URL')
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('Only http(s) URLs are allowed')
  }
  let addrs: { address: string }[]
  try {
    addrs = await dns.lookup(u.hostname, { all: true })
  } catch {
    throw new Error('DNS resolution failed')
  }
  if (addrs.length === 0) throw new Error('DNS resolution failed')
  for (const a of addrs) {
    if (isPrivateIp(a.address)) throw new Error('Blocked address (private/loopback/link-local)')
  }
  return u
}

function meta(name: string, html: string): string | undefined {
  const a = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']*)["']`, 'i'))
  const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${name}["']`, 'i'))
  return (a || b)?.[1]?.trim()
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const rawPageSize = parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, rawPageSize))

  const all = [...brands.values()].map((b) => ({
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
    brand_name,
    tagline,
    created_at: new Date().toISOString(),
  }
  brands.set(id, brand)
  return NextResponse.json({ id, brand_name, url })
}
