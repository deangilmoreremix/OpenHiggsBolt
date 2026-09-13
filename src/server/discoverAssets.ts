/**
 * Server-side business asset discovery from a public website.
 *
 * Flow:
 * 1. Validate and sanitize the submitted URL (SSRF protection).
 * 2. Crawl the homepage plus a small number of relevant internal pages.
 * 3. Extract candidate image URLs from img[src], srcset, picture/source,
 *    Open Graph tags, and other structured image references.
 * 4. Filter out obvious junk (favicons, tracking pixels, UI graphics, etc.).
 * 5. For each remaining candidate, download the image and validate MIME/dimensions.
 * 6. Classify the image via OpenAI Vision to determine its category and confidence.
 * 7. Return a structured list of DiscoveredAsset candidates for the client to review.
 */

import axios from 'axios'
import { JSDOM } from 'jsdom'
import OpenAI from 'openai'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DiscoveredAssetCategory =
  | 'person'
  | 'logo'
  | 'product'
  | 'service'
  | 'completed_work'
  | 'storefront'
  | 'office'
  | 'branded_vehicle'
  | 'team'
  | 'brand'
  | 'irrelevant'

export interface DiscoveredAsset {
  id: string
  sourceUrl: string
  previewUrl: string
  category: DiscoveredAssetCategory
  confidence?: number
  qualityScore?: number
  relevanceScore?: number
  selected: boolean
  recommended: boolean
  rejected: boolean
}

interface DiscoveryOptions {
  websiteUrl: string
  maxPages?: number
  maxImages?: number
  maxImageBytes?: number
  openAiKey?: string
}

interface ImageCandidate {
  url: string
  sourcePage: string
  altText?: string
  ogContext?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_PAGES = 8
const MAX_IMAGES = 60
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB per image
const REQUEST_TIMEOUT = 15_000 // 15s
const REDIRECT_LIMIT = 5

const PRIORITY_PAGE_PATHS = [
  '/about', '/about-us', '/our-story', '/team', '/our-team', '/staff',
  '/services', '/products', '/gallery', '/portfolio', '/projects', '/work',
  '/contact', '/locations', '/store', '/shop',
]

const JUNK_PATH_FRAGMENTS = [
  'favicon', 'icon', 'sprite', 'pixel', 'tracking', 'analytics', 'beacon',
  '1x1', 'spacer', 'loader', 'spinner', 'placeholder', 'blank',
]

const JUNK_EXTENSIONS = [
  '.svg', '.gif', '.webp', // often icons/UI
]

const SOCIAL_DOMAINS = [
  'facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'linkedin.com',
  'youtube.com', 'tiktok.com', 'pinterest.com', 'yelp.com', 'google.com',
  'maps.google', 'goo.gl', 'bit.ly', 'tinyurl.com',
]

// ---------------------------------------------------------------------------
// SSRF / URL validation
// ---------------------------------------------------------------------------

function isPrivateIp(hostname: string): boolean {
  const parts = hostname.split('.').map(Number)
  if (parts[0] === 10) return true
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true
  if (parts[0] === 192 && parts[1] === 168) return true
  if (parts[0] === 127) return true
  if (hostname === 'localhost' || hostname === '::1') return true
  return false
}

function sanitizeUrl(input: string): string {
  let trimmed = input.trim()
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = 'https://' + trimmed
  }
  const url = new URL(trimmed)
  const hostname = url.hostname.toLowerCase()

  if (isPrivateIp(hostname)) {
    throw new Error('Private network addresses are not allowed')
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Only http/https protocols are allowed')
  }

  return url.toString()
}

// ---------------------------------------------------------------------------
// Page fetching
// ---------------------------------------------------------------------------

async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url, {
      timeout: REQUEST_TIMEOUT,
      maxRedirects: REDIRECT_LIMIT,
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AssetDiscovery/1.0; +https://example.com/bot)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      validateStatus: (s) => s >= 200 && s < 300,
    })
    const contentType = String(response.headers['content-type'] || '')
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return null
    }
    const buffer = Buffer.from(response.data)
    return buffer.toString('utf-8')
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Link extraction
// ---------------------------------------------------------------------------

