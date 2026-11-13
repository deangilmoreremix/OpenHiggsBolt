import { describe, it, expect } from 'vitest'
import { accentRuleStyle, ctaPillStyle, isTextStyleKind, layerTextStyle, PILL_SHADOW, TEXT_SHADOW } from '../textStyle'

describe('layerTextStyle', () => {
  const base = { fontSizePx: 48, color: '#fff' }

  it('gives every text role a weight, line-height, tracking and the shared shadow', () => {
    for (const kind of ['headline', 'businessName', 'offer', 'tagline'] as const) {
      const s = layerTextStyle(kind, base)
      expect(s.fontSize).toBe(48)
      expect(s.color).toBe('#fff')
      expect(typeof s.fontWeight).toBe('number')
      expect(typeof s.lineHeight).toBe('number')
      expect(s.letterSpacing).toBeTruthy()
      expect(s.textShadow).toBe(TEXT_SHADOW)
      expect(s.textAlign).toBe('center')
    }
  })

  it('makes headlines heavy and tight, and taglines light and open', () => {
    const headline = layerTextStyle('headline', base)
    const tagline = layerTextStyle('tagline', base)
    expect(headline.fontWeight as number).toBeGreaterThan(tagline.fontWeight as number)
    expect(headline.lineHeight as number).toBeLessThan(tagline.lineHeight as number)
    expect(headline.letterSpacing).toMatch(/^-/)
    expect(tagline.letterSpacing).not.toMatch(/^-/)
  })

  it('only breaks a word that cannot fit on its own line', () => {
    expect(layerTextStyle('headline', base).overflowWrap).toBe('break-word')
  })
})

describe('ctaPillStyle', () => {
  it('is a rounded pill in the layer color with a soft shadow', () => {
    const s = ctaPillStyle({ fontSizePx: 30, background: '#28c98b', color: '#041014' })
    expect(s.background).toBe('#28c98b')
    expect(s.color).toBe('#041014')
    expect(s.borderRadius).toBe(999)
    expect(s.boxShadow).toBe(PILL_SHADOW)
    expect(s.fontSize).toBe(30)
  })
})

describe('isTextStyleKind', () => {
  it('recognises the styled text kinds only', () => {
    expect(isTextStyleKind('headline')).toBe(true)
    expect(isTextStyleKind('cta')).toBe(true)
    expect(isTextStyleKind('logo')).toBe(false)
    expect(isTextStyleKind('design')).toBe(false)
  })
})

describe('accentRuleStyle', () => {
  const box = { leftPx: 400, topPx: 600, widthPx: 800, heightPx: 70 }
  it('draws only for headlines', () => {
    for (const k of ['tagline', 'businessName', 'offer', 'cta', 'logo', 'design'] as const) {
      expect(accentRuleStyle(k, 'slide-up', box, 1920, 1080, '#f00')).toBeNull()
    }
    expect(accentRuleStyle('headline', 'slide-up', box, 1920, 1080, '#f00')).not.toBeNull()
  })

  it('puts a short centered rule under the text', () => {
    const r = accentRuleStyle('headline', 'slide-up', box, 1920, 1080, '#f00')!
    expect(r.top as number).toBeGreaterThan(box.topPx + box.heightPx)
    expect((r.left as number) + (r.width as number) / 2).toBeCloseTo(box.leftPx + box.widthPx / 2, 0)
    expect(r.width as number).toBeLessThan(box.widthPx)
    expect(r.height as number).toBeGreaterThanOrEqual(3)
    expect(r.background).toBe('#f00')
  })

  it('uses a vertical bar on the left edge for the lower-third animation', () => {
    const r = accentRuleStyle('headline', 'lower-third', box, 1920, 1080, '#0f0')!
    expect((r.left as number) + (r.width as number)).toBeLessThan(box.leftPx)
    expect(r.height).toBe(box.heightPx)
    expect(r.top).toBe(box.topPx)
  })

  it('never goes off the left edge and ignores empty boxes', () => {
    const r = accentRuleStyle('headline', 'lower-third', { ...box, leftPx: 2 }, 1920, 1080, '#0f0')!
    expect(r.left as number).toBeGreaterThanOrEqual(0)
    expect(accentRuleStyle('headline', 'fade', { ...box, widthPx: 0 }, 1920, 1080, '#0f0')).toBeNull()
  })
})
