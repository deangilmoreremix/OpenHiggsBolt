// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { fitTextBox, ROLE_FIT_LIMITS, TITLE_SAFE_INSET } from '../textFit'

const ASPECT_RATIOS: [number, number][] = [
  [1920, 1080], // 16:9
  [1080, 1920], // 9:16
  [1080, 1080], // 1:1
  [960, 1080], // 4:5
]

describe('fitTextBox property tests', () => {
  for (const role of Object.keys(ROLE_FIT_LIMITS)) {
    const limits = ROLE_FIT_LIMITS[role]
    for (const [compW, compH] of ASPECT_RATIOS) {
      for (const len of [1, 5, 10, 25, 50, 100, 150, 200]) {
        const text = 'x'.repeat(len)
        it(`${role} ${compW}x${compH} len=${len} stays in safe area and within line limit`, () => {
          const result = fitTextBox({
            text,
            role,
            compW,
            compH,
            fontSizePx: 72,
          })

          const safeW = compW * (1 - TITLE_SAFE_INSET)
          const maxWidthPx = safeW * limits.maxWidthRatio

          // Font size must be at least the minimum
          expect(result.fontSizePx).toBeGreaterThanOrEqual(limits.minFontSizePx)

          // Height must be consistent with lines and font size
          expect(result.heightPx).toBe(result.lines * result.fontSizePx * 1.25)

          // When it fits, all constraints hold
          if (result.fits) {
            expect(result.lines).toBeLessThanOrEqual(limits.maxLines)
            expect(result.widthPx).toBeLessThanOrEqual(maxWidthPx + 1) // +1 for rounding
          } else {
            // When it doesn't fit, font size is at the minimum
            expect(result.fontSizePx).toBe(limits.minFontSizePx)
          }
        })
      }
    }
  }
})

describe('fitTextBox edge cases', () => {
  it('empty text returns zero dimensions', () => {
    const result = fitTextBox({ text: '', role: 'cta', compW: 1920, compH: 1080, fontSizePx: 32 })
    expect(result.lines).toBe(0)
    expect(result.widthPx).toBe(0)
    expect(result.heightPx).toBe(0)
    expect(result.fits).toBe(true)
  })

  it('short text at base size fits without shrinking', () => {
    const result = fitTextBox({
      text: 'Book now',
      role: 'cta',
      compW: 1920,
      compH: 1080,
      fontSizePx: 32,
    })
    expect(result.fontSizePx).toBe(32)
    expect(result.fits).toBe(true)
  })

  it('very long text shrinks to minimum font size', () => {
    const result = fitTextBox({
      text: 'x'.repeat(500),
      role: 'cta',
      compW: 1920,
      compH: 1080,
      fontSizePx: 72,
    })
    expect(result.fontSizePx).toBe(18) // cta minFontSizePx
    expect(result.fits).toBe(false)
  })
})
