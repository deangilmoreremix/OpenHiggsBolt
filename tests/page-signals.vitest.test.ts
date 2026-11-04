import { describe, expect, it, vi } from 'vitest'

// demoDiscovery imports the Supabase client, which throws at load without
// env vars; these tests never touch the cache.
vi.mock('@/lib/supabase', () => ({
  createServerClient: () => {
    throw new Error('not used in these tests')
  },
}))
import * as cheerio from 'cheerio'
import {
  elementStructureKey,
  extractBrandColors,
  extractEmbeddedImageUrls,
  extractImageContext,
  extractStylesheetUrls,
  htmlToMarkdown,
  looksJsRendered,
  propagateSimilarCategories,
  type SimilarityItem,
} from '../src/server/pageSignals'

const BASE = 'https://acme-plumbing.example/'

describe('extractEmbeddedImageUrls', () => {
  it('reads images from Next.js page data with key-path context', () => {
    const html = `<html><body><div id="__next"></div>
      <script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
        props: {
          pageProps: {
            teamMembers: [
              { name: 'Jane Doe', photo: { url: 'https://cdn.example.com/a1b2c3.jpg' } },
              { name: 'Joe Roe', photo: { url: '/uploads/d4e5f6.png' } },
            ],
            title: 'not an image',
          },
        },
      })}</script></body></html>`
    const images = extractEmbeddedImageUrls(html, BASE)
    expect(images.map((i) => i.url)).toEqual([
      'https://cdn.example.com/a1b2c3.jpg',
      'https://acme-plumbing.example/uploads/d4e5f6.png',
    ])
    expect(images[0].context).toMatch(/teamMembers/)
    expect(images[0].context).toMatch(/photo/)
    expect(images[0].context).toMatch(/Jane Doe/)
  })

  it('reads escaped URLs from inline state scripts and extension-less CDN URLs', () => {
    const html = `<script>window.__INITIAL_STATE__ = {"hero":"https:\\/\\/images.squarespace-cdn.com\\/content\\/v1\\/abc\\/hero","x":"https:\\u002F\\u002Fcdn.example.com\\u002Fvan.webp"};</script>`
    const urls = extractEmbeddedImageUrls(html, BASE).map((i) => i.url)
    expect(urls).toContain('https://images.squarespace-cdn.com/content/v1/abc/hero')
    expect(urls).toContain('https://cdn.example.com/van.webp')
  })

  it('ignores JSON-LD, external scripts, non-images and bare relative words', () => {
    const html = `
      <script type="application/ld+json">{"image":"https://cdn.example.com/ld.jpg"}</script>
      <script src="https://cdn.example.com/app.js"></script>
      <script type="application/json">{"a":"hero.jpg","b":"https://cdn.example.com/page.html","c":"https://cdn.example.com/ok.jpg"}</script>`
    expect(extractEmbeddedImageUrls(html, BASE).map((i) => i.url)).toEqual(['https://cdn.example.com/ok.jpg'])
  })

  it('caps the number of results and de-duplicates', () => {
    const urls = Array.from({ length: 100 }, (_, i) => `https://cdn.example.com/p${i}.jpg`)
    const html = `<script type="application/json">${JSON.stringify({ urls, again: urls })}</script>`
    const images = extractEmbeddedImageUrls(html, BASE, 10)
    expect(images).toHaveLength(10)
    expect(new Set(images.map((i) => i.url)).size).toBe(10)
  })

  it('never returns data: or non-http URLs', () => {
    const html = `<script type="application/json">{"a":"data:image/png;base64,xx","b":"javascript://x.jpg","c":"ftp://h/x.jpg"}</script>`
    expect(extractEmbeddedImageUrls(html, BASE)).toEqual([])
  })
})

describe('extractImageContext', () => {
  it('collects caption, heading and section names around an image', () => {
    const $ = cheerio.load(`<section id="our-team" class="team-grid">
      <h2>Meet the crew</h2>
      <div class="card"><figure><img id="t" src="/x/9f8e7d.jpg"><figcaption>Owner Mike</figcaption></figure></div>
    </section>`)
    const context = extractImageContext($, $('#t').get(0))
    expect(context).toContain('Owner Mike')
    expect(context).toContain('Meet the crew')
    expect(context).toContain('our-team')
    expect(context).toContain('team-grid')
  })
})

