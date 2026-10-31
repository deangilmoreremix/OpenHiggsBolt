import { describe, it, expect, beforeEach } from 'vitest'
import {
  applyDesignTemplate,
  createDefaultPreviewSettings,
  applyLayoutPreset,
  normalizePreviewSettings,
  removeDesignLayer,
  resetLayoutToDefaults,
  resetPreviewDesign,
} from '../../preview/presets'
import {
  __resetRemotionDesignRegistry,
  registerRemotionDesignTemplate,
} from '../registry'
import type { RemotionDesignComponent, RemotionDesignTemplate } from '../types'
import type { PreviewLayer } from '../../preview/types'

const Design: RemotionDesignComponent = () => null

function makeTemplate(overrides: Partial<RemotionDesignTemplate> = {}): RemotionDesignTemplate {
  return {
    id: 'demo-design',
    name: 'Demo design',
    description: 'A design used by the applyDesignTemplate tests.',
    category: 'animated-headline',
    source: {
      repository: 'example/repo',
      repositoryUrl: 'https://example.com/example/repo',
      sourcePath: 'src/Design.tsx',
      license: 'MIT',
      attribution: 'Example attribution',
    },
    component: Design,
    defaultProps: {},
    textSlots: [
      { key: 'headline', field: 'headline', label: 'Headline', primary: true },
      { key: 'business', field: 'businessName', label: 'Business name' },
    ],
    colors: [{ role: 'primary', label: 'Primary' }],
    media: [{ role: 'logo', label: 'Logo', required: true }],
    animation: { durationInFrames: 30, delayInFrames: 5, easing: 'ease-out cubic' },
    placement: { x: 0.4, y: 0.3, scale: 0.8, opacity: 0.9, animation: 'slide-up' },
    aspectRatios: ['16:9', '1:1'],
    requiredMedia: ['logo'],
    capabilities: { preview: true, browserExport: true },
    previewCompatible: true,
    ...overrides,
  }
}

/** The design layer applied on top of the layout layers. */
function designOf(settings: { layers: PreviewLayer[] }): PreviewLayer {
  const layer = settings.layers.find((entry) => entry.kind === 'design')
  if (!layer) throw new Error('no design layer')
  return layer
}

const SEED = {
  businessName: 'Acme Roofing',
  headline: 'The friendly neighborhood roofers',
  logoUrl: 'https://cdn.example.com/logo.png',
}

