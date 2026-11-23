import { describe, expect, it, vi } from 'vitest'
import { STUDIO_PLATFORMS, isRecommendedPlatform } from '../src/lib/brandStudio/platforms'
import { PHOTO_CATEGORIES, ALL_PHOTO_PRESETS } from '../src/lib/brandStudio/photoPresets'
import { STUDIO_GOALS } from '../src/lib/brandStudio/goals'
import { isUsableImageRef } from '../src/lib/brandStudio/imageRefs'
import { extractText, parseConceptList, truncateWords } from '../src/lib/brandStudio/parse'
import { buildConceptsPrompt, buildImagePrompt } from '../src/lib/brandStudio/prompts'
import { parseBrandHtml, looksBlocked } from '../src/lib/brandStudio/staticScrape'
import { createMuapi, renderCampaignImage } from '../src/lib/brandStudio/muapiServer'
import { pickPalette } from '../src/lib/brandStudio/pipeline'

describe('Brand Studio parity data', () => {
  it('has the 8 upstream platforms with their copy caps', () => {
    expect(STUDIO_PLATFORMS.map((p) => p.id)).toEqual(['instagram-feed', 'instagram-story', 'linkedin', 'facebook', 'twitter', 'web-banner', 'email', 'youtube'])
    expect(STUDIO_PLATFORMS.map((p) => p.copy.bodyMaxWords)).toEqual([25, 0, 35, 25, 30, 20, 20, 0])
    expect(STUDIO_PLATFORMS.find((p) => p.id === 'youtube')!.copy.ctaMaxWords).toBe(0)
  })
  it('has 6 goals and 30 photo presets', () => {
    expect(STUDIO_GOALS).toHaveLength(6)
    expect(PHOTO_CATEGORIES).toHaveLength(6)
    expect(ALL_PHOTO_PRESETS).toHaveLength(30)
  })
  it('matches recommended platforms by id, family and alias', () => {
    const p = (id: string) => STUDIO_PLATFORMS.find((x) => x.id === id)!
    expect(isRecommendedPlatform(p('instagram-story'), ['instagram'])).toBe(true)
    expect(isRecommendedPlatform(p('web-banner'), ['banner'])).toBe(true)
    expect(isRecommendedPlatform(p('youtube'), ['youtube_thumb'])).toBe(true)
    expect(isRecommendedPlatform(p('email'), ['linkedin'])).toBe(false)
  })
})

describe('parsing', () => {
  it('reads MuAPI text from outputs[0]', () => expect(extractText({ status: 'completed', outputs: ['hello'] })).toBe('hello'))
  it('parses a bare array, fenced array or {concepts}', () => {
    expect(parseConceptList('[{"title":"a"}]')).toHaveLength(1)
    expect(parseConceptList('```json\n[{"title":"a"},{"title":"b"}]\n```')).toHaveLength(2)
    expect(parseConceptList('{"concepts":[{"title":"a"}]}')).toHaveLength(1)
  })
  it('truncates to word caps', () => expect(truncateWords('a b c d', 2)).toBe('a b'))
  it('rejects SVG/ICO/GIF image references', () => {
    expect(isUsableImageRef('https://x.com/logo.svg')).toBe(false)
    expect(isUsableImageRef('https://x.com/logo.png?v=1')).toBe(true)
    expect(isUsableImageRef('data:image/svg+xml;base64,AAA')).toBe(false)
  })
})

describe('prompts', () => {
  it('uses the upstream concept prompt shape', () => {
    const p = buildConceptsPrompt({ brandName: 'Acme' }, 'lead-gen', 'bold')
    expect(p).toContain('GOAL: Lead generation')
    expect(p).toContain('USER DIRECTION: bold')
    expect(p).toContain('"recommended_platforms"')
  })
  it('asks for no text in the image by default overlay mode', () => {
    expect(buildImagePrompt({}, {}, 'twitter', 'Hi', { noText: true })).toContain('render NO text')
    expect(buildImagePrompt({}, {}, 'twitter', 'Hi')).toContain('"Hi"')
  })
})

describe('static scrape', () => {
  it('extracts brand signals and skips tracking / base64 placeholders', () => {
    const html = `<html><head><title>Acme</title><meta name="description" content="Rockets"><meta property="og:image" content="/og.png"><meta name="theme-color" content="#22d3ee"><style>a{color:#ff0000;font-family:"Inter",sans-serif}</style></head><body><img class="logo" src="/logo.png"><img src="https://x.com/pixel.gif"><img src="R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"><p>${'word '.repeat(120)}</p></body></html>`
    const s = parseBrandHtml(html, 'https://acme.test/')
    expect(s.title).toBe('Acme')
    expect(s.logoCandidates).toEqual(['https://acme.test/logo.png'])
    expect(s.images.filter((i) => /pixel|R0lGOD/.test(i))).toEqual([])
    expect(s.rawColors).toContain('#ff0000')
    expect(s.fonts).toContain('Inter')
    expect(s.blocked).toBe(false)
  })
  it('flags block pages', () => expect(looksBlocked('Robot Check', '')).toBe(true))
  it('orders the palette colourful-first', () => expect(pickPalette(['#ffffff', '#ff0000', '#000000']).primary[0]).toBe('#ff0000'))
})

describe('MuAPI client', () => {
  const resp = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })
  it('submits then polls and returns outputs', async () => {
    const f = vi.fn()
      .mockResolvedValueOnce(resp(200, { request_id: 'r1' }))
      .mockResolvedValueOnce(resp(200, { status: 'processing' }))
      .mockResolvedValueOnce(resp(200, { status: 'completed', outputs: ['answer'] }))
    const mu = createMuapi({ key: 'k', fetchImpl: f as any, pollMs: 1 })
    expect(await mu.text('hi')).toBe('answer')
  })
  it('treats a failed job (HTTP 400 with detail) as terminal, not retried forever', async () => {
    const f = vi.fn()
      .mockResolvedValueOnce(resp(200, { request_id: 'r1' }))
      .mockResolvedValue(resp(400, { detail: { status: 'failed', error: 'The file format is not supported' } }))
    const mu = createMuapi({ key: 'k', fetchImpl: f as any, pollMs: 1 })
    await expect(mu.text('hi')).rejects.toThrow(/file format is not supported/)
    expect(f).toHaveBeenCalledTimes(2)
  })
  it('requires a key', () => expect(() => createMuapi({ key: '' })).toThrow(/key required/))
  it('skips an SVG logo and falls back to text-to-image', async () => {
    const mu: any = { imageEdit: vi.fn(), image: vi.fn().mockResolvedValue('https://img/1.png') }
    expect(await renderCampaignImage(mu, 'https://x/logo.svg', 'p', '1:1')).toBe('https://img/1.png')
    expect(mu.imageEdit).not.toHaveBeenCalled()
  })
  it('falls back when the logo-referenced edit fails', async () => {
    const mu: any = { imageEdit: vi.fn().mockRejectedValue(new Error('nope')), image: vi.fn().mockResolvedValue('https://img/2.png') }
    expect(await renderCampaignImage(mu, 'https://x/logo.png', 'p', '1:1')).toBe('https://img/2.png')
  })
})