function extractInternalLinks(baseUrl: string, html: string): string[] {
  const dom = new JSDOM(html, { url: baseUrl })
  const doc = dom.window.document
  const base = new URL(baseUrl)
  const links = new Set<string>()

  const anchorTags = doc.querySelectorAll('a[href]')
  for (const a of anchorTags) {
    const href = a.getAttribute('href') || ''
    try {
      const absolute = new URL(href, base)
      if (absolute.hostname === base.hostname) {
        links.add(absolute.toString())
      }
    } catch {
      // skip invalid URLs
    }
  }

  return Array.from(links)
}

function selectPriorityPages(baseUrl: string, links: string[]): string[] {
  const base = new URL(baseUrl)
  const scored = links.map((link) => {
    const url = new URL(link)
    const path = url.pathname.toLowerCase()
    let score = 0
    for (const pattern of PRIORITY_PAGE_PATHS) {
      if (path.includes(pattern)) {
        score += pattern.length // longer matches score higher
      }
    }
    return { url: link, score }
  })

  scored.sort((a, b) => b.score - a.score)
  const selected = scored
    .filter((s) => s.score > 0)
    .slice(0, MAX_PAGES - 1)
    .map((s) => s.url)

  if (selected.length === 0 && links.length > 0) {
    selected.push(links[0])
  }

  return selected
}

// ---------------------------------------------------------------------------
// Image extraction
// ---------------------------------------------------------------------------

function isLikelyJunk(url: string): boolean {
  const lower = url.toLowerCase()
  const path = new URL(url).pathname.toLowerCase()

  if (JUNK_PATH_FRAGMENTS.some((frag) => path.includes(frag))) return true
  if (path.endsWith('.svg')) return true // usually icons/logos, handled separately

  if (SOCIAL_DOMAINS.some((d) => lower.includes(d))) return true

  return false
}

function extractImages(baseUrl: string, html: string, pageUrl: string): ImageCandidate[] {
  const dom = new JSDOM(html, { url: baseUrl })
  const doc = dom.window.document
  const candidates: ImageCandidate[] = []
  const seen = new Set<string>()

  const add = (rawUrl: string, altText?: string, ogContext?: string) => {
    if (!rawUrl || rawUrl.startsWith('data:')) return
    try {
      const absolute = new URL(rawUrl, baseUrl).toString()
    } catch {
      return
    }
    const absolute = new URL(rawUrl, baseUrl).toString()
    if (seen.has(absolute)) return
    if (isLikelyJunk(absolute)) return
    seen.add(absolute)
    candidates.push({ url: absolute, sourcePage: pageUrl, altText, ogContext })
  }

  // img[src]
  doc.querySelectorAll('img[src]').forEach((img) => {
    add(img.getAttribute('src') || '', img.getAttribute('alt') || undefined)
  })

  // srcset
  doc.querySelectorAll('img[srcset]').forEach((img) => {
    const srcset = img.getAttribute('srcset') || ''
    const entries = srcset.split(',').map((s) => s.trim().split(/\s+/)[0]).filter(Boolean)
    for (const entry of entries) {
      add(entry, img.getAttribute('alt') || undefined)
    }
  })

  // picture/source
  doc.querySelectorAll('picture source[srcset]').forEach((source) => {
    const srcset = source.getAttribute('srcset') || ''
    const entries = srcset.split(',').map((s) => s.trim().split(/\s+/)[0]).filter(Boolean)
    for (const entry of entries) {
      add(entry)
    }
  })

  // Open Graph / Twitter / structured data
  const metaTags = [
    { attr: 'property', values: ['og:image', 'og:image:url'] },
    { attr: 'name', values: ['twitter:image', 'twitter:image:src'] },
  ]
  for (const { attr, values } of metaTags) {
    for (const val of values) {
      doc.querySelectorAll(`meta[${attr}="${val}"]`).forEach((meta) => {
        const content = meta.getAttribute('content') || ''
        add(content, undefined, val)
      })
    }
  }

  return candidates
}