describe('find similar elements', () => {
  it('gives repeated items the same structure key and different lists different keys', () => {
    const $ = cheerio.load(`
      <ul class="products"><li class="product-card is-active"><img id="a"></li><li class="product-card"><img id="b"></li></ul>
      <div class="hero"><img id="c"></div>`)
    const key = (id: string) => elementStructureKey($, $(`#${id}`).get(0))
    expect(key('a')).toBe(key('b'))
    expect(key('a')).not.toBe(key('c'))
  })

  it('lets unsure members adopt the category their confident siblings agree on', () => {
    const items: SimilarityItem[] = [
      { similarGroup: 'g', category: 'product', confidence: 75, recommended: true },
      { similarGroup: 'g', category: 'brand', confidence: 40, recommended: true },
      { similarGroup: 'g', category: 'brand', confidence: 45, recommended: true },
      { similarGroup: 'g', category: 'logo', confidence: 40, recommended: true },
      { similarGroup: 'h', category: 'brand', confidence: 40, recommended: true },
    ]
    propagateSimilarCategories(items)
    expect(items.map((i) => i.category)).toEqual(['product', 'product', 'product', 'logo', 'brand'])
    expect(items[1].confidence).toBeGreaterThan(45)
  })

  it('does nothing on a split vote or a confident brand verdict', () => {
    const items: SimilarityItem[] = [
      { similarGroup: 'g', category: 'product', confidence: 75, recommended: true },
      { similarGroup: 'g', category: 'team', confidence: 75, recommended: true },
      { similarGroup: 'g', category: 'brand', confidence: 40, recommended: true },
      { similarGroup: 'k', category: 'service', confidence: 75, recommended: true },
      { similarGroup: 'k', category: 'brand', confidence: 80, recommended: true },
    ]
    propagateSimilarCategories(items)
    expect(items[2].category).toBe('brand')
    expect(items[4].category).toBe('brand')
  })
})

describe('extractBrandColors', () => {
  it('prefers theme-color and brand CSS variables, ignores neutrals and framework defaults', () => {
    const html = `<html><head>
      <meta name="theme-color" content="#E63946">
      <style>
        :root { --brand-primary: #e63946; --accent-color: #1d3557; --text: #222222; }
        body { color: #333; background: #ffffff; }
        .btn { background-color: #0d6efd; }
        a { color: #1d3557; }
      </style></head><body><div style="color: rgb(29, 53, 87)">x</div></body></html>`
    const colors = extractBrandColors(html)
    expect(colors.primary).toBe('#e63946')
    expect(colors.accent).toBe('#1d3557')
    expect(colors.palette).not.toContain('#ffffff')
    expect(colors.palette).not.toContain('#333333')
    expect(colors.palette[0]).toBe('#e63946')
    expect(colors.sources[0]).toBe('theme-color')
  })

  it('uses fetched stylesheet text and merges near-identical shades', () => {
    const css = '.btn{background:#2a9d8f}.btn:hover{background:#2b9e90}.link{color:#2a9d8f}.x{color:#2a9d8f}'
    const colors = extractBrandColors('<html></html>', [css])
    expect(colors.primary).toBe('#2a9d8f')
    expect(colors.palette.filter((c) => c.startsWith('#2'))).toHaveLength(1)
  })

  it('returns an empty palette for a page without brand colours', () => {
    expect(extractBrandColors('<p style="color:#000">hi</p>')).toEqual({ palette: [], sources: [] })
  })
})

describe('extractStylesheetUrls', () => {
  it('returns same-origin, non-vendor stylesheets only', () => {
    const html = `
      <link rel="stylesheet" href="/css/bootstrap.min.css">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">
      <link rel="stylesheet" href="/css/site.css">
      <link rel="preload stylesheet" href="/css/theme.css">
      <link rel="stylesheet" href="/css/extra.css">`
    expect(extractStylesheetUrls(html, BASE)).toEqual([
      'https://acme-plumbing.example/css/site.css',
      'https://acme-plumbing.example/css/theme.css',
    ])
  })
})

