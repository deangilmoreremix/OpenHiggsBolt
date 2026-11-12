import { describe, expect, it } from 'vitest'
import { addLayer, createProject, makeImageLayer, makeShapeLayer, makeTextLayer, updateLayer, type TextLayer } from '@/components/social-publishing/thumbnail/designer/model'
import { renderProject } from '@/components/social-publishing/thumbnail/designer/render'
import { EXPORT_QUALITIES, encodeWithinBytes, type ExportFormat } from '@/components/social-publishing/thumbnail/designer/exportImage'

/** A 2D context that records every call and property write, with a fixed 10px-per-character text measure. */
function recorder() {
  const calls: { fn: string; args: any[]; state: Record<string, any> }[] = []
  const state: Record<string, any> = { filter: 'none' }
  const stack: Record<string, any>[] = []
  const ctx: any = new Proxy({}, {
    get(_t, key: string) {
      if (key === 'save') return () => { stack.push({ ...state }) }
      if (key === 'restore') return () => { const s = stack.pop(); if (s) { for (const k of Object.keys(state)) delete state[k]; Object.assign(state, s) } }
      if (key === 'measureText') return (t: string) => ({ width: t.length * 10 })
      if (key === 'createLinearGradient') return (...args: any[]) => { calls.push({ fn: key, args, state: { ...state } }); return { addColorStop: (...a: any[]) => calls.push({ fn: 'addColorStop', args: a, state: { ...state } }) } }
      if (key in state) return state[key]
      return (...args: any[]) => { calls.push({ fn: key, args, state: { ...state } }) }
    },
    set(_t, key: string, value) { state[key] = value; return true },
    has() { return true },
  })
  return { ctx: ctx as CanvasRenderingContext2D, calls, state }
}
const names = (calls: { fn: string }[]) => calls.map((c) => c.fn)

describe('renderProject: background', () => {
  it('fills a solid background', () => {
    const { ctx, calls } = recorder()
    renderProject(ctx, createProject(1280, 720, { mode: 'solid', color: '#123456' }), {})
    const fill = calls.find((c) => c.fn === 'fillRect')!
    expect(fill.state.fillStyle).toBe('#123456')
    expect(fill.args.slice(2)).toEqual([1284, 724])
  })
  it('paints a gradient across the canvas using the angle', () => {
    const { calls } = recorder()
    const r = recorder()
    renderProject(r.ctx, createProject(1000, 500, { mode: 'gradient', from: '#111111', to: '#eeeeee', angle: 0 }), {})
    const g = r.calls.find((c) => c.fn === 'createLinearGradient')!
    expect(g.args).toEqual([0, 250, 1000, 250]) // left to right across the middle
    expect(r.calls.filter((c) => c.fn === 'addColorStop').map((c) => c.args)).toEqual([[0, '#111111'], [1, '#eeeeee']])
    void calls
  })
  it('applies exact brightness, contrast, saturation and blur to the background only', () => {
    const { ctx, calls } = recorder()
    const p = addLayer(createProject(800, 400, { brightness: 120, contrast: 90, saturation: 130, blur: 6 }), makeShapeLayer(createProject(800, 400), 'rect'))
    renderProject(ctx, p, {})
    const bg = calls.find((c) => c.fn === 'fillRect')!
    expect(bg.state.filter).toBe('blur(6px) brightness(120%) contrast(90%) saturate(130%)')
    const shape = calls.find((c) => c.fn === 'fill')!
    expect(shape.state.filter).toBe('none') // restored before layers draw
  })
  it('draws a picture background to cover the canvas, centred', () => {
    const { ctx, calls } = recorder()
    const img = { naturalWidth: 400, naturalHeight: 400 } as any
    renderProject(ctx, createProject(800, 400, { mode: 'image', imageSrc: 'bg' }), { bg: img })
    const d = calls.find((c) => c.fn === 'drawImage')!
    expect(d.args.slice(1)).toEqual([0, -200, 800, 800])
  })
  it('skips a missing picture instead of failing', () => {
    const { ctx, calls } = recorder()
    expect(() => renderProject(ctx, createProject(800, 400, { mode: 'image', imageSrc: 'missing' }), {})).not.toThrow()
    expect(names(calls)).not.toContain('drawImage')
  })
})

