import { describe, expect, it } from 'vitest'
import '../../templates/catalog'
import {
  applyDesignTemplate,
  createDefaultPreviewSettings,
  normalizePreviewSettings,
  removeDesignLayer,
  retimeScenes,
} from '../presets'

const SEED = { businessName: 'Acme Roofing', headline: 'Roofs that last', logoUrl: 'https://cdn.example.com/logo.png' }

describe('opening scene, on-screen design and closing scene together', () => {
  const base = createDefaultPreviewSettings({ durationInFrames: 450 })
  const all = applyDesignTemplate(
    applyDesignTemplate(applyDesignTemplate(base, 'scene-gradient-text-sweep', SEED, 'intro'), 'lower-third', SEED, 'overlay'),
    'scene-fireworks-burst',
    SEED,
    'outro',
  )

  it('keeps the layout, adds one layer per slot and draws scenes last', () => {
    expect(all.layers.map((layer) => layer.id)).toEqual(['logo', 'businessName', 'headline', 'design', 'design-intro', 'design-outro'])
    expect(all.remotionDesignId).toBe('lower-third')
    expect(all.remotionSceneIds).toEqual({ intro: 'scene-gradient-text-sweep', outro: 'scene-fireworks-burst' })
  })

  it('times the scenes at the start and the end, full screen', () => {
    const intro = all.layers.find((layer) => layer.id === 'design-intro')!
    const outro = all.layers.find((layer) => layer.id === 'design-outro')!
    expect(intro).toMatchObject({ startFrame: 0, endFrame: 109, scale: 1, x: 0.5, y: 0.5 })
    expect(outro).toMatchObject({ startFrame: 340, endFrame: 449, scale: 1 })
  })

  it('turns the branded end card off for a closing scene, and back on when it is removed', () => {
    expect(base.showEndCard).toBe(true)
    expect(all.showEndCard).toBe(false)
    const removed = removeDesignLayer(all, 'outro')
    expect(removed.showEndCard).toBe(true)
    expect(removed.layers.some((layer) => layer.id === 'design-outro')).toBe(false)
    expect(removed.layers.some((layer) => layer.id === 'design-intro')).toBe(true)
    expect(removed.remotionSceneIds).toEqual({ intro: 'scene-gradient-text-sweep', outro: null })
  })

  it('moves the closing scene to the new end when the video gets shorter', () => {
    const shorter = retimeScenes({ ...all, durationInFrames: 300 })
    expect(shorter.layers.find((layer) => layer.id === 'design-outro')).toMatchObject({ startFrame: 190, endFrame: 299 })
  })

  it('never lets a scene take more than half the video', () => {
    const tiny = applyDesignTemplate(createDefaultPreviewSettings({ durationInFrames: 60 }), 'scene-kinetic-text', SEED, 'intro')
    expect(tiny.layers.find((layer) => layer.id === 'design-intro')).toMatchObject({ startFrame: 0, endFrame: 29 })
  })

  it('survives a save and reload', () => {
    const restored = normalizePreviewSettings(JSON.parse(JSON.stringify(all)))
    expect(restored.remotionSceneIds).toEqual(all.remotionSceneIds)
    expect(restored.layers.find((layer) => layer.id === 'design-outro')).toMatchObject({ designId: 'scene-fireworks-burst', endFrame: 449 })
  })

  it('restores older projects with no scene ids', () => {
    const legacy = { ...all } as Record<string, unknown>
    delete legacy.remotionSceneIds
    expect(normalizePreviewSettings(legacy).remotionSceneIds).toEqual({ intro: null, outro: null })
  })
})