describe('looksJsRendered', () => {
  it('flags an empty SPA shell', () => {
    const signal = looksJsRendered('<html><body><div id="root"></div><script src="/app.js"></script></body></html>')
    expect(signal.jsRendered).toBe(true)
    expect(signal.frameworks).toContain('spa-root')
  })

  it('flags a thin site-builder page', () => {
    const html = `<html><body><script src="https://static.parastorage.com/x.js"></script><p>${'word '.repeat(200)}</p><img src="/a.jpg"></body></html>`
    expect(looksJsRendered(html)).toMatchObject({ jsRendered: true, frameworks: ['wix'] })
  })

  it('does not flag a normal content page', () => {
    const html = `<html><body><p>${'Plumbing services in town. '.repeat(40)}</p>${'<img src="/a.jpg">'.repeat(5)}</body></html>`
    expect(looksJsRendered(html).jsRendered).toBe(false)
  })
})

describe('htmlToMarkdown', () => {
  it('keeps headings, paragraphs, lists and external links, drops chrome', () => {
    const html = `<html><body>
      <header><nav><a href="/">Home</a><a href="/about">About</a></nav></header>
      <div class="cookie-banner">We use cookies</div>
      <main>
        <h1>Acme Plumbing</h1>
        <p>Family-owned since <strong>1987</strong>. Call us any time.</p>
        <h2>Services</h2>
        <ul><li>Drain cleaning</li><li>Water heaters</li></ul>
        <p>Read our <a href="https://reviews.example.com/acme">reviews</a>.</p>
        <script>var x = 1</script>
      </main>
      <footer>© Acme</footer></body></html>`
    const md = htmlToMarkdown(html)
    expect(md).toContain('# Acme Plumbing')
    expect(md).toContain('**1987**')
    expect(md).toContain('## Services')
    expect(md).toContain('- Drain cleaning\n- Water heaters')
    expect(md).toContain('[reviews](https://reviews.example.com/acme)')
    expect(md).not.toMatch(/cookies|About|© Acme|var x/)
  })

  it('caps the output length', () => {
    const html = `<body>${'<p>Long paragraph of business text that repeats. </p>'.repeat(1)}${Array.from({ length: 500 }, (_, i) => `<p>Paragraph number ${i} with some text.</p>`).join('')}</body>`
    expect(htmlToMarkdown(html, 500).length).toBeLessThanOrEqual(500)
  })
})

describe('researched brand colours in the modal', async () => {
  const { researchBrandColors, applyResearchedBrandColors } = await import(
    '../src/shared/personalization/researchHelpers'
  )
  const { DEFAULT_PREVIEW_BRAND_COLORS } = await import('../src/shared/personalization/preview/types')
  const { sanitizeDemoDiscoveryPayload } = await import('../src/server/demoDiscovery')

  it('accepts only #rrggbb colours', () => {
    expect(researchBrandColors({ primary: '#E63946', accent: 'red' })).toEqual({ primary: '#e63946' })
    expect(researchBrandColors({ primary: 'url(javascript:1)' })).toBeNull()
    expect(researchBrandColors(null)).toBeNull()
  })

  it('themes the default preview colours but never overwrites the visitor\'s choice', () => {
    const themed = applyResearchedBrandColors({ ...DEFAULT_PREVIEW_BRAND_COLORS }, { primary: '#e63946', accent: '#1d3557' })
    expect(themed.colors).toMatchObject({ primary: '#e63946', accent: '#1d3557', text: DEFAULT_PREVIEW_BRAND_COLORS.text })
    expect(themed.autoApplied).toEqual({ primary: '#e63946', accent: '#1d3557' })
    const picked = { ...DEFAULT_PREVIEW_BRAND_COLORS, primary: '#123456' }
    expect(applyResearchedBrandColors(picked, { primary: '#e63946' }).colors).toBe(picked)
  })

  it('replaces business A\'s auto-applied palette with business B\'s, but keeps a visitor edit', () => {
    const a = applyResearchedBrandColors({ ...DEFAULT_PREVIEW_BRAND_COLORS }, { primary: '#e63946', accent: '#1d3557' })
    const b = applyResearchedBrandColors(a.colors, { primary: '#2a9d8f' }, a.autoApplied)
    expect(b.colors).toMatchObject({ primary: '#2a9d8f', accent: DEFAULT_PREVIEW_BRAND_COLORS.accent })
    // B has no palette: A's auto-applied colours go back to the defaults.
    const none = applyResearchedBrandColors(a.colors, null, a.autoApplied)
    expect(none.colors).toMatchObject({ primary: DEFAULT_PREVIEW_BRAND_COLORS.primary, accent: DEFAULT_PREVIEW_BRAND_COLORS.accent })
    expect(none.autoApplied).toBeNull()
    // The visitor edited A's palette: B's research never overwrites it.
    const edited = { ...a.colors, accent: '#000080' }
    expect(applyResearchedBrandColors(edited, { primary: '#2a9d8f' }, a.autoApplied).colors).toBe(edited)
    expect(applyResearchedBrandColors(edited, null, a.autoApplied).colors).toBe(edited)
  })

  it('the demo cache keeps valid brand colours and drops malformed ones', () => {
    const base = { url: 'https://example.com/', title: null, description: null, logo: null, assets: [] }
    expect(sanitizeDemoDiscoveryPayload({ ...base, brandColors: { primary: '#E63946', accent: 'nope' } })?.brandColors)
      .toEqual({ primary: '#e63946' })
    expect(sanitizeDemoDiscoveryPayload({ ...base, brandColors: { primary: 'x' } })).not.toHaveProperty('brandColors')
  })
})

