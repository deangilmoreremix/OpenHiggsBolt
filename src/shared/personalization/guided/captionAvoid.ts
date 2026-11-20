import { captionRect, clearCaptionOffset, coveredBy, type CaptionBand, type Clearance, type Rect } from '../captions/captionClearance'
import { layerBlockers } from '../captions/captionBlockers'
import { displayScale } from '../captions/scripts'
import type { CaptionSettings } from '../preview/captions'
import type { PersonalizationPreviewSettings, PreviewInputProps } from '../preview/types'

/** What the captions would cover on this frame: the caption band and the layers that are on screen while a caption is. Null without captions. */
export interface CaptionAvoid { band: CaptionBand; blockers: Rect[] }

export function captionAvoid(
  settings: Pick<PersonalizationPreviewSettings, 'layers' | 'width' | 'height' | 'fps'> & { captions?: CaptionSettings },
  brand: PreviewInputProps['brand'] | undefined,
): CaptionAvoid | null {
  const c = settings.captions
  if (!c || !c.enabled || c.cues.length === 0) return null
  const w = settings.width || 1920, h = settings.height || 1080, fps = settings.fps > 0 ? settings.fps : 30
  const longest = c.cues.reduce((a, x) => (x.text.length > a.text.length ? x : a), c.cues[0])
  const band: CaptionBand = {
    position: c.style.position,
    offsetY: c.style.offsetY,
    size: c.style.size * displayScale(c.language, longest.text),
    edge: 0.07, // the layer keeps its top and bottom lines 7 % in from the edge
    aspect: w / h,
    chars: longest.text.length,
    box: c.style.box,
  }
  const windows = c.cues.map((x) => ({ startFrame: Math.floor(x.start * fps), endFrame: Math.ceil(x.end * fps) }))
  const blockers = brand && settings.layers ? layerBlockers(settings.layers, brand, w, h, windows) : []
  return { band, blockers }
}

/** The captions' offset moved clear of the layers, or as it is when it already is clear (or cannot be). */
export const clearOf = (a: CaptionAvoid): Clearance => clearCaptionOffset(a.band, a.blockers)
export const coveredNow = (a: CaptionAvoid): number => coveredBy(a.band, a.blockers).length
export { captionRect }