describe('renderProject: layers', () => {
  it('draws layers bottom to top, skips hidden ones, and applies rotation and opacity', () => {
    const P = createProject(1280, 720)
    let p = addLayer(P, { ...makeShapeLayer(P, 'rect'), id: 'one', rotation: 30, opacity: 0.5 })
    p = addLayer(p, { ...makeShapeLayer(P, 'circle'), id: 'two', hidden: true })
    p = addLayer(p, { ...makeShapeLayer(P, 'badge'), id: 'three' })
    const { ctx, calls } = recorder()
    renderProject(ctx, p, {})
    const rotations = calls.filter((c) => c.fn === 'rotate').map((c) => c.args[0])
    expect(rotations).toHaveLength(3 - 1) // hidden layer not drawn
    expect(rotations[0]).toBeCloseTo((30 * Math.PI) / 180, 5)
    expect(calls.find((c) => c.fn === 'fill')!.state.globalAlpha).toBe(0.5) // set before the shape is drawn
    expect(names(calls)).not.toContain('ellipse')
  })

  it('draws text lines at the right place, wrapped to the box, with stroke before fill', () => {
    const P = createProject(1000, 500)
    const t: TextLayer = { ...makeTextLayer(P), x: 100, y: 50, w: 100, h: 200, text: 'aaaa bbbb cccc', fontSize: 40, lineHeight: 1, align: 'left', strokeWidth: 3, shadow: null }
    const { ctx, calls } = recorder()
    renderProject(ctx, addLayer(P, t), {})
    const fills = calls.filter((c) => c.fn === 'fillText').map((c) => c.args[0])
    expect(fills).toEqual(['aaaa', 'bbbb', 'cccc']) // 100px box = 10 chars at 10px: two words per line would need 9 chars + ... widths wrap per word here
    const firstStroke = calls.findIndex((c) => c.fn === 'strokeText')
    const firstFill = calls.findIndex((c) => c.fn === 'fillText')
    expect(firstStroke).toBeGreaterThanOrEqual(0)
    expect(firstStroke).toBeLessThan(firstFill)
  })

  it('aligns centred and right text inside the box', () => {
    const P = createProject(1000, 500)
    const base: TextLayer = { ...makeTextLayer(P), x: 0, y: 0, w: 200, h: 100, text: 'abcd', strokeWidth: 0, shadow: null }
    const xFor = (align: TextLayer['align']) => {
      const { ctx, calls } = recorder()
      renderProject(ctx, addLayer(P, { ...base, align }), {})
      return calls.find((c) => c.fn === 'fillText')!.args[1] as number
    }
    // text is 40px wide in a 200px box centred on the layer origin: left = -100, centre = -20, right = 60
    expect(xFor('left')).toBe(-100)
    expect(xFor('center')).toBe(-20)
    expect(xFor('right')).toBe(60)
  })

  it('colours highlighted words and draws each word separately', () => {
    const P = createProject(1000, 500)
    const t: TextLayer = { ...makeTextLayer(P), w: 500, h: 100, text: 'get it FREE now', strokeWidth: 0, shadow: null, color: '#ffffff', highlight: { words: ['free'], color: '#ffcc00' } }
    const { ctx, calls } = recorder()
    renderProject(ctx, addLayer(P, t), {})
    const words = calls.filter((c) => c.fn === 'fillText').map((c) => [c.args[0], c.state.fillStyle])
    expect(words).toEqual([['get', '#ffffff'], ['it', '#ffffff'], ['FREE', '#ffcc00'], ['now', '#ffffff']])
  })

  it('puts a filled box behind text and applies the shadow', () => {
    const P = createProject(1000, 500)
    const t: TextLayer = { ...makeTextLayer(P), w: 300, h: 100, text: 'hi', strokeWidth: 0, box: { color: '#ff0000', padding: 10, radius: 8 }, shadow: { color: 'rgba(0,0,0,.5)', blur: 9, offsetX: 1, offsetY: 2 } }
    const { ctx, calls } = recorder()
    renderProject(ctx, addLayer(P, t), {})
    expect(calls.find((c) => c.fn === 'fill')!.state.fillStyle).toBe('#ff0000')
    const text = calls.find((c) => c.fn === 'fillText')!
    expect(text.state.shadowBlur).toBe(9)
  })

  it('draws an image layer contained in its box, and a white outline as 8 offset copies', () => {
    const P = createProject(1000, 500)
    const img = { naturalWidth: 200, naturalHeight: 100 } as any
    const l = { ...makeImageLayer(P, 'p', 200, 100, 'subject'), w: 400, h: 400, outline: 'white' as const }
    const { ctx, calls } = recorder()
    renderProject(ctx, addLayer(P, l), { p: img })
    const draws = calls.filter((c) => c.fn === 'drawImage')
    expect(draws).toHaveLength(9) // 8 outline copies + the picture
    expect(draws[0].args.slice(1)).toEqual([-200, -100, 400, 200]) // contained, not stretched
    expect(draws[0].state.shadowColor).toBe('#ffffff')
    expect(draws[8].state.shadowColor).toBe('rgba(0,0,0,0)')
  })

  it('guides and selection are drawn only when asked for', () => {
    const P = addLayer(createProject(1000, 500), { ...makeShapeLayer(createProject(1000, 500), 'rect'), id: 'sel' })
    const plain = recorder()
    renderProject(plain.ctx, P, {})
    expect(names(plain.calls)).not.toContain('strokeRect')
    const guided = recorder()
    renderProject(guided.ctx, P, {}, { guides: true, selectedId: 'sel' })
    expect(guided.calls.filter((c) => c.fn === 'strokeRect')).toHaveLength(2) // safe area + selection
  })

  it('updateLayer changes show up in the next render', () => {
    const P = createProject(1000, 500)
    let p = addLayer(P, { ...makeTextLayer(P), id: 't', text: 'old', strokeWidth: 0, shadow: null })
    p = updateLayer<TextLayer>(p, 't', { text: 'new' })
    const { ctx, calls } = recorder()
    renderProject(ctx, p, {})
    expect(calls.find((c) => c.fn === 'fillText')!.args[0]).toBe('new')
  })
})

