import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `capturePageScreenshots` runs inside the same guarded browser session as
 * asset discovery. Chromium is replaced with a stub; DNS is injected, so no
 * socket is ever opened.
 */

interface Harness {
  launches: number
  contextOptions: Record<string, unknown> | null
  routeHandler: ((route: any, request: any) => Promise<unknown>) | null
  gotos: string[]
  finalUrl: string
  screenshots: Array<Record<string, unknown>>
}

function stubChromium(h: Harness) {
  const page = {
    goto: vi.fn(async (url: string) => { h.gotos.push(url) }),
    url: () => h.finalUrl,
    waitForLoadState: vi.fn(async () => {}),
    evaluate: vi.fn(async (fn: { name?: string }) => {
      if (fn.name === 'findCropRects') return [{ x: 400, y: 240, width: 360, height: 300 }, { x: 780, y: 240, width: 360, height: 300 }]
      if (fn.name === 'findAssetRects') return { logo: { x: 40, y: 20, width: 160, height: 48 }, images: [{ x: 960, y: 300, width: 800, height: 520 }] }
      if (fn.name === 'readBrandStyles') return { background: 'rgb(255, 255, 255)', text: 'rgb(17, 17, 17)', accent: 'rgba(255, 85, 0, 1)', fontFamily: 'Inter, sans-serif' }
      if (String(fn).includes('scrollHeight')) return 5000
      return undefined
    }),
    screenshot: vi.fn(async (opts: Record<string, unknown>) => { h.screenshots.push(opts); return Buffer.from('jpg') }),
    title: async () => 'Acme — ship faster',
    close: vi.fn(async () => {}),
  }
  return {
    launch: vi.fn(async () => {
      h.launches++
      return {
        isConnected: () => true,
        newContext: vi.fn(async (opts: Record<string, unknown>) => {
          h.contextOptions = opts
          return {
            route: vi.fn(async (_p: string, handler: Harness['routeHandler']) => { h.routeHandler = handler }),
            newPage: vi.fn(async () => page),
            close: vi.fn(async () => {}),
          }
        }),
        close: vi.fn(async () => {}),
      }
    }),
  }
}

let h: Harness

async function load() {
  vi.doMock('playwright', () => ({ chromium: stubChromium(h) }))
  const mod = await import('../src/server/browserDiscovery')
  const guard = mod.createSsrfGuard({ dnsResolver: async (host: string) => (host.endsWith('.example.com') ? ['93.184.216.34'] : []) })
  return { mod, guard }
}

beforeEach(() => {
  vi.resetModules()
  h = { launches: 0, contextOptions: null, routeHandler: null, gotos: [], finalUrl: 'https://acme.example.com/', screenshots: [] }
})

describe('capturePageScreenshots', () => {
  it('captures a 1920-wide page at 2x, card crops and brand colours', async () => {
    const { mod, guard } = await load()
    const result = await mod.capturePageScreenshots('https://acme.example.com/', { guard })

    expect(h.gotos).toEqual(['https://acme.example.com/'])
    expect(h.contextOptions).toMatchObject({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2, serviceWorkers: 'block' })
    // The page is cut at the sample page height the shots were tuned on.
    expect(h.screenshots[0]).toMatchObject({ type: 'jpeg', clip: { x: 0, y: 0, width: 1920, height: mod.CAPTURE_MAX_PAGE_HEIGHT } })
    expect(result.crops).toHaveLength(2)
    expect(result.pageHeight).toBe(mod.CAPTURE_MAX_PAGE_HEIGHT)
    expect(result.title).toBe('Acme — ship faster')
    expect(result.brand).toEqual({ background: '#ffffff', text: '#111111', accent: '#ff5500', fontFamily: 'Inter, sans-serif' })
  })

  it("pulls the site's logo (transparent PNG) and its own images", async () => {
    const { mod, guard } = await load()
    const result = await mod.capturePageScreenshots('https://acme.example.com/', { guard })
    expect(result.logo).toBeInstanceOf(Buffer)
    expect(result.images).toHaveLength(1)
    expect(h.screenshots).toContainEqual(expect.objectContaining({ type: 'png', omitBackground: true, clip: { x: 40, y: 20, width: 160, height: 48 } }))
    expect(h.screenshots).toContainEqual(expect.objectContaining({ type: 'jpeg', clip: { x: 960, y: 300, width: 800, height: 520 } }))
  })

  it('lets fonts and stylesheets through the gate but blocks media', async () => {
    const { mod, guard } = await load()
    await mod.capturePageScreenshots('https://acme.example.com/', { guard })
    const route = (resourceType: string) => ({ abort: vi.fn(), continue: vi.fn() , resourceType })
    const font = route('font')
    await h.routeHandler!(font, { url: () => 'https://acme.example.com/inter.woff2', resourceType: () => 'font', redirectedFrom: () => null })
    expect(font.continue).toHaveBeenCalled()
    const media = route('media')
    await h.routeHandler!(media, { url: () => 'https://acme.example.com/intro.mp4', resourceType: () => 'media', redirectedFrom: () => null })
    expect(media.abort).toHaveBeenCalled()
    const internal = route('image')
    await h.routeHandler!(internal, { url: () => 'http://169.254.169.254/latest/meta-data', resourceType: () => 'image', redirectedFrom: () => null })
    expect(internal.abort).toHaveBeenCalled()
  })

  it('refuses a private address without launching a browser', async () => {
    const { mod, guard } = await load()
    await expect(mod.capturePageScreenshots('http://127.0.0.1:3000/', { guard })).rejects.toThrow(mod.BrowserSsrfError)
    expect(h.launches).toBe(0)
  })

  it('fails when navigation ends on another host', async () => {
    h.finalUrl = 'https://elsewhere.example.com/'
    const { mod, guard } = await load()
    await expect(mod.capturePageScreenshots('https://acme.example.com/', { guard })).rejects.toThrow(/left the validated origin/)
    expect(h.screenshots).toHaveLength(0)
  })

  it('normalises CSS colours', async () => {
    const { mod } = await load()
    expect(mod.cssColorToHex('rgb(0, 128, 255)')).toBe('#0080ff')
    expect(mod.cssColorToHex('rgba(0, 0, 0, 0)')).toBeNull()
    expect(mod.cssColorToHex('#ABCDEF')).toBe('#abcdef')
    expect(mod.cssColorToHex('red')).toBeNull()
  })
})
