/**
 * Cheap, deterministic checks on an image's pixels so the styler does not put a
 * second frame on a picture that already has one. Pure: it takes RGBA bytes (the
 * browser loader draws the image to a small canvas) and returns hints. It does
 * NOT understand content — only transparent corners and a uniform coloured ring.
 */
import type { ImageHints } from './imageStyle'

export interface PixelAnalysis extends Pick<ImageHints, 'transparentCorners' | 'alreadyFramed' | 'hasTransparency'> {
  /** Fraction of pixels that are (mostly) transparent. */
  transparentFraction: number
}

const lumaAt = (d: ArrayLike<number>, i: number) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]

export function analyzeImagePixels(data: ArrayLike<number>, width: number, height: number): PixelAnalysis {
  if (!(width > 2) || !(height > 2) || data.length < width * height * 4) {
    return { transparentCorners: false, alreadyFramed: false, hasTransparency: false, transparentFraction: 0 }
  }
  const at = (x: number, y: number) => (y * width + x) * 4

  let transparent = 0
  for (let i = 3; i < width * height * 4; i += 4) if (data[i] < 24) transparent++
  const transparentFraction = transparent / (width * height)

  // corners: a small patch at each of the four corners
  const patch = Math.max(1, Math.round(Math.min(width, height) * 0.03))
  const cornerTransparent = (cx: number, cy: number) => {
    let t = 0, n = 0
    for (let y = cy; y < cy + patch; y++) for (let x = cx; x < cx + patch; x++) { n++; if (data[at(x, y) + 3] < 24) t++ }
    return t / n > 0.85
  }
  const corners = [cornerTransparent(0, 0), cornerTransparent(width - patch, 0), cornerTransparent(0, height - patch), cornerTransparent(width - patch, height - patch)]
  const transparentCorners = corners.filter(Boolean).length >= 3

  // ring: outer band (2%) vs interior; a uniform, non-white, clearly different ring reads as a frame
  const band = Math.max(1, Math.round(Math.min(width, height) * 0.02))
  const ring: number[] = []
  const inner: number[] = []
  for (let y = 0; y < height; y += 2) for (let x = 0; x < width; x += 2) {
    const o = at(x, y)
    if (data[o + 3] < 200) continue
    const edge = x < band || y < band || x >= width - band || y >= height - band
    const deep = x >= width * 0.15 && x < width * 0.85 && y >= height * 0.15 && y < height * 0.85
    if (edge) ring.push(lumaAt(data, o)); else if (deep) inner.push(lumaAt(data, o))
  }
  let alreadyFramed = false
  if (ring.length > 20 && inner.length > 20) {
    const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length
    const rm = mean(ring)
    const rstd = Math.sqrt(ring.reduce((s, v) => s + (v - rm) ** 2, 0) / ring.length)
    const im = mean(inner)
    // plain white/near-white margins are common for product photos and are NOT a frame
    alreadyFramed = rstd < 6 && rm < 235 && Math.abs(rm - im) > 40
  }
  return { transparentCorners, alreadyFramed, hasTransparency: transparentFraction > 0.02, transparentFraction }
}
