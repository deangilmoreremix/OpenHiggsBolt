import { describe, it, expect } from 'vitest'
import { buildNanoBananaPrompt } from '../../src/lib/promptUtils.js'

describe('buildNanoBananaPrompt', () => {
  it('includes the camera, lens, focal length, and aperture labels in the result', () => {
    const prompt = buildNanoBananaPrompt(
      'A cat on a roof',
      'Sony A7 IV',
      '85mm prime',
      85,
      'f/1.8',
    )

    expect(prompt).toMatch(/Sony A7 IV/)
    expect(prompt).toMatch(/85mm prime/)
    expect(prompt).toMatch(/85mm/)
    expect(prompt).toMatch(/f\/1\.8/)
  })

  it('includes "cinematic lighting" by default', () => {
    const prompt = buildNanoBananaPrompt('A landscape', 'Canon R5', '24-70mm', 35, 'f/8')
    expect(prompt).toContain('cinematic lighting')
  })
})
