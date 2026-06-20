import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`

    const res = await fetch(normalizedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BrandStudioBot/1.0)' },
      signal: AbortSignal.timeout(15000),
    })
    const html = await res.text()

    // Extract meta tags
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || ''
    const desc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] || ''
    const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] || ''
    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] || ''
    const favicon = html.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i)?.[1] || ''

    // Extract colors from inline styles and CSS
    const colorMatches = [...html.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)]
    const colors = [...new Set(colorMatches.map(m => '#' + m[1]))].slice(0, 20)

    // Extract fonts
    const fontMatches = [...html.matchAll(/font-family:\s*['"]?([^'",;]+)/gi)]
    const fonts = [...new Set(fontMatches.map(m => m[1].trim()))].slice(0, 5)

    // Extract logo candidates
    const logoMatches = [...html.matchAll(/<img[^>]+src=["']([^"']*logo[^"']*|[^"']*brand[^"']*|[^"']*icon[^"']*)["']/gi)]
    const logos = logoMatches.map(m => {
      const src = m[1]
      if (src.startsWith('http')) return src
      if (src.startsWith('//')) return 'https:' + src
      if (src.startsWith('/')) return new URL(normalizedUrl).origin + src
      return src
    }).slice(0, 3)

    // Extract body text for brand analysis
    const bodyText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000)

    return NextResponse.json({
      url: normalizedUrl,
      title: ogTitle || title,
      description: desc,
      ogImage,
      favicon,
      colors,
      fonts,
      logos,
      bodyText,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
