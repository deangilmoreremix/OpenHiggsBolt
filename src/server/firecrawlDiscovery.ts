/**
 * Firecrawl-backed business asset discovery provider.
 *
 * Uses the Firecrawl REST API with server-side FIRECRAWL_API_KEY.
 * Images are returned as normalized ImageCandidate references;
 * download/upload/classification remain in the existing pipeline.
 */

import type { ImageCandidate, DiscoveryResult } from './discoveryProvider'
import { JSDOM } from 'jsdom'

const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v2'
const FIRECRAWL_CRAWL_LIMIT = 8
const FIRECRAWL_CRAWL_MAX_DEPTH = 2

export class FirecrawlDiscoveryProvider {
  readonly name = 'FIRECRAWL'
  private apiKey: string

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Firecrawl API key is required')
    }
    this.apiKey = apiKey
  }

  async discover(options: {
    websiteUrl: string
    maxPages: number
    maxImages: number
  }): Promise<DiscoveryResult> {
    const { websiteUrl, maxPages, maxImages } = options
    const baseUrl = new URL(websiteUrl)

    const crawlResponse = await this.requestWithRetry('/crawl', {
      url: baseUrl.toString(),
      limit: Math.min(maxPages, FIRECRAWL_CRAWL_LIMIT),
      scrapeOptions: {
        formats: ['markdown', 'html'],
        onlyMainContent: false,
      },
    })

    const pages = Array.isArray(crawlResponse?.data) ? crawlResponse.data : []
    const candidates: ImageCandidate[] = []
    const seen = new Set<string>()

    for (const page of pages) {
      if (candidates.length >= maxImages) break
      const html = extractHtmlFromFirecrawlPage(page)
      if (!html) continue

      const pageUrl = typeof page.url === 'string' ? page.url : baseUrl.toString()
      const pageCandidates = extractImageCandidatesFromHtml(html, pageUrl, maxImages - candidates.length)
      for (const candidate of pageCandidates) {
        if (seen.has(candidate.url)) continue
        seen.add(candidate.url)
        candidates.push(candidate)
      }
    }

    return {
      candidates,
      provider: this.name,
      pagesCrawled: pages.length,
      rawCandidates: candidates.length,
    }
  }

  private async requestWithRetry(path: string, body: Record<string, unknown>, attempts = 2): Promise<unknown> {
    const url = `${FIRECRAWL_BASE_URL}${path}`
    const lastError = new Error('Firecrawl request failed')

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(body),
        })

        if (!response.ok) {
          const text = await response.text().catch(() => '')
          lastError.message = `Firecrawl error ${response.status}: ${text || response.statusText}`
          continue
        }

        return await response.json()
      } catch (err) {
        lastError.message = err instanceof Error ? err.message : 'Firecrawl request failed'
      }
    }

    throw lastError
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractHtmlFromFirecrawlPage(page: any): string | null {
  const html = typeof page?.html === 'string' ? page.html : null
  const markdown = typeof page?.markdown === 'string' ? page.markdown : null
  const content = typeof page?.content === 'string' ? page.content : null
  return html || markdown || content || null
}

function extractImageCandidatesFromHtml(html: string, pageUrl: string, maxImages: number): ImageCandidate[] {
  const dom = new JSDOM(html, { url: pageUrl })
  const doc = dom.window.document
  const candidates: ImageCandidate[] = []
  const seen = new Set<string>()

  const add = (rawUrl: string) => {
    if (!rawUrl || rawUrl.startsWith('data:')) return
    let absolute: string
    try {
      absolute = new URL(rawUrl, pageUrl).toString()
    } catch {
      return
    }
    if (seen.has(absolute)) return
    if (isLikelyJunk(absolute)) return
    seen.add(absolute)
    candidates.push({ url: absolute, sourcePage: pageUrl })
    if (candidates.length >= maxImages) throw new Error('MAX_IMAGES_REACHED')
  }

  try {
    for (const img of doc.querySelectorAll('img')) {
      const src = (img as HTMLImageElement).getAttribute('src') || ''
      const srcset = (img as HTMLImageElement).getAttribute('srcset') || ''
      if (src) add(src)
      if (srcset) {
        for (const entry of srcset.split(',').map((s: string) => s.trim().split(/\s+/)[0]).filter(Boolean)) {
          add(entry)
        }
      }
    }

    for (const source of doc.querySelectorAll('source[srcset]')) {
      const srcset = (source as HTMLSourceElement).getAttribute('srcset') || ''
      for (const entry of srcset.split(',').map((s: string) => s.trim().split(/\s+/)[0]).filter(Boolean)) {
        add(entry)
      }
    }

    const ogImage = doc.querySelector('meta[property="og:image"]')
    if (ogImage) add((ogImage as HTMLMetaElement).getAttribute('content') || '')
    const twitterImage = doc.querySelector('meta[name="twitter:image"]')
    if (twitterImage) add((twitterImage as HTMLMetaElement).getAttribute('content') || '')
  } catch {
    // ignore extraction errors
  }

  return candidates
}

function isLikelyJunk(url: string): boolean {
  const lower = url.toLowerCase()
  const path = new URL(url).pathname.toLowerCase()

  const junkFragments = [
    'favicon', 'icon', 'sprite', 'pixel', 'tracking', 'analytics', 'beacon',
    '1x1', 'spacer', 'loader', 'spinner', 'placeholder', 'blank',
  ]
  if (junkFragments.some((frag) => path.includes(frag))) return true

  const socialDomains = [
    'facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'linkedin.com',
    'youtube.com', 'tiktok.com', 'pinterest.com', 'yelp.com', 'google.com',
    'maps.google', 'goo.gl', 'bit.ly', 'tinyurl.com',
  ]
  if (socialDomains.some((d) => lower.includes(d))) return true

  return false
}