describe('context-based classification', async () => {
  const { classifyAssetCandidate } = await import('../src/server/discoveryAssetFilter')

  it('classifies a CDN-hashed image from its surroundings', () => {
    const url = 'https://cdn.example.com/f/8a7b6c5d4e3f.jpg'
    expect(classifyAssetCandidate({ url }).category).toBe('brand')
    const team = classifyAssetCandidate({ url, contextText: 'our-team team-grid Meet the crew' })
    expect(team.category).toBe('team')
    expect(team.confidence).toBeGreaterThanOrEqual(50)
    expect(classifyAssetCandidate({ url, contextText: 'product-card Shop' }).category).toBe('product')
  })

  it('never lets context override the file name, alt text, junk rules or site logo', () => {
    expect(classifyAssetCandidate({ url: 'https://x.example/img/logo.png', contextText: 'our-team' }).category).toBe('logo')
    expect(classifyAssetCandidate({ url: 'https://x.example/a1.png', altText: 'spacer', contextText: 'our-team' }).category)
      .toBe('irrelevant')
    expect(classifyAssetCandidate({ url: 'https://x.example/a1.png', isSiteLogo: true, contextText: 'our-team' }).category)
      .toBe('logo')
  })
})

describe('find-similar in the shared asset builder', async () => {
  const { buildDiscoveredAssetsFromCandidates } = await import('../src/server/fastDiscovery')

  it('gives hashed grid images the category of their named sibling', async () => {
    const page = 'https://shop.example/'
    const group = `${page}|ul.grid>li.card>img`
    const assets = await buildDiscoveredAssetsFromCandidates(
      [
        { url: 'https://cdn.example/products/blue-mug.jpg', sourcePage: page, similarGroup: group },
        { url: 'https://cdn.example/f/9a8b7c6d.jpg', sourcePage: page, similarGroup: group },
        { url: 'https://cdn.example/f/1e2f3a4b.jpg', sourcePage: page, similarGroup: group },
        { url: 'https://cdn.example/f/5c6d7e8f.jpg', sourcePage: page },
      ],
      10,
    )
    const byUrl = Object.fromEntries(assets.map((a) => [a.sourceUrl, a.category]))
    expect(byUrl['https://cdn.example/products/blue-mug.jpg']).toBe('product')
    expect(byUrl['https://cdn.example/f/9a8b7c6d.jpg']).toBe('product')
    expect(byUrl['https://cdn.example/f/1e2f3a4b.jpg']).toBe('product')
    expect(byUrl['https://cdn.example/f/5c6d7e8f.jpg']).toBe('brand')
  })
})

describe('page Markdown in the modal', async () => {
  const { firstParagraphOf } = await import('../src/shared/personalization/researchHelpers')

  it('picks the first real prose paragraph as a brand description', () => {
    const md = '# Acme Plumbing\n\n- Drain cleaning\n\nCall now\n\nFamily-owned since **1987**, serving the [whole valley](https://x.example) with honest pricing.\n\nMore text here that is long enough to count as a paragraph.'
    expect(firstParagraphOf(md)).toBe('Family-owned since 1987, serving the whole valley with honest pricing.')
    expect(firstParagraphOf('# Only a heading')).toBeUndefined()
    expect(firstParagraphOf(undefined)).toBeUndefined()
    expect(firstParagraphOf(`${'word '.repeat(100)}`)!.length).toBeLessThanOrEqual(300)
  })
})