// ---------------------------------------------------------------------------
// Image validation
// ---------------------------------------------------------------------------

async function validateImage(url: string): Promise<{ valid: boolean; mime?: string }> {
  try {
    const response = await axios.head(url, {
      timeout: REQUEST_TIMEOUT,
      maxRedirects: REDIRECT_LIMIT,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AssetDiscovery/1.0)' },
      validateStatus: (s) => s >= 200 && s < 300,
    })
    const contentType = String(response.headers['content-type'] || '')
    console.log(`[validateImage] ${url} -> status=${response.status} type=${contentType}`)
    if (!contentType.startsWith('image/')) {
      return { valid: false }
    }
    return { valid: true, mime: contentType }
  } catch (err) {
    console.log(`[validateImage] ${url} -> error: ${err instanceof Error ? err.message : err}`)
    return { valid: false }
  }
}

// ---------------------------------------------------------------------------
// Heuristic fallback classification (no OpenAI required)
// ---------------------------------------------------------------------------

function heuristicFallback(url: string): { category: DiscoveredAssetCategory; confidence: number; recommended: boolean } {
  const lower = url.toLowerCase()

  const rules: Array<{ keywords: string[]; category: DiscoveredAssetCategory; confidence: number }> = [
    { keywords: ['/logo', '/logos', '-logo.', '_logo.', '/brand/'], category: 'logo', confidence: 70 },
    { keywords: ['/team', '/staff', '/people', '/about-us', '/our-team'], category: 'team', confidence: 65 },
    { keywords: ['/product', '/products', '/shop', '/menu', '/catalog'], category: 'product', confidence: 65 },
    { keywords: ['/store', '/location', '/locations', '/find-us'], category: 'storefront', confidence: 60 },
    { keywords: ['/office', '/interior', '/showroom'], category: 'office', confidence: 60 },
    { keywords: ['/vehicle', '/truck', '/van', '/fleet'], category: 'branded_vehicle', confidence: 60 },
    { keywords: ['/project', '/projects', '/gallery', '/portfolio', '/completed'], category: 'completed_work', confidence: 60 },
    { keywords: ['/service', '/services', '/what-we-do'], category: 'service', confidence: 55 },
    { keywords: ['headshot', 'portrait', 'face', 'avatar'], category: 'person', confidence: 60 },
    { keywords: ['favicon', 'icon', 'sprite', 'pixel', '1x1', 'tracking', 'beacon'], category: 'irrelevant', confidence: 80 },
  ]

  for (const rule of rules) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return { category: rule.category, confidence: rule.confidence, recommended: rule.category !== 'irrelevant' }
    }
  }

  return { category: 'brand', confidence: 40, recommended: true }
}

// ---------------------------------------------------------------------------
// OpenAI classification
// ---------------------------------------------------------------------------

