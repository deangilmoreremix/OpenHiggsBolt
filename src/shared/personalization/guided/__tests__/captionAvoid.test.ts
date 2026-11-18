import { describe, expect, it } from 'vitest'
import { captionAvoid, clearOf, coveredNow } from '../captionAvoid'
import { createDefaultPreviewSettings } from '../../preview/presets'
import { DEFAULT_CAPTION_STYLE, type CaptionSettings } from '../../preview/captions'
import type { PreviewLayer } from '../../preview/types'

const brand = { businessName: 'Rascop And Associates LLC', headline: 'Call us today', offer: '10% off', cta: 'Book now' } as never
const settings = (captions: CaptionSettings | undefined, layers: PreviewLayer[]) => ({ ...createDefaultPreviewSettings(), width: 1920, height: 1080, fps: 30, layers, captions })
const caps = (style: Record<string, unknown> = {}): CaptionSettings => ({ enabled: true, cues: [{ id: 'a', start: 0.5, end: 3, text: 'Call us today for a free quote' }], style: { ...DEFAULT_CAPTION_STYLE, ...style } as never })
const nameLayer = (y: number): PreviewLayer => ({ ...(createDefaultPreviewSettings().layers.find((l) => l.kind === 'businessName')!), visible: true, opacity: 1, startFrame: 0, endFrame: undefined, x: 0.05, y } as PreviewLayer)

describe('captionAvoid', () => {
  it('is null without captions, with captions off, and with no lines', () => {
    expect(captionAvoid(settings(undefined, []), brand)).toBeNull()
    expect(captionAvoid(settings({ ...caps(), enabled: false }, []), brand)).toBeNull()
    expect(captionAvoid(settings({ ...caps(), cues: [] }, []), brand)).toBeNull()
  })
  it('finds the layers the captions cover, and not the ones they do not', () => {
    const low = captionAvoid(settings(caps({ position: 'bottom', size: 0.08 }), [nameLayer(0.84)]), brand)!
    expect(coveredNow(low)).toBe(1)
    const high = captionAvoid(settings(caps({ position: 'bottom', size: 0.08 }), [nameLayer(0.1)]), brand)!
    expect(coveredNow(high)).toBe(0)
  })
  it('moves the captions clear of a layer they cover', () => {
    const a = captionAvoid(settings(caps({ position: 'bottom', size: 0.08 }), [nameLayer(0.84)]), brand)!
    const out = clearOf(a)
    expect(out.overlapped).toBe(true)
    expect(out.cleared).toBe(true)
    expect(coveredNow(captionAvoid(settings(caps({ position: 'bottom', size: 0.08, offsetY: out.offsetY }), [nameLayer(0.84)]), brand)!)).toBe(0)
  })
  it('counts nothing when there is no brand to read the layers\' text from', () => {
    expect(coveredNow(captionAvoid(settings(caps(), [nameLayer(0.84)]), undefined)!)).toBe(0)
  })
})