describe('applyDesignTemplate', () => {
  beforeEach(() => {
    __resetRemotionDesignRegistry()
  })

  it('adds a single design layer on top of the layout layers', () => {
    registerRemotionDesignTemplate(makeTemplate())
    const settings = createDefaultPreviewSettings()

    const next = applyDesignTemplate(settings, 'demo-design', SEED)

    expect(next.layers.map((layer) => layer.kind)).toEqual(['logo', 'businessName', 'headline', 'design'])
    const design = next.layers[next.layers.length - 1]
    expect(design.designId).toBe('demo-design')
    expect(design.id).toBe('design')
  })

  it('replaces a previously applied design instead of stacking two', () => {
    registerRemotionDesignTemplate(makeTemplate())
    registerRemotionDesignTemplate(makeTemplate({ id: 'other-design', name: 'Other design' }))
    const first = applyDesignTemplate(createDefaultPreviewSettings(), 'demo-design', SEED)

    const next = applyDesignTemplate(first, 'other-design', SEED)

    const designs = next.layers.filter((layer) => layer.kind === 'design')
    expect(designs).toHaveLength(1)
    expect(designs[0].designId).toBe('other-design')
    expect(next.layers.filter((layer) => layer.kind !== 'design')).toHaveLength(3)
  })

  it('applies the design placement, animation timing and opacity', () => {
    registerRemotionDesignTemplate(makeTemplate())
    const next = applyDesignTemplate(createDefaultPreviewSettings(), 'demo-design', SEED)

    const layer = designOf(next)
    expect(layer.x).toBe(0.4)
    expect(layer.y).toBe(0.3)
    expect(layer.scale).toBe(0.8)
    expect(layer.opacity).toBe(0.9)
    expect(layer.animation).toBe('slide-up')
    expect(layer.animationDelay).toBe(5)
    expect(layer.visible).toBe(true)
  })

  it('carries the design text and image slots on the layer', () => {
    registerRemotionDesignTemplate(makeTemplate())
    const next = applyDesignTemplate(createDefaultPreviewSettings(), 'demo-design', SEED)

    const layer = designOf(next)
    expect(layer.text).toBe('The friendly neighborhood roofers')
    expect(layer.imageUrl).toBe('https://cdn.example.com/logo.png')
  })

  it('sets remotionDesignId', () => {
    registerRemotionDesignTemplate(makeTemplate())
    const next = applyDesignTemplate(createDefaultPreviewSettings(), 'demo-design', SEED)
    expect(next.remotionDesignId).toBe('demo-design')
  })

  it('preserves brand colours, aspect ratio, fps, duration, layout and audio', () => {
    registerRemotionDesignTemplate(makeTemplate())
    const settings = createDefaultPreviewSettings({
      layout: 'special-offer',
      brandColors: {
        primary: '#111111',
        accent: '#222222',
        text: '#333333',
        backgroundDim: 0.4,
      },
      aspectRatio: '4:5',
      fps: 24,
      durationInFrames: 90,
      audio: { url: 'https://cdn.example.com/track.mp3', name: 'Track' },
    })

    const next = applyDesignTemplate(settings, 'demo-design', SEED)

    expect(next.brandColors).toEqual(settings.brandColors)
    expect(next.aspectRatio).toBe('4:5')
    expect(next.fps).toBe(24)
    expect(next.durationInFrames).toBe(90)
    expect(next.layout).toBe('special-offer')
    expect(next.audio).toEqual(settings.audio)
    expect(next.width).toBe(settings.width)
    expect(next.height).toBe(settings.height)
  })

  it('is idempotent', () => {
    registerRemotionDesignTemplate(makeTemplate())
    const settings = createDefaultPreviewSettings()

    const first = applyDesignTemplate(settings, 'demo-design', SEED)
    const second = applyDesignTemplate(first, 'demo-design', SEED)

    expect(second).toEqual(first)
  })

  it('keeps the text the customer typed when the design is re-applied', () => {
    registerRemotionDesignTemplate(makeTemplate())
    const first = applyDesignTemplate(createDefaultPreviewSettings(), 'demo-design', SEED)
    const typed = {
      ...first,
      layers: first.layers.map((layer) => ({ ...layer, text: 'Typed by the customer' })),
    }

    const second = applyDesignTemplate(typed, 'demo-design', SEED)

    expect(designOf(second).text).toBe('Typed by the customer')
  })

  it('keeps the per-slot overrides when the same design is re-applied', () => {
    registerRemotionDesignTemplate(makeTemplate())
    const first = applyDesignTemplate(createDefaultPreviewSettings(), 'demo-design', SEED)
    const edited = {
      ...first,
      layers: first.layers.map((layer) => ({
        ...layer,
        textSlotOverrides: { business: 'Edited business name' },
      })),
    }

    const second = applyDesignTemplate(edited, 'demo-design', SEED)

    expect(designOf(second).textSlotOverrides).toEqual({
      business: 'Edited business name',
    })
  })

  it('drops the per-slot overrides when a DIFFERENT design is applied', () => {
    registerRemotionDesignTemplate(makeTemplate())
    registerRemotionDesignTemplate(makeTemplate({ id: 'other-design' }))
    const first = applyDesignTemplate(createDefaultPreviewSettings(), 'demo-design', SEED)
    const edited = {
      ...first,
      layers: first.layers.map((layer) => ({
        ...layer,
        textSlotOverrides: { business: 'Edited business name' },
      })),
    }

    const second = applyDesignTemplate(edited, 'other-design', SEED)

    expect(designOf(second).designId).toBe('other-design')
    expect(designOf(second).textSlotOverrides).toBeUndefined()
  })

  it('is a no-op for an unknown design id', () => {
    const settings = createDefaultPreviewSettings()
    const next = applyDesignTemplate(settings, 'not-a-design', SEED)

    expect(next).toBe(settings)
    expect(next.layers.map((layer) => layer.kind)).toEqual(['logo', 'businessName', 'headline'])
    expect(next.remotionDesignId).toBeNull()
  })

  it('does not mutate the settings it was given', () => {
    registerRemotionDesignTemplate(makeTemplate())
    const settings = createDefaultPreviewSettings()
    const snapshot = JSON.parse(JSON.stringify(settings))

    applyDesignTemplate(settings, 'demo-design', SEED)

    expect(JSON.parse(JSON.stringify(settings))).toEqual(snapshot)
  })
})

