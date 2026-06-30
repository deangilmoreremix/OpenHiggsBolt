import { describe, it, expect } from 'vitest'
import {
  ALLOWED_EFFECTS,
  ALLOWED_ASPECT_RATIOS,
  ALLOWED_RESOLUTIONS,
  ALLOWED_QUALITIES,
  validateGenerationInput,
} from '../../app/api/vfx/_validation.ts'

const base = {
  image_url: 'https://example.com/image.jpg',
  effect: 'Car Explosion',
  aspect_ratio: '16:9',
  resolution: '720p',
  quality: 'high',
  duration: 5,
}

describe('validateGenerationInput', () => {
  it('rejects an unknown effect', () => {
    const errors = validateGenerationInput({ ...base, effect: 'Fake Effect' })
    expect(errors).toEqual(
      expect.arrayContaining([expect.stringMatching(/effect/i)]),
    )
    expect(ALLOWED_EFFECTS.has('Car Explosion')).toBe(true)
  })

  it('accepts a valid effect from the allow-list', () => {
    const errors = validateGenerationInput({ ...base, effect: 'Kiss' })
    expect(errors).toEqual([])
  })

  it('rejects an invalid aspect ratio', () => {
    const errors = validateGenerationInput({ ...base, aspect_ratio: '4:3' })
    expect(errors).toEqual(
      expect.arrayContaining([expect.stringMatching(/aspect_ratio/i)]),
    )
    expect(ALLOWED_ASPECT_RATIOS.has('16:9')).toBe(true)
  })

  it('rejects duration below 3 or above 10', () => {
    const tooShort = validateGenerationInput({ ...base, duration: 2 })
    const tooLong = validateGenerationInput({ ...base, duration: 11 })
    expect(tooShort).toEqual(
      expect.arrayContaining([expect.stringMatching(/duration/i)]),
    )
    expect(tooLong).toEqual(
      expect.arrayContaining([expect.stringMatching(/duration/i)]),
    )
  })

  it('rejects resolutions other than 480p or 720p', () => {
    const errors = validateGenerationInput({ ...base, resolution: '1080p' })
    expect(errors).toEqual(
      expect.arrayContaining([expect.stringMatching(/resolution/i)]),
    )
    expect(ALLOWED_RESOLUTIONS.has('480p')).toBe(true)
    expect(ALLOWED_RESOLUTIONS.has('720p')).toBe(true)
  })

  it('rejects qualities other than medium or high', () => {
    const errors = validateGenerationInput({ ...base, quality: 'ultra' })
    expect(errors).toEqual(
      expect.arrayContaining([expect.stringMatching(/quality/i)]),
    )
    expect(ALLOWED_QUALITIES.has('medium')).toBe(true)
    expect(ALLOWED_QUALITIES.has('high')).toBe(true)
  })
})
