import { describe, expect, it } from 'vitest'
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
