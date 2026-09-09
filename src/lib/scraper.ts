import dns from 'node:dns/promises'

export type ScrapeResult = {
  html: string
  title: string
  description: string
  ogImage: string
  themeColor: string
  colors: string[]
  fonts: string[]
  bodyText: string
}

function normalizeHex(value: string): string | null {
  const hex = value.trim()
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return null
  return hex.toLowerCase()
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`

  const res = await fetch(normalizedUrl, {
    headers: { 'User-Agent': 'BrandStudioBot/1.0' },
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch ${normalizedUrl}: ${res.status}`)
  }

  const html = await res.text()
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || new URL(normalizedUrl).hostname
  const descriptionMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
  const description = descriptionMatch?.[1] || ''
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i)
  const ogImage = ogImageMatch?.[1] ? new URL(ogImageMatch[1], normalizedUrl).href : ''
  const themeColorMatch = html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']*)["']/i)
  const themeColor = themeColorMatch?.[1] || ''
  const colors = unique([...html.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => normalizeHex(m[0])).filter(Boolean) as string[])
  const fonts = unique([...html.matchAll(/font-family\s*:\s*([^;}]+)/gi)].flatMap((m) => m[1].split(',').map((f) => f.trim().replace(/^["']|["']$/g, ''))))
  const bodyText = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12000)

  return { html, title, description, ogImage, themeColor, colors, fonts, bodyText }
}
