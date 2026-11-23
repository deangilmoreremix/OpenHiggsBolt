/**
 * A small animated-GIF encoder (GIF89a, looping, one fixed 256-colour palette) so storyboard panels can be
 * exported as a GIF without a dependency. Colours are reduced to 3 bits red, 3 green, 2 blue with an ordered
 * dither: plenty for storyboard previews, not for photographs.
 */

export interface GifFrame {
  /** RGBA pixels, width * height * 4 */
  data: Uint8ClampedArray | Uint8Array
  /** How long the frame stays up. */
  delayMs: number
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]

/** 3-3-2 palette index of a pixel, nudged by a 4x4 ordered-dither threshold. */
function paletteIndex(r: number, g: number, b: number, x: number, y: number): number {
  const t = (BAYER[(y & 3) * 4 + (x & 3)] - 7.5) * 2
  const rq = Math.min(7, Math.max(0, Math.round(((r + t) / 255) * 7)))
  const gq = Math.min(7, Math.max(0, Math.round(((g + t) / 255) * 7)))
  const bq = Math.min(3, Math.max(0, Math.round(((b + t) / 255) * 3)))
  return (rq << 5) | (gq << 2) | bq
}

/** GIF's variable-width LZW, 8-bit symbols. Returns the packed code stream. */
export function lzwEncode(indices: Uint8Array): Uint8Array {
  const minCodeSize = 8
  const clear = 1 << minCodeSize
  const end = clear + 1
  const out: number[] = []
  let bitBuffer = 0
  let bitCount = 0
  let codeSize = minCodeSize + 1
  let nextCode = end + 1
  let dict = new Map<number, number>()

  const emit = (code: number) => {
    bitBuffer |= code << bitCount
    bitCount += codeSize
    while (bitCount >= 8) {
      out.push(bitBuffer & 0xff)
      bitBuffer >>>= 8
      bitCount -= 8
    }
  }

  emit(clear)
  let prefix = indices[0]
  for (let i = 1; i < indices.length; i++) {
    const byte = indices[i]
    const key = (prefix << 8) | byte
    const found = dict.get(key)
    if (found !== undefined) {
      prefix = found
      continue
    }
    emit(prefix)
    if (nextCode < 4096) {
      dict.set(key, nextCode++)
      if (nextCode - 1 === 1 << codeSize && codeSize < 12) codeSize++
    } else {
      emit(clear)
      dict = new Map()
      codeSize = minCodeSize + 1
      nextCode = end + 1
    }
    prefix = byte
  }
  emit(prefix)
  emit(end)
  if (bitCount > 0) out.push(bitBuffer & 0xff)
  return Uint8Array.from(out)
}

export function encodeGif(frames: GifFrame[], width: number, height: number): Uint8Array {
  if (!frames.length) throw new Error('A GIF needs at least one frame')
  if (width < 1 || height < 1 || width > 0xffff || height > 0xffff) throw new Error('Bad GIF size')
  const bytes: number[] = []
  const word = (n: number) => bytes.push(n & 0xff, (n >> 8) & 0xff)

  for (const c of 'GIF89a') bytes.push(c.charCodeAt(0))
  word(width)
  word(height)
  bytes.push(0xf7, 0, 0) // global palette of 256 colours, background 0, square pixels
  for (let i = 0; i < 256; i++) {
    bytes.push(Math.round(((i >> 5) * 255) / 7), Math.round((((i >> 2) & 7) * 255) / 7), Math.round(((i & 3) * 255) / 3))
  }
  bytes.push(0x21, 0xff, 0x0b) // application extension: loop forever
  for (const c of 'NETSCAPE2.0') bytes.push(c.charCodeAt(0))
  bytes.push(0x03, 0x01, 0x00, 0x00, 0x00)

  for (const frame of frames) {
    if (frame.data.length !== width * height * 4) throw new Error('A frame does not match the GIF size')
    const indices = new Uint8Array(width * height)
    for (let y = 0, p = 0; y < height; y++) {
      for (let x = 0; x < width; x++, p++) {
        indices[p] = paletteIndex(frame.data[p * 4], frame.data[p * 4 + 1], frame.data[p * 4 + 2], x, y)
      }
    }
    bytes.push(0x21, 0xf9, 0x04, 0x00) // graphic control: no transparency, no disposal
    word(Math.max(2, Math.round(frame.delayMs / 10)))
    bytes.push(0x00, 0x00)
    bytes.push(0x2c)
    word(0)
    word(0)
    word(width)
    word(height)
    bytes.push(0x00, 8) // no local palette, LZW minimum code size 8
    const packed = lzwEncode(indices)
    for (let i = 0; i < packed.length; i += 255) {
      const chunk = packed.subarray(i, i + 255)
      bytes.push(chunk.length)
      for (const b of chunk) bytes.push(b)
    }
    bytes.push(0x00)
  }
  bytes.push(0x3b)
  return Uint8Array.from(bytes)
}
