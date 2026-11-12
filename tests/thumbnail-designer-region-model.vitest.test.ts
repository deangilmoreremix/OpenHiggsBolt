import { describe, expect, it } from 'vitest'
import {
  addLayer, createProject, designChecks, makeImageLayer, makeTextLayer, platformsForCanvas, sanitizeProject, saveVariant, swapBackgroundImage, updateLayer, visibleCrop, MAX_VARIANTS,
  type TextLayer,
} from '@/components/social-publishing/thumbnail/designer/model'
import { boxToImagePoint, clientToBoxPoint, coverFit, imageToBoxPoint, visibleImageRect } from '@/components/social-publishing/thumbnail/designer/coverFit'

const measure = (text: string) => text.length * 10

describe('coverFit: mapping a pointer through the cropped background', () => {
  it('a wider picture is cropped left and right', () => {
    const fit = coverFit(2560, 720, 1280, 720)
    expect(fit).toMatchObject({ scale: 1, dx: -640, dy: 0 })
    expect(boxToImagePoint(fit, 2560, 720, 0, 0)).toEqual({ x: 640, y: 0 })
    expect(boxToImagePoint(fit, 2560, 720, 1280, 720)).toEqual({ x: 1920, y: 720 })
    expect(visibleImageRect(fit, 2560, 720, 1280, 720)).toEqual({ x: 640, y: 0, w: 1280, h: 720 })
  })
  it('a taller picture is cropped top and bottom and scaled', () => {
    const fit = coverFit(500, 1000, 1000, 500) // scale 2, picture drawn 1000 x 2000
    expect(fit.scale).toBe(2)
    expect(fit.dy).toBe(-750)
    expect(boxToImagePoint(fit, 500, 1000, 500, 250)).toEqual({ x: 250, y: 500 }) // centre stays the centre
  })
  it('round-trips and clamps points that fall outside the picture', () => {
    const fit = coverFit(1000, 500, 640, 640)
    const p = boxToImagePoint(fit, 1000, 500, 320, 100)
    const back = imageToBoxPoint(fit, p.x, p.y)
    expect(back.x).toBeCloseTo(320, 6)
    expect(back.y).toBeCloseTo(100, 6)
    const clamped = boxToImagePoint(fit, 1000, 500, -50, 9999)
    expect(clamped.x).toBeGreaterThanOrEqual(0)
    expect(clamped.y).toBeLessThanOrEqual(500)
  })
  it('converts client coordinates of a scaled-down element to box pixels', () => {
    expect(clientToBoxPoint({ left: 100, top: 50, width: 640, height: 360 }, 1280, 720, 420, 230)).toEqual({ x: 640, y: 360 })
  })
})

describe('variants', () => {
  it('are sanitized: only picture URLs, no duplicates, capped', () => {
    const base = createProject(1280, 720)
    const urls = Array.from({ length: 20 }, (_, i) => `data:image/png;base64,${i}`)
    const p = sanitizeProject({ ...base, variants: ['javascript:alert(1)', 5, 'data:image/png;base64,A', 'data:image/png;base64,A', ...urls] })!
    expect(p.variants).not.toContain('javascript:alert(1)')
    expect(p.variants!.filter((v) => v === 'data:image/png;base64,A')).toHaveLength(1)
    expect(p.variants!.length).toBe(MAX_VARIANTS)
    expect(sanitizeProject(base)!.variants).toBeUndefined()
  })
  it('saveVariant adds the current background once', () => {
    const p = createProject(1280, 720, { mode: 'image', imageSrc: 'data:image/png;base64,A' })
    const once = saveVariant(p)
    expect(once.variants).toEqual(['data:image/png;base64,A'])
    expect(saveVariant(once)).toBe(once)
    expect(saveVariant(createProject(1280, 720))).toBeDefined()
  })
  it('swapBackgroundImage changes only the picture: layers and adjustments are identical', () => {
    let p = createProject(1280, 720, { mode: 'image', imageSrc: 'old', blur: 7, brightness: 90 })
    p = addLayer(p, makeTextLayer(p, 'headline', 'HI'))
    const next = swapBackgroundImage(p, 'new')
    expect(next.layers).toBe(p.layers)
    expect(next.background).toEqual({ ...p.background, imageSrc: 'new' })
  })
})