describe('stacking designs on layouts', () => {
  beforeEach(() => {
    __resetRemotionDesignRegistry()
  })

  it('keeps the applied design, and its edits, when the layout changes', () => {
    registerRemotionDesignTemplate(makeTemplate())
    const applied = applyDesignTemplate(createDefaultPreviewSettings(), 'demo-design', SEED)
    const edited = {
      ...applied,
      layers: applied.layers.map((layer) => (layer.kind === 'design' ? { ...layer, text: 'Typed', x: 0.2 } : layer)),
    }

    const next = applyLayoutPreset(edited, 'service-promotion', SEED)

    expect(next.layout).toBe('service-promotion')
    expect(next.remotionDesignId).toBe('demo-design')
    expect(next.layers.map((layer) => layer.kind)).toEqual(['logo', 'serviceImage', 'headline', 'tagline', 'design'])
    const design = next.layers.find((layer) => layer.kind === 'design')
    expect(design?.text).toBe('Typed')
    expect(design?.x).toBe(0.2)
  })

  it('restores the design placement but keeps its text on "Restore default layout"', () => {
    registerRemotionDesignTemplate(makeTemplate())
    const applied = applyDesignTemplate(createDefaultPreviewSettings(), 'demo-design', SEED)
    const moved = {
      ...applied,
      layers: applied.layers.map((layer) => (layer.kind === 'design' ? { ...layer, text: 'Typed', x: 0.9 } : layer)),
    }

    const reset = resetLayoutToDefaults(moved, moved.layout, SEED)

    expect(reset.remotionDesignId).toBe('demo-design')
    const design = reset.layers.find((layer) => layer.kind === 'design')
    expect(design?.x).toBe(0.4)
    expect(design?.text).toBe('Typed')
    expect(reset.layers.filter((layer) => layer.kind !== 'design')).toHaveLength(3)
  })

  it('removeDesignLayer drops only the design and keeps the layout layers', () => {
    registerRemotionDesignTemplate(makeTemplate())
    const applied = applyDesignTemplate(createDefaultPreviewSettings(), 'demo-design', SEED)

    const next = removeDesignLayer(applied)

    expect(next.remotionDesignId).toBeNull()
    expect(next.layers.map((layer) => layer.kind)).toEqual(['logo', 'businessName', 'headline'])
    expect(applied.layers).toHaveLength(4)
  })

  it('a legacy design-only project gains layout layers when a layout is picked', () => {
    registerRemotionDesignTemplate(makeTemplate())
    const legacy = normalizePreviewSettings({
      ...createDefaultPreviewSettings(),
      layers: [{ id: 'design', kind: 'design', designId: 'demo-design', visible: true, x: 0.4, y: 0.3, scale: 0.8, animation: 'fade', animationDelay: 0, startFrame: 0, opacity: 1 }],
      remotionDesignId: 'demo-design',
    })

    const next = applyLayoutPreset(legacy, 'special-offer', SEED)

    expect(next.layers.map((layer) => layer.kind)).toEqual(['headline', 'offer', 'cta', 'design'])
  })
})