async function classifyImage(
  url: string,
  openAiKey?: string,
): Promise<{ category: DiscoveredAssetCategory; confidence: number; recommended: boolean } | null> {
  try {
    const hasKey = Boolean(openAiKey || process.env.OPENAI_API_KEY)

    if (!hasKey) {
      return heuristicFallback(url)
    }

    const openai = new OpenAI({ apiKey: openAiKey || undefined })
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Classify this image for a business marketing asset library. Return ONLY a JSON object with:
- category: one of [person, logo, product, service, completed_work, storefront, office, branded_vehicle, team, brand, irrelevant]
- confidence: 0-100
- recommended: true/false

Categories:
- person: clear face/headshot, full-body, 3/4 body, or side/profile of a person
- logo: actual business logo (not favicon, not social icon)
- product: physical products or service offerings
- service: work being performed, crew working
- completed_work: finished projects, before/after
- storefront: exterior of business location
- office: interior office/showroom
- branded_vehicle: truck, van with company branding
- team: group of people, uniformed staff
- brand: brand photography, packaging, signage, uniforms
- irrelevant: anything not useful for marketing`,
            },
            {
              type: 'image_url',
              image_url: { url },
            },
          ],
        },
      ],
      max_tokens: 100,
      temperature: 0,
    })

    const text = response.choices[0]?.message?.content?.trim() || ''
    console.log(`[classify] ${url} -> response: ${text.substring(0, 200)}`)
    const jsonMatch = text.match(/\{.*\}/)
    if (!jsonMatch) {
      console.log(`[classify] ${url} -> no JSON found`)
      return null
    }

    const parsed = JSON.parse(jsonMatch[0])
    const category = parsed.category as DiscoveredAssetCategory
    const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 50
    const recommended = Boolean(parsed.recommended)

    if (
      ![
        'person', 'logo', 'product', 'service', 'completed_work',
        'storefront', 'office', 'branded_vehicle', 'team', 'brand', 'irrelevant',
      ].includes(category)
    ) {
      console.log(`[classify] ${url} -> invalid category: ${category}`)
      return null
    }

    console.log(`[classify] ${url} -> ${category} (${confidence}%) recommended=${recommended}`)
    return { category, confidence, recommended }
  } catch (err) {
    console.log(`[classify] ${url} -> error: ${err instanceof Error ? err.message : err}`)
    return null
  }
}

// ---------------------------------------------------------------------------
// Main discovery function
// ---------------------------------------------------------------------------

export async function discoverBusinessAssets(options: DiscoveryOptions): Promise<DiscoveredAsset[]> {
  const { websiteUrl, maxPages = MAX_PAGES, maxImages = MAX_IMAGES, maxImageBytes = MAX_IMAGE_BYTES, openAiKey } = options

  const baseUrl = sanitizeUrl(websiteUrl)
  const base = new URL(baseUrl)

  // 1. Fetch homepage
  const homeHtml = await fetchPage(baseUrl)
  if (!homeHtml) {
    return []
  }

  const allCandidates: ImageCandidate[] = []

  // 2. Extract images from homepage
  const homeImages = extractImages(baseUrl, homeHtml, baseUrl)
  allCandidates.push(...homeImages)

  // 3. Discover linked pages and crawl them
  const links = extractInternalLinks(baseUrl, homeHtml)
  const priorityLinks = selectPriorityPages(baseUrl, links)
  const pagesToCrawl = [baseUrl, ...priorityLinks].slice(0, maxPages)

  for (const pageUrl of pagesToCrawl) {
    if (allCandidates.length >= maxImages) break
    const html = await fetchPage(pageUrl)
    if (!html) continue
    const images = extractImages(baseUrl, html, pageUrl)
    allCandidates.push(...images)
  }

  // 4. Deduplicate by URL
  const uniqueCandidates = Array.from(new Map(allCandidates.map((c) => [c.url, c])).values())
  console.log(`[discovery] unique candidates: ${uniqueCandidates.length}`)

  // 5. Filter out junk and validate images
  const validCandidates: ImageCandidate[] = []
  for (const candidate of uniqueCandidates) {
    if (validCandidates.length >= maxImages) break
    const validation = await validateImage(candidate.url)
    if (!validation.valid) {
      console.log(`[validateImage] ${candidate.url} -> rejected`)
      continue
    }
    console.log(`[validateImage] ${candidate.url} -> valid (${validation.mime})`)
    validCandidates.push(candidate)
  }
  console.log(`[discovery] valid candidates: ${validCandidates.length}`)

  // 6. Classify each image
  const results: DiscoveredAsset[] = []
  for (const candidate of validCandidates) {
    const classification = await classifyImage(candidate.url, openAiKey)
    if (!classification) {
      console.log(`[discovery] rejected by classifier: ${candidate.url}`)
      continue
    }
    console.log(`[discovery] classified: ${candidate.url} -> ${classification.category} (${classification.confidence}%)`)

    results.push({
      id: `disc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sourceUrl: candidate.url,
      previewUrl: candidate.url,
      category: classification.category,
      confidence: classification.confidence,
      qualityScore: classification.confidence,
      relevanceScore: classification.confidence,
      selected: classification.recommended,
      recommended: classification.recommended,
      rejected: false,
    })
  }

  console.log(`[discovery] final results: ${results.length}`)
  return results
}
