import { describe, it, expect } from 'vitest'
import { hasTextScrim, scrimAlphaAt, scrimAlphaOverBox, scrimBackground, scrimForBox, SCRIM_PEAK } from '../scrim'
import { worstContrast } from '../placement/engine'
import type { LumaSample } from '../placement/types'

const W = 1920
const H = 1080
const box = { left: 200, top: 700, width: 700, height: 90 }

describe('text scrim geometry', () => {
  it('only plain text kinds get one (never the CTA pill, images or designs)', () => {
    for (const k of ['headline', 'businessName', 'tagline', 'offer'] as const) expect(hasTextScrim(k)).toBe(true)
    for (const k of ['cta', 'logo', 'productImage', 'serviceImage', 'endCard', 'design'] as const) expect(hasTextScrim(k)).toBe(false)
  })

  it('covers the text box, centered on it, with room around it', () => {
    const s = scrimForBox(box, W, H)
    expect(s.cx).toBe(550)
    expect(s.cy).toBe(745)
    expect(s.rx).toBeGreaterThan(box.width / 2)
    expect(s.ry).toBeGreaterThan(box.height / 2)
  })

  it('is darkest at the center, fades smoothly, and is zero outside', () => {
    const s = scrimForBox(box, W, H)
    const center = scrimAlphaAt(s, s.cx, s.cy)
    const mid = scrimAlphaAt(s, s.cx + s.rx * 0.7, s.cy)
    const edge = scrimAlphaAt(s, s.cx + s.rx * 0.99, s.cy)
    expect(center).toBeCloseTo(SCRIM_PEAK, 5)
    expect(mid).toBeLessThan(center)
    expect(edge).toBeLessThan(mid)
    expect(scrimAlphaAt(s, s.cx + s.rx * 1.2, s.cy)).toBe(0)
    expect(scrimAlphaAt(s, s.cx, s.cy - s.ry * 1.2)).toBe(0)
  })

  it('the alpha a box can rely on is its weakest point, and still positive for real text', () => {
    const s = scrimForBox(box, W, H)
    const reliable = scrimAlphaOverBox(s, box)
    expect(reliable).toBeGreaterThan(0)
    expect(reliable).toBeLessThanOrEqual(scrimAlphaAt(s, s.cx, s.cy))
  })

  it('emits a radial-gradient that starts at the peak and ends fully transparent', () => {
    const css = scrimBackground(scrimForBox(box, W, H))
    expect(css).toMatch(/^radial-gradient\(ellipse \d+px \d+px at \d+px \d+px,/)
    expect(css).toContain(`rgba(0,0,0,${SCRIM_PEAK.toFixed(3)}) 0%`)
    expect(css).toMatch(/rgba\(0,0,0,0\) 100%\)$/)
  })
})

describe('contrast credit for a drawn scrim', () => {
  // A uniformly bright frame: white text on it is unreadable without help.
  const bright: LumaSample = { t: 1, cols: 4, rows: 4, luma: new Array(16).fill(0.9) }

  it('without a scrim white text on bright footage fails; with one it improves', () => {
    const none = worstContrast(box, [bright], W, H, '#ffffff')!
    const withScrim = worstContrast(box, [bright], W, H, '#ffffff', scrimAlphaOverBox(scrimForBox(box, W, H), box))!
    expect(none.ratio).toBeLessThan(3)
    expect(withScrim.ratio).toBeGreaterThan(none.ratio)
  })

  it('a zero or out-of-range alpha never changes or breaks the result', () => {
    const base = worstContrast(box, [bright], W, H, '#ffffff')!
    expect(worstContrast(box, [bright], W, H, '#ffffff', 0)!.ratio).toBeCloseTo(base.ratio, 10)
    expect(worstContrast(box, [bright], W, H, '#ffffff', -5)!.ratio).toBeCloseTo(base.ratio, 10)
    expect(Number.isFinite(worstContrast(box, [bright], W, H, '#ffffff', 5)!.ratio)).toBe(true)
  })
})
