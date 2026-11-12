import { describe, expect, it } from 'vitest'
import {
  addLayer, clampLayer, contrastRatio, createProject, designChecks, duplicateLayer, hitTest, isHighlighted, layerContains,
  makeImageLayer, makeShapeLayer, makeTextLayer, moveLayer, removeLayer, resizeLayer, rotationFromPointer, sanitizeProject,
  textLayout, toLayerSpace, updateLayer, wrapText, type Layer, type TextLayer,
} from '@/components/social-publishing/thumbnail/designer/model'

const P = createProject(1280, 720)
const measure = (text: string) => text.length * 10 // 10px per character

describe('layers: create, order, duplicate, remove', () => {
  it('adds layers on top and can reorder them', () => {
    let p = addLayer(P, makeTextLayer(P, 'headline'))
    p = addLayer(p, makeImageLayer(p, 'data:image/png;base64,AA==', 400, 600, 'subject'))
    p = addLayer(p, makeShapeLayer(p, 'arrow'))
    const [a, b, c] = p.layers.map((l) => l.id)
    expect(moveLayer(p, a, 'front').layers.map((l) => l.id)).toEqual([b, c, a])
    expect(moveLayer(p, c, 'back').layers.map((l) => l.id)).toEqual([c, a, b])
    expect(moveLayer(p, a, 'forward').layers.map((l) => l.id)).toEqual([b, a, c])
    expect(moveLayer(p, c, 'backward').layers.map((l) => l.id)).toEqual([a, c, b])
    expect(moveLayer(p, 'missing', 'front')).toBe(p)
  })

  it('duplicates just above the original, offset, unlocked, with a new id', () => {
    let p = addLayer(P, { ...makeTextLayer(P), locked: true })
    const { project, id } = duplicateLayer(p, p.layers[0].id)
    expect(project.layers).toHaveLength(2)
    expect(id).toBe(project.layers[1].id)
    expect(id).not.toBe(p.layers[0].id)
    expect(project.layers[1].locked).toBe(false)
    expect(project.layers[1].x).toBeGreaterThan(p.layers[0].x)
  })

  it('removes and updates by id without touching others', () => {
    let p = addLayer(addLayer(P, makeTextLayer(P)), makeShapeLayer(P, 'circle'))
    const [a, b] = p.layers.map((l) => l.id)
    p = updateLayer<TextLayer>(p, a, { text: 'HELLO', locked: true })
    expect((p.layers[0] as TextLayer).text).toBe('HELLO')
    expect(p.layers[0].locked).toBe(true)
    expect(removeLayer(p, a).layers.map((l) => l.id)).toEqual([b])
  })

  it('a placed logo goes in the top-right corner; a subject stands on the bottom edge', () => {
    const logo = makeImageLayer(P, 'x', 800, 200, 'logo')
    expect(logo.x + logo.w).toBeLessThan(P.width)
    expect(logo.y).toBeLessThan(P.height * 0.1)
    const subject = makeImageLayer(P, 'x', 800, 1200, 'subject')
    expect(subject.y + subject.h).toBe(P.height)
  })

  it('clamping keeps a layer reachable', () => {
    const t = { ...makeTextLayer(P), x: 5000, y: -900 }
    const c = clampLayer(P, t)
    expect(c.x + c.w / 2).toBeLessThanOrEqual(P.width)
    expect(c.y + c.h / 2).toBeGreaterThanOrEqual(0)
  })
})

