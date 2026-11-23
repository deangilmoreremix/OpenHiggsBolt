import { describe, it, expect } from 'vitest'
import { encodeGif, lzwEncode } from '../gifEncoder'

/** Reference GIF LZW decoder, so the encoder is checked by a round trip. */
function lzwDecode(data: Uint8Array, expectedLength: number): Uint8Array {
  const minCodeSize = 8
  const clear = 1 << minCodeSize
  const end = clear + 1
  const out: number[] = []
  let table: number[][] = []
  const reset = () => {
    table = []
    for (let i = 0; i < clear; i++) table.push([i])
    table.push([], [])
  }
  reset()
  let codeSize = minCodeSize + 1
  let bitBuffer = 0
  let bitCount = 0
  let pos = 0
  let prev: number[] | null = null
  while (out.length < expectedLength + 1) {
    while (bitCount < codeSize && pos < data.length) {
      bitBuffer |= data[pos++] << bitCount
      bitCount += 8
    }
    if (bitCount < codeSize) break
    const code = bitBuffer & ((1 << codeSize) - 1)
    bitBuffer >>>= codeSize
    bitCount -= codeSize
    if (code === clear) {
      reset()
      codeSize = minCodeSize + 1
      prev = null
      continue
    }
    if (code === end) break
    let entry: number[]
    if (code < table.length) entry = table[code]
    else if (prev) entry = [...prev, prev[0]]
    else throw new Error('bad code')
    out.push(...entry)
    if (prev) {
      table.push([...prev, entry[0]])
      if (table.length === 1 << codeSize && codeSize < 12) codeSize++
    }
    prev = entry
  }
  return Uint8Array.from(out.slice(0, expectedLength))
}

describe('lzwEncode', () => {
  it('round-trips flat, noisy and long inputs (including dictionary resets)', () => {
    const flat = new Uint8Array(5000).fill(7)
    let seed = 1
    const noise = Uint8Array.from({ length: 20000 }, () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) >> 16) & 0xff)
    const pattern = Uint8Array.from({ length: 30000 }, (_, i) => (i * 7 + (i >> 5)) & 0x3f)
    for (const input of [new Uint8Array([3]), new Uint8Array([1, 2, 3, 4]), flat, noise, pattern]) {
      expect(Array.from(lzwDecode(lzwEncode(input), input.length))).toEqual(Array.from(input))
    }
  })
})

describe('encodeGif', () => {
  const solid = (w: number, h: number, rgb: [number, number, number]) => {
    const data = new Uint8ClampedArray(w * h * 4)
    for (let i = 0; i < w * h; i++) data.set([...rgb, 255], i * 4)
    return data
  }

  it('writes a looping GIF89a with one image per frame and a trailer', () => {
    const gif = encodeGif([{ data: solid(4, 3, [255, 0, 0]), delayMs: 500 }, { data: solid(4, 3, [0, 0, 255]), delayMs: 1000 }], 4, 3)
    expect(String.fromCharCode(...gif.slice(0, 6))).toBe('GIF89a')
    expect(gif[6] | (gif[7] << 8)).toBe(4)
    expect(gif[8] | (gif[9] << 8)).toBe(3)
    expect(gif[gif.length - 1]).toBe(0x3b)
    expect(Array.from(gif).filter((b, i, a) => b === 0x2c && a[i - 1] === 0x00).length).toBeGreaterThanOrEqual(2)
    expect(new TextDecoder().decode(gif.slice(0, 800))).toContain('NETSCAPE2.0')
  })

  it('maps pure colours to the nearest palette entry', () => {
    const gif = encodeGif([{ data: solid(2, 2, [255, 0, 0]), delayMs: 100 }], 2, 2)
    const palette = (i: number) => gif.slice(13 + i * 3, 13 + i * 3 + 3)
    expect(Array.from(palette(0xe0))).toEqual([255, 0, 0])
    expect(Array.from(palette(0x03))).toEqual([0, 0, 255])
  })

  it('rejects a mismatched frame and an empty list', () => {
    expect(() => encodeGif([], 2, 2)).toThrow()
    expect(() => encodeGif([{ data: new Uint8ClampedArray(4), delayMs: 100 }], 2, 2)).toThrow()
  })
})
