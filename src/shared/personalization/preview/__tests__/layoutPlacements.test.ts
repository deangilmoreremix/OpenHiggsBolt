import { describe, expect, it } from 'vitest'
import {
  LAYER_IDS_BY_LAYOUT,
  PREVIEW_LAYOUTS,
  applyLayoutPreset,
  createDefaultPreviewSettings,
  getCompositionDimensions,
  relayoutForAspect,
} from '../presets'
import { layerBoxMetrics, renderedLayerGeometry } from '../../guided/overlayGeometry'
import type { PreviewAspectRatio, PreviewLayer } from '../types'

// Typical seeded content: what Find your business fills in.
const SEED = {
  businessName: 'Acme Roofing Co',
  headline: 'Roofs that last a lifetime',
  tagline: 'Family owned since 1998',
  offer: '20% off this month',
  cta: 'Book a free quote',
  logoUrl: 'https://cdn.example.com/logo.png',
  productUrl: 'https://cdn.example.com/p.png',
  serviceUrl: 'https://cdn.example.com/s.png',
}

const TEXT_BY_KIND: Record<string, string> = {
  businessName: SEED.businessName,
  headline: SEED.headline,
  tagline: SEED.tagline,
  offer: SEED.offer,
  cta: SEED.cta,
}

function box(layer: PreviewLayer, w: number, h: number) {
  const withText = TEXT_BY_KIND[layer.kind] && layer.text === undefined ? { ...layer, text: TEXT_BY_KIND[layer.kind] } : layer
  const m = layerBoxMetrics(renderedLayerGeometry(withText, w, h), w, h)
  // The CTA is drawn as a pill: 0.4em padding above and below the text.
  const extra = layer.kind === 'cta' ? m.fontSizePx * 0.8 : 0
  return { left: m.leftPx, top: m.topPx, right: m.leftPx + m.widthPx, bottom: m.topPx + m.heightPx + extra }
}

const overlaps = (a: ReturnType<typeof box>, b: ReturnType<typeof box>) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

const ASPECTS: PreviewAspectRatio[] = ['16:9', '9:16', '1:1', '4:5']

describe('layout placements', () => {
  for (const layout of PREVIEW_LAYOUTS) {
    for (const aspect of ASPECTS) {
      it(`${layout.name} has no overlapping layers at ${aspect}`, () => {
        const { width, height } = getCompositionDimensions(aspect)
        const base = createDefaultPreviewSettings({ aspectRatio: aspect, layers: [] })
        const settings = applyLayoutPreset(base, layout.id, SEED)
        const layers = settings.layers.filter((layer) => layer.kind !== 'endCard')
        expect(layers.map((l) => l.kind)).toEqual(LAYER_IDS_BY_LAYOUT[layout.id].filter((k) => k !== 'endCard'))
        for (let i = 0; i < layers.length; i += 1) {
          for (let j = i + 1; j < layers.length; j += 1) {
            const a = box(layers[i], width, height)
            const b = box(layers[j], width, height)
            expect(overlaps(a, b), `${layers[i].kind} overlaps ${layers[j].kind}`).toBe(false)
          }
        }
      })
    }
  }

  it('moves untouched layers to the new shape and keeps moved ones', () => {
    const wide = applyLayoutPreset(createDefaultPreviewSettings({ layers: [] }), 'product-showcase', SEED)
    const moved = { ...wide, layers: wide.layers.map((l) => (l.kind === 'headline' ? { ...l, x: 0.4 } : l)) }
    const tall = { ...moved, aspectRatio: '9:16' as const, ...getCompositionDimensions('9:16') }

    const next = relayoutForAspect(moved, tall)

    expect(next.layers.find((l) => l.kind === 'productImage')?.y).toBe(0.33)
    expect(next.layers.find((l) => l.kind === 'headline')?.x).toBe(0.4)
  })
})