describe('platform safe zones', () => {
  const canvas = createProject(1280, 720)
  const text = (over: Partial<TextLayer>) => addLayer(canvas, { ...makeTextLayer(canvas), text: 'HELLO', fontSize: 40, strokeWidth: 0, w: 300, h: 80, ...over })
  const ids = (p: ReturnType<typeof text>, platforms: Parameters<typeof designChecks>[2] = { platforms: ['youtube'] }) => designChecks(p, measure, platforms).map((w) => w.id)

  it('picks the platform from the canvas shape', () => {
    expect(platformsForCanvas(1280, 720)).toEqual(['youtube'])
    expect(platformsForCanvas(1080, 1920)).toEqual(['reels'])
    expect(platformsForCanvas(1080, 1350)).toEqual(['portrait'])
    expect(platformsForCanvas(1080, 1080)).toEqual(['square'])
  })
  it('is opt-in: no platform means no platform warnings', () => {
    expect(ids(text({ x: 1100, y: 640 }), {})).not.toContain('covered-by-badge')
  })
  it('warns when text sits under the YouTube duration badge', () => {
    expect(ids(text({ x: 1000, y: 630, w: 250, h: 60, align: 'right' }))).toContain('covered-by-badge')
  })
  it('does not warn when the text is elsewhere, or short text in a wide box does not reach the badge', () => {
    expect(ids(text({ x: 100, y: 100 }))).not.toContain('covered-by-badge')
    expect(ids(text({ x: 700, y: 630, w: 560, h: 60, align: 'left' }))).not.toContain('covered-by-badge') // 5 letters, left aligned
  })
  it('warns about a logo under the badge', () => {
    const logo = { ...makeImageLayer(canvas, 'x', 100, 100, 'logo'), x: 1100, y: 600, w: 150, h: 100 }
    expect(ids(addLayer(canvas, logo))).toContain('covered-by-badge')
  })
  it('warns about a logo or subject that lies entirely outside a platform crop', () => {
    const logo = { ...makeImageLayer(canvas, 'x', 100, 100, 'logo'), x: 1100, y: 100, w: 100, h: 100 }
    expect(designChecks(addLayer(canvas, logo), measure, { platforms: ['reels'] }).map((x) => x.id)).toContain('cropped-out')
  })
  it('ignores hidden layers', () => {
    const p = text({ x: 1000, y: 630, w: 250, h: 60, align: 'right' })
    const hidden = updateLayer(p, p.layers[0].id, { hidden: true })
    expect(ids(hidden)).not.toContain('covered-by-badge')
  })
  it('Reels: the bottom caption strip covers text, the top does not', () => {
    const tall = createProject(1080, 1920)
    const mk = (y: number) => addLayer(tall, { ...makeTextLayer(tall), text: 'HELLO', fontSize: 80, strokeWidth: 0, x: 100, y, w: 600, h: 120 })
    expect(designChecks(mk(1700), measure, { platforms: ['reels'] }).map((w) => w.id)).toContain('covered-by-badge')
    expect(designChecks(mk(300), measure, { platforms: ['reels'] }).map((w) => w.id)).not.toContain('covered-by-badge')
  })
  it('flags text that a narrower platform crop cuts off', () => {
    const p = text({ x: 20, y: 300, w: 400, h: 80 })
    const w = designChecks(p, measure, { platforms: ['reels'] })
    expect(w.map((x) => x.id)).toContain('cropped-out')
    expect(designChecks(text({ x: 540, y: 300, w: 200, h: 80, align: 'center' }), measure, { platforms: ['reels'] }).map((x) => x.id)).not.toContain('cropped-out')
  })
  it('visibleCrop centre-crops to the platform shape', () => {
    const c = visibleCrop({ width: 1280, height: 720 }, 9 / 16)
    expect(c.h).toBe(720)
    expect(c.w).toBeCloseTo(405, 5)
    expect(c.x).toBeCloseTo((1280 - 405) / 2, 5)
    expect(visibleCrop({ width: 1000, height: 1000 }, 16 / 9)).toMatchObject({ x: 0, w: 1000, h: 562.5 })
  })
})