describe('encodeWithinBytes', () => {
  const sizes: Record<string, number> = { 'image/png': 3_000_000, 'image/jpeg:0.95': 2_600_000, 'image/jpeg:0.9': 2_100_000, 'image/jpeg:0.85': 1_900_000, 'image/jpeg:0.8': 1_500_000 }
  const encoder = (log: string[] = []) => async (type: ExportFormat, q?: number) => {
    const key = q === undefined ? type : `${type}:${q}`
    log.push(key)
    return new Blob([new Uint8Array(sizes[key] ?? 100)])
  }
  it('keeps a PNG that already fits', async () => {
    const r = await encodeWithinBytes(async () => new Blob([new Uint8Array(500)]), 'image/png', 2_000_000)
    expect(r).toMatchObject({ type: 'image/png' })
  })
  it('falls back to the best JPEG quality that fits the target', async () => {
    const log: string[] = []
    const r = await encodeWithinBytes(encoder(log), 'image/png', 2_000_000)
    expect(r).toMatchObject({ type: 'image/jpeg', quality: 0.85 })
    expect(log).toEqual(['image/png', 'image/jpeg:0.95', 'image/jpeg:0.9', 'image/jpeg:0.85'])
  })
  it('goes straight to JPEG when JPEG is wanted, and has no target by default', async () => {
    expect(await encodeWithinBytes(encoder(), 'image/jpeg', null)).toMatchObject({ type: 'image/jpeg', quality: EXPORT_QUALITIES[0] })
  })
  it('returns null when nothing fits (the caller scales down)', async () => {
    expect(await encodeWithinBytes(async () => new Blob([new Uint8Array(5_000_000)]), 'image/jpeg', 2_000_000)).toBeNull()
    expect(await encodeWithinBytes(async () => null, 'image/png', null)).toBeNull()
  })
})