describe('resetPreviewDesign', () => {
  beforeEach(() => {
    __resetRemotionDesignRegistry()
  })

  it('clears remotionDesignId and restores the default layout', () => {
    registerRemotionDesignTemplate(makeTemplate())
    const applied = applyDesignTemplate(createDefaultPreviewSettings(), 'demo-design', SEED)
    expect(applied.remotionDesignId).toBe('demo-design')

    const reset = resetPreviewDesign(applied, SEED)

    expect(reset.remotionDesignId).toBeNull()
    expect(reset.layout).toBe('business-introduction')
    expect(reset.layers.map((layer) => layer.kind)).toEqual([
      'logo',
      'businessName',
      'headline',
    ])
    expect(reset.layers.some((layer) => layer.kind === 'design')).toBe(false)
  })

  it('keeps the brand colours and the composition settings', () => {
    registerRemotionDesignTemplate(makeTemplate())
    const settings = createDefaultPreviewSettings({
      brandColors: {
        primary: '#111111',
        accent: '#222222',
        text: '#333333',
        backgroundDim: 0.4,
      },
      aspectRatio: '9:16',
      fps: 24,
      durationInFrames: 90,
    })
    const applied = applyDesignTemplate(settings, 'demo-design', SEED)

    const reset = resetPreviewDesign(applied, SEED)

    expect(reset.brandColors).toEqual(settings.brandColors)
    expect(reset.aspectRatio).toBe('9:16')
    expect(reset.fps).toBe(24)
    expect(reset.durationInFrames).toBe(90)
  })
})

describe('normalizePreviewSettings with designs', () => {
  beforeEach(() => {
    __resetRemotionDesignRegistry()
  })

  it('round-trips remotionDesignId and a design layer with its designId', () => {
    const normalized = normalizePreviewSettings({
      remotionDesignId: 'demo-design',
      layers: [
        {
          id: 'design',
          kind: 'design',
          designId: 'demo-design',
          visible: true,
          x: 0.5,
          y: 0.5,
          scale: 1,
          opacity: 1,
          animation: 'fade',
          animationDelay: 0,
          startFrame: 0,
          text: 'A headline',
        },
      ],
    })

    expect(normalized.remotionDesignId).toBe('demo-design')
    expect(normalized.layers).toHaveLength(1)
    expect(normalized.layers[0].kind).toBe('design')
    expect(normalized.layers[0].designId).toBe('demo-design')
    expect(normalized.layers[0].text).toBe('A headline')
  })

  it('falls back to null when the persisted settings carry no design', () => {
    const normalized = normalizePreviewSettings({
      layout: 'special-offer',
      layers: [{ id: 'cta', kind: 'cta', text: 'Book now' }],
    })

    expect(normalized.remotionDesignId).toBeNull()
    expect(normalized.layout).toBe('special-offer')
    expect(normalized.layers.map((layer) => layer.kind)).toEqual(['cta'])
  })

  it('round-trips the per-slot text overrides of a design layer', () => {
    const normalized = normalizePreviewSettings({
      remotionDesignId: 'demo-design',
      layers: [
        {
          id: 'design',
          kind: 'design',
          designId: 'demo-design',
          visible: true,
          x: 0.5,
          y: 0.5,
          scale: 1,
          opacity: 1,
          animation: 'fade',
          animationDelay: 0,
          startFrame: 0,
          text: 'A headline',
          textSlotOverrides: { business: 'Edited business name' },
        },
      ],
    })

    expect(normalized.layers[0].textSlotOverrides).toEqual({
      business: 'Edited business name',
    })
  })

  it('drops the malformed per-slot text overrides on reload', () => {
    const normalized = normalizePreviewSettings({
      remotionDesignId: 'demo-design',
      layers: [
        {
          id: 'design',
          kind: 'design',
          designId: 'demo-design',
          visible: true,
          x: 0.5,
          y: 0.5,
          scale: 1,
          opacity: 1,
          animation: 'fade',
          animationDelay: 0,
          startFrame: 0,
          textSlotOverrides: { business: 42, offer: 'Kept' },
        },
      ],
    })

    expect(normalized.layers[0].textSlotOverrides).toEqual({ offer: 'Kept' })
  })

  it('drops an empty per-slot override map on reload', () => {
    const normalized = normalizePreviewSettings({
      remotionDesignId: 'demo-design',
      layers: [
        {
          id: 'design',
          kind: 'design',
          designId: 'demo-design',
          visible: true,
          x: 0.5,
          y: 0.5,
          scale: 1,
          opacity: 1,
          animation: 'fade',
          animationDelay: 0,
          startFrame: 0,
          textSlotOverrides: {},
        },
      ],
    })

    expect(normalized.layers[0].textSlotOverrides).toBeUndefined()
  })
})
