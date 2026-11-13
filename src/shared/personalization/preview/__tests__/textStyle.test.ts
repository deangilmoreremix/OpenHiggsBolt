import { describe, it, expect } from 'vitest'
import { ctaPillStyle, isTextStyleKind, layerTextStyle, PILL_SHADOW, TEXT_SHADOW } from '../textStyle'

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