describe('geometry', () => {
  const box = (over: Partial<Layer> = {}): Layer => ({ ...makeShapeLayer(P, 'rect'), x: 100, y: 100, w: 200, h: 100, ...over } as Layer)

  it('hit-tests rotated layers in their own space', () => {
    const l = box({ rotation: 90 }) // 200x100 box turned on its side: now 100 wide, 200 tall around centre (200,150)
    expect(layerContains(l, 200, 240)).toBe(true) // inside the tall extent
    expect(layerContains(l, 290, 150)).toBe(false) // inside the unrotated width, outside once rotated
    const q = toLayerSpace(l, 200, 240)
    expect(q.x).toBeCloseTo(90, 5)
    expect(q.y).toBeCloseTo(0, 5)
  })

  it('hitTest returns the top-most visible unlocked layer', () => {
    const a = box({ id: 'a' })
    const b = box({ id: 'b' })
    const p = { ...P, layers: [a, b] }
    expect(hitTest(p, 150, 150)?.id).toBe('b')
    expect(hitTest({ ...P, layers: [a, { ...b, locked: true }] }, 150, 150)?.id).toBe('a')
    expect(hitTest({ ...P, layers: [a, { ...b, hidden: true }] }, 150, 150)?.id).toBe('a')
    expect(hitTest(p, 1000, 600)).toBeNull()
  })

  it('resizes from a handle and keeps the opposite corner fixed', () => {
    const l = box()
    const r = resizeLayer(l, 'se', 50, 30)
    expect([r.x, r.y, r.w, r.h]).toEqual([100, 100, 250, 130])
    const nw = resizeLayer(l, 'nw', -40, -20)
    expect([nw.x + nw.w, nw.y + nw.h]).toEqual([300, 200]) // bottom-right unchanged
    expect([nw.w, nw.h]).toEqual([240, 120])
  })

  it('keeps the aspect ratio on corner drags and never goes below the minimum', () => {
    const l = box()
    const r = resizeLayer(l, 'se', 100, 0, { keepAspect: true })
    expect(r.w / r.h).toBeCloseTo(2, 1)
    expect(resizeLayer(l, 'e', -1000, 0).w).toBe(16)
  })
  it('keeps the aspect ratio when the minimum size clamps a keepAspect drag', () => {
    const l = { ...box(), w: 200, h: 100 }
    const r = resizeLayer(l, 'se', -190, 0, { keepAspect: true })
    expect(r.w / r.h).toBeCloseTo(2, 1)
    expect(Math.min(r.w, r.h)).toBeGreaterThanOrEqual(16)
  })

  it('resizing a rotated layer keeps the opposite corner fixed on screen', () => {
    const l = box({ rotation: 90 })
    const corner = (x: Layer) => {
      // top-left corner of the layer in canvas space
      const cx = x.x + x.w / 2
      const cy = x.y + x.h / 2
      const lx = -x.w / 2
      const ly = -x.h / 2
      const a = (x.rotation * Math.PI) / 180
      return [cx + lx * Math.cos(a) - ly * Math.sin(a), cy + lx * Math.sin(a) + ly * Math.cos(a)]
    }
    const before = corner(l)
    const r = resizeLayer(l, 'se', 0, 40) // drag along the screen y axis = the layer's own width axis when rotated 90
    const after = corner(r)
    expect(after[0]).toBeCloseTo(before[0], 0)
    expect(after[1]).toBeCloseTo(before[1], 0)
  })

  it('rotation follows the pointer and snaps', () => {
    const l = box() // centre (200,150)
    expect(rotationFromPointer(l, 200, 0)).toBeCloseTo(0, 5) // pointer straight above: no rotation
    expect(rotationFromPointer(l, 400, 150)).toBeCloseTo(90, 5)
    expect(rotationFromPointer(l, 400, 140, 15)).toBe(90)
  })
})

describe('text layout', () => {
  it('wraps to the box width, keeps explicit line breaks, and keeps a too-long word whole', () => {
    expect(wrapText('aaaa bbbb cccc', 90, 'f', measure)).toEqual(['aaaa bbbb', 'cccc'])
    expect(wrapText('one\ntwo', 1000, 'f', measure)).toEqual(['one', 'two'])
    expect(wrapText('supercalifragilistic', 50, 'f', measure)).toEqual(['supercalifragilistic'])
    expect(wrapText('a\n\nb', 100, 'f', measure)).toEqual(['a', '', 'b'])
  })

  it('computes height from lines and line height (plus the box padding)', () => {
    const t = { ...makeTextLayer(P), text: 'aaaa bbbb cccc', w: 90, fontSize: 40, lineHeight: 1.25 }
    const lay = textLayout(t, measure)
    expect(lay.lines).toHaveLength(2)
    expect(lay.height).toBe(100)
    expect(textLayout({ ...t, box: { color: '#000', padding: 10, radius: 0 } }, measure).height).toBeGreaterThan(100)
  })

  it('highlights words regardless of case and punctuation', () => {
    const t = { ...makeTextLayer(P), highlight: { words: ['free', 'Now!'], color: '#ff0' } }
    expect(isHighlighted(t, 'FREE,')).toBe(true)
    expect(isHighlighted(t, 'now')).toBe(true)
    expect(isHighlighted(t, 'later')).toBe(false)
  })
})