describe('regressions found on real sites', () => {
  it('detects a JS shell in linear time on a page of unclosed <div tags', () => {
    const started = Date.now()
    looksJsRendered('<div '.repeat(100_000))
    expect(Date.now() - started).toBeLessThan(1500)
    expect(looksJsRendered('<div id="app"></div>').frameworks).toContain('spa-root')
    expect(looksJsRendered('<div id="root"><p>Rendered on the server</p></div>').frameworks).not.toContain('spa-root')
  })

  it('scans hostile CSS (long hyphen runs) in linear time', () => {
    const hostile = `/*${'-'.repeat(500_000)}*/ :root{--brand:#8a3b12} .a{color:#8a3b12}`
    const started = Date.now()
    const colors = extractBrandColors('', [hostile, `${' color:'.repeat(50_000)}`])
    expect(Date.now() - started).toBeLessThan(500)
    expect(colors.primary).toBe('#8a3b12')
  })

  it('Markdown survives <html class="supports-no-cookies"> (Shopify themes)', () => {
    const html = '<html class="no-js supports-no-cookies"><body class="template-index"><main><h1>Sightglass</h1><p>Coffee roasted in San Francisco.</p></main><div class="cookie-banner">Accept cookies</div></body></html>'
    const md = htmlToMarkdown(html)
    expect(md).toContain('# Sightglass')
    expect(md).toContain('Coffee roasted in San Francisco.')
    expect(md).not.toContain('Accept cookies')
  })

  it('ignores WordPress admin and UI-library colour variables', () => {
    const html = '<style>:root{--wp-admin-theme-color:#007cba;--swiper-theme-color:#007aff;--brand:#8a3b12}.a{color:#8a3b12}</style>'
    const colors = extractBrandColors(html)
    expect(colors.primary).toBe('#8a3b12')
    expect(colors.palette).not.toContain('#007cba')
    expect(colors.palette).not.toContain('#007aff')
  })

  it('reads the Squarespace theme stylesheet from its CDN', () => {
    const html = '<link rel="stylesheet" href="https://static1.squarespace.com/static/versioned-site-css/abc/site.css"><link rel="stylesheet" href="https://evil.example/x.css">'
    expect(extractStylesheetUrls(html, 'https://bedford-demo.squarespace.com/')).toEqual([
      'https://static1.squarespace.com/static/versioned-site-css/abc/site.css',
    ])
  })
})

describe('review follow-ups (CodeRabbit)', async () => {
  const { classifyAssetCandidate } = await import('../src/server/discoveryAssetFilter')
  const { SITE_IMAGE_HEADERS } = await import('../src/lib/siteRequestHeaders')

  it('image requests never ask for AVIF, which the download step drops', () => {
    expect(SITE_IMAGE_HEADERS.Accept).not.toMatch(/avif/i)
    expect(SITE_IMAGE_HEADERS.Accept).toMatch(/image\/webp/)
  })

  it('keeps two separate lists with identical markup in different groups', () => {
    const card = '<div class="card"><img class="x"></div>'
    const $ = cheerio.load(`<section class="s"><div class="grid">${card}${card}</div></section><section class="s"><div class="grid">${card}</div></section>`)
    const keys = $('img').toArray().map((el) => elementStructureKey($, el))
    expect(keys[0]).toBe(keys[1])
    expect(keys[0]).not.toBe(keys[2])
  })

  it('rejects mostly transparent #rgba / #rrggbbaa colours', () => {
    expect(extractBrandColors('<meta name="theme-color" content="#e6394610">').palette).toEqual([])
    expect(extractBrandColors('<meta name="theme-color" content="#e63946ff">').primary).toBe('#e63946')
    expect(extractBrandColors('<meta name="theme-color" content="#e631">').palette).toEqual([])
  })

  it('keeps the start of a single oversized paragraph', () => {
    const md = htmlToMarkdown(`<main><p>${'Family plumbing since 1987. '.repeat(100)}</p></main>`, 300)
    expect(md.length).toBeGreaterThan(200)
    expect(md.length).toBeLessThanOrEqual(300)
  })

  it('reads camelCase class names in the image context', () => {
    expect(classifyAssetCandidate({ url: 'https://cdn.example/f/8a7b6c.jpg', contextText: 'teamGrid' }).category).toBe('team')
  })
})
