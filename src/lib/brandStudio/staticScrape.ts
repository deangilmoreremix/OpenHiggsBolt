// Static (no-browser) scrape with cheerio: used when the page is a bot-block, thin, or a browser is unavailable.
import * as cheerio from 'cheerio'

export type SiteScrape = {
  url: string; title: string; description: string; bodyText: string
  ogImage: string | null; favicon: string | null; logoCandidates: string[]
  fonts: string[]; rawColors: string[]; images: string[]; videos: string[]
  screenshot: string | null; blocked: boolean
}

const BLOCK_TITLE = /robot check|are you a robot|not a robot|captcha|access denied|attention required|just a moment|verify you are human|403 forbidden|request blocked/i
const TRACKING = /(doubleclick|googletagmanager|google-analytics|facebook\.com\/tr|pixel|beacon|analytics|\/collect\?|1x1)/i
const BASE64_PLACEHOLDER = /^(?:R0lGOD|iVBOR|\/9j\/|UklGR|PHN2Z)[A-Za-z0-9+/=]{30,}$/

export const looksBlocked = (title: string, body: string) => BLOCK_TITLE.test(title) || (body.length < 400 && BLOCK_TITLE.test(body))
export const isThin = (s: { bodyText: string }) => s.bodyText.length < 500

const abs = (href: string | undefined, base: string): string | null => {
  if (!href) return null
  try { const u = new URL(href, base); return /^https?:$/.test(u.protocol) ? u.href : null } catch { return null }
}

export function parseBrandHtml(html: string, pageUrl: string): SiteScrape {
  const $ = cheerio.load(html)
  const title = ($('meta[property="og:title"]').attr('content') || $('title').first().text() || '').trim()
  const description = ($('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '').trim()
  const ogImage = abs($('meta[property="og:image"]').attr('content'), pageUrl)
  const favicon = abs($('link[rel~="icon"]').first().attr('href'), pageUrl) || abs('/favicon.ico', pageUrl)

  const logoCandidates: string[] = []
  $('img').each((_, el) => {
    const src = $(el).attr('src') || ''
    const sig = `${$(el).attr('class') || ''} ${$(el).attr('alt') || ''} ${$(el).attr('id') || ''} ${src}`
    if (/logo/i.test(sig) && !BASE64_PLACEHOLDER.test(src) && !TRACKING.test(src)) {
      const u = abs(src, pageUrl); if (u && !logoCandidates.includes(u)) logoCandidates.push(u)
    }
  })

  const images: string[] = []
  $('img[src]').each((_, el) => {
    const src = $(el).attr('src') || ''
    if (BASE64_PLACEHOLDER.test(src) || src.startsWith('data:') || TRACKING.test(src)) return
    const u = abs(src, pageUrl); if (u && !images.includes(u)) images.push(u)
  })
  if (ogImage && !images.includes(ogImage)) images.unshift(ogImage)

  const videos: string[] = []
  $('video[src], video source[src]').each((_, el) => { const u = abs($(el).attr('src'), pageUrl); if (u && !videos.includes(u)) videos.push(u) })

  const css = $('style').map((_, e) => $(e).text()).get().join('\n') + ' ' + ($('[style]').map((_, e) => $(e).attr('style')).get().join(';'))
  const rawColors = [...new Set((css.match(/#[0-9a-fA-F]{6}\b/g) || []).map((c) => c.toLowerCase()))]
  const theme = $('meta[name="theme-color"]').attr('content')
  if (theme && /^#[0-9a-fA-F]{6}$/.test(theme)) rawColors.unshift(theme.toLowerCase())
  const fonts = [...new Set([...css.matchAll(/font-family\s*:\s*([^;}]+)/gi)].flatMap((m) => m[1].split(',').map((f) => f.trim().replace(/^["']|["']$/g, ''))).filter((f) => f && !/^(inherit|initial|sans-serif|serif|monospace)$/i.test(f)))]

  $('script, style, noscript, svg').remove()
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 12000)

  return { url: pageUrl, title, description, bodyText, ogImage, favicon, logoCandidates, fonts, rawColors: [...new Set(rawColors)], images: images.slice(0, 40), videos, screenshot: null, blocked: looksBlocked(title, bodyText) }
}

export class UnsafeUrlError extends Error {}

/** Fetches a page with the repo's SSRF guard: every hop is validated and the connection pinned to the validated address. */
export async function safeFetchPage(rawUrl: string): Promise<{ html: string; finalUrl: string }> {
  const { checkDestination, createPinnedFetch } = await import('../networkSafety')
  let current = rawUrl
  for (let hop = 0; hop < 5; hop++) {
    const dest: any = await (checkDestination as any)(current, undefined)
    if (!dest.ok) throw new UnsafeUrlError(`URL not allowed (${dest.reason})`)
    const res: Response = await (createPinnedFetch as any)(dest)(current, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BrandStudioBot/1.0)', Accept: 'text/html,application/xhtml+xml' },
      signal: AbortSignal.timeout(12_000),
    })
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const loc = res.headers.get('location')
      if (!loc) throw new Error('Redirect without location')
      current = new URL(loc, current).href
      continue
    }
    if (!res.ok) throw new Error(`Failed to fetch ${current}: ${res.status}`)
    return { html: (await res.text()).slice(0, 5 * 1024 * 1024), finalUrl: current }
  }
  throw new Error('Too many redirects')
}

export async function scrapeBrandStatic(url: string, fetchPage: typeof safeFetchPage = safeFetchPage): Promise<SiteScrape> {
  const { html, finalUrl } = await fetchPage(url)
  const scrape = parseBrandHtml(html, finalUrl)
  if (scrape.blocked) return { ...scrape, title: '', description: '', bodyText: '', ogImage: null, images: [], videos: [], fonts: [], rawColors: [], logoCandidates: [], favicon: null }
  return scrape
}