describe('design checks', () => {
  const textOn = (over: Partial<TextLayer>, bg = {}) => {
    const p = createProject(1280, 720, bg)
    return addLayer(p, { ...makeTextLayer(p), x: 100, y: 100, w: 600, h: 200, fontSize: 40, strokeWidth: 0, ...over })
  }
  it('computes WCAG contrast and ignores non-hex colours', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
    expect(contrastRatio('#fff', '#fff')).toBeCloseTo(1, 5)
    expect(contrastRatio('rgba(0,0,0,.5)', '#fff')).toBeNull()
  })
  it('warns about clipped text', () => {
    const w = designChecks(textOn({ text: 'word '.repeat(200), w: 300, h: 60 }), measure)
    expect(w.map((x) => x.id)).toContain('clipped-text')
  })
  it('warns about low contrast, but not when the text has an outline or a picture background', () => {
    expect(designChecks(textOn({ color: '#1e293b' }, { color: '#0f172a' }), measure).map((x) => x.id)).toContain('low-contrast')
    expect(designChecks(textOn({ color: '#1e293b', strokeWidth: 4 }, { color: '#0f172a' }), measure).map((x) => x.id)).not.toContain('low-contrast')
    expect(designChecks(textOn({ color: '#1e293b' }, { mode: 'image', imageSrc: 'x' }), measure).map((x) => x.id)).not.toContain('low-contrast')
    expect(designChecks(textOn({ color: '#ffffff' }, { color: '#0f172a' }), measure).map((x) => x.id)).not.toContain('low-contrast')
  })
  it('warns about text near the edge, overlapping text and too much text', () => {
    expect(designChecks(textOn({ x: 5, y: 5 }), measure).map((x) => x.id)).toContain('outside-safe-area')
    const p = textOn({})
    const two = addLayer(p, { ...makeTextLayer(p), x: 150, y: 150, w: 600, h: 200, text: 'second' })
    expect(designChecks(two, measure).map((x) => x.id)).toContain('crowded')
    expect(designChecks(textOn({ x: 100, y: 100, w: 400, h: 100 }), measure).map((x) => x.id)).not.toContain('crowded')
  })
})

describe('sanitizeProject', () => {
  it('accepts a valid project and fills missing background fields', () => {
    const p = addLayer(createProject(1280, 720), makeTextLayer(P))
    const back = sanitizeProject(JSON.parse(JSON.stringify({ ...p, background: { mode: 'solid', color: '#fff' } })))
    expect(back?.layers).toHaveLength(1)
    expect(back?.background.brightness).toBe(100)
  })
  it('rejects junk, wrong versions, absurd sizes and drops broken layers', () => {
    expect(sanitizeProject(null)).toBeNull()
    expect(sanitizeProject({ version: 2, width: 100, height: 100, background: {}, layers: [] })).toBeNull()
    expect(sanitizeProject({ version: 1, width: 99999, height: 100, background: {}, layers: [] })).toBeNull()
    const good = makeTextLayer(P, 'ok')
    const p = sanitizeProject({ version: 1, width: 1280, height: 720, background: {}, layers: [good, { id: 'b', kind: 'bogus' }, { kind: 'text' }] })
    expect(p?.layers.map((l) => l.id)).toEqual([good.id])
  })
  it('drops layers that lack the fields their kind needs (they would crash the renderer)', () => {
    const geo = { x: 1, y: 1, w: 1, h: 1 }
    const img = makeImageLayer(P, 'data:image/png;base64,AA==', 100, 100)
    const shape = makeShapeLayer(P, 'arrow')
    const text = makeTextLayer(P, 'hi')
    const bad = [
      { id: 'a', kind: 'text', ...geo },
      { ...text, id: 'a2', highlight: undefined },
      { ...img, id: 'b', src: undefined },
      { ...shape, id: 'c', shape: undefined },
    ]
    const p = sanitizeProject({ version: 1, width: 1280, height: 720, background: {}, layers: [...bad, text, img, shape] })
    expect(p?.layers.map((l) => l.id)).toEqual([text.id, img.id, shape.id])
  })
  it('drops layers with malformed base fields (name object, missing rotation, non-boolean locked, NaN geometry)', () => {
    const text = makeTextLayer(P, 'hi')
    const img = makeImageLayer(P, 'data:image/png;base64,AA==', 100, 100)
    const { rotation: _r, ...noRotation } = makeShapeLayer(P, 'rect')
    const bad = [
      { ...text, id: 'n', name: {} },
      { ...noRotation, id: 'r' },
      { ...text, id: 'l', locked: 'no' },
      { ...text, id: 'h', hidden: 1 },
      { ...img, id: 'g', x: NaN },
      { ...img, id: 'o', opacity: 'x' },
      { ...img, id: 'k', kind: 'bogus' },
    ]
    const p = sanitizeProject({ version: 1, width: 1280, height: 720, background: {}, layers: [...bad, text, img] })
    expect(p?.layers.map((l) => l.id)).toEqual([text.id, img.id])
  })
})
