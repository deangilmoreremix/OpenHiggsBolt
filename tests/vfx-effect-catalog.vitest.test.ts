import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  AI_EFFECTS,
  ALL_EFFECTS,
  EFFECT_NAMES,
  MOTION_CONTROLS,
  VFX_EFFECTS,
  VFX_HERO_IMAGE,
} from '../src/apps/vfx-studio/effectCatalog'
import { ALLOWED_EFFECTS, validateGenerationInput } from '../app/api/vfx/_validation'

const publicFile = (url: string) => join(process.cwd(), 'public', url)

describe('AI VFX effect catalogue', () => {
  it('has the reference studio\'s 64 AI effects, 47 motion controls and 9 VFX', () => {
    expect(AI_EFFECTS).toHaveLength(64)
    expect(MOTION_CONTROLS).toHaveLength(47)
    expect(VFX_EFFECTS).toHaveLength(9)
  })

  it('has unique ids and names, and puts each effect in its own category', () => {
    expect(new Set(ALL_EFFECTS.map((e) => e.id)).size).toBe(ALL_EFFECTS.length)
    expect(EFFECT_NAMES.size).toBe(ALL_EFFECTS.length)
    expect(AI_EFFECTS.every((e) => e.category === 'ai-effects')).toBe(true)
    expect(MOTION_CONTROLS.every((e) => e.category === 'motion-controls')).toBe(true)
    expect(VFX_EFFECTS.every((e) => e.category === 'vfx')).toBe(true)
  })

  it('ships a thumbnail file for every effect, and the banner picture', () => {
    for (const effect of ALL_EFFECTS) {
      expect(effect.preview, effect.name).toBeTruthy()
      expect(existsSync(publicFile(effect.preview as string)), `${effect.name} -> ${effect.preview}`).toBe(true)
    }
    expect(existsSync(publicFile(VFX_HERO_IMAGE))).toBe(true)
  })
})

describe('server allowlist', () => {
  it('is the catalogue: every card is accepted, invented names are not', () => {
    expect(ALLOWED_EFFECTS).toBe(EFFECT_NAMES)
    for (const effect of ALL_EFFECTS) {
      expect(validateGenerationInput({ image_url: 'https://x.test/a.png', effect: effect.name }), effect.name).toEqual([])
    }
    // Names an earlier hand-written list accepted but the effect API does not offer.
    for (const bad of ['Kiss Me AI', 'Ken Burns', 'Meteor Strike', 'Fire Effect']) {
      expect(validateGenerationInput({ image_url: 'https://x.test/a.png', effect: bad }), bad).toContain('A valid effect name is required')
    }
  })
})
