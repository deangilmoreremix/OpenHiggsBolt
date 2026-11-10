// @vitest-environment jsdom
import React, { act } from 'react'
import { describe, it, expect, afterEach, beforeAll } from 'vitest'
import { createRoot } from 'react-dom/client'
import { StyledBusinessImage } from '../StyledBusinessImage'
import { HEADSHOT_DEFAULT, ORIGINAL_STYLE, ROUNDED_RECT_DEFAULT, type ImageStyle } from '../imageStyle'

beforeAll(() => { (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true })
const mounted: { root: ReturnType<typeof createRoot>; el: HTMLElement }[] = []
function mount(style: ImageStyle, over: Partial<React.ComponentProps<typeof StyledBusinessImage>> = {}) {
  const el = document.createElement('div'); document.body.appendChild(el)
  const root = createRoot(el); mounted.push({ root, el })
  act(() => {
    root.render(<StyledBusinessImage src="https://x/p.png" imageStyle={style} boxWidth={400} boxHeight={400} compHeight={1000}
      brand={{ primary: '#29d3f2', accent: '#ff8800' }} {...over} />)
  })
  return el
}
afterEach(() => { for (const { root, el } of mounted.splice(0)) { act(() => root.unmount()); el.remove() } })
const q = (el: HTMLElement, s: string) => el.querySelector(s) as HTMLElement | null

describe('StyledBusinessImage', () => {
  it('clips on the INNER element and puts the shadow on the OUTER wrapper so it is not clipped', () => {
    const el = mount({ ...ROUNDED_RECT_DEFAULT, borderWidth: 0.005 })
    const outer = q(el, '[data-styled-image="outer"]')!
    const clip = q(el, '[data-styled-image="clip"]')!
    expect(outer.style.boxShadow).toMatch(/rgba\(0,\s*0,\s*0,\s*0\.28\)/)
    expect(outer.style.overflow).toBe('') // never clips its own shadow
    expect(clip.style.overflow).toBe('hidden')
    expect(clip.style.boxShadow).toBe('')
    expect(clip.style.borderRadius).toBe(outer.style.borderRadius)
    expect(clip.style.borderRadius).toBe('48px') // 0.12 × 400
  })

  it('draws a brand-colour border on the clipped element, scaled from the composition height', () => {
    const el = mount({ ...ROUNDED_RECT_DEFAULT, borderWidth: 0.005, borderColor: 'brand-accent' })
    const clip = q(el, '[data-styled-image="clip"]')!
    expect(clip.style.border).toContain('5px solid')
    expect(clip.style.border).toMatch(/#ff8800|rgb\(255, 136, 0\)/)
    const small = mount({ ...ROUNDED_RECT_DEFAULT, borderWidth: 0.005 }, { factor: 0.25 })
    expect(q(small, '[data-styled-image="clip"]')!.style.border).toContain('1.25px solid')
  })

  it('contain: the frame hugs a wide picture (rounded corners on the picture, not the empty square)', () => {
    const el = mount(ROUNDED_RECT_DEFAULT, { aspect: 2 })
    const outer = q(el, '[data-styled-image="outer"]')!
    expect(outer.style.width).toBe('400px')
    expect(outer.style.height).toBe('200px')
    expect(outer.style.top).toBe('100px')
    const img = q(el, 'img')!
    expect(img.style.objectFit).toBe('contain') // never crops the subject
  })

  it('a headshot is a circle with cover fit and its crop focus', () => {
    const el = mount(HEADSHOT_DEFAULT)
    const outer = q(el, '[data-styled-image="outer"]')!
    expect(outer.style.borderRadius).toBe('50%')
    const img = q(el, 'img')!
    expect(img.style.objectFit).toBe('cover')
    expect(img.style.objectPosition).toBe('50% 35%')
  })

  it('an original/unstyled image renders as a plain contained image: no wrapper clip, no shadow', () => {
    const el = mount({ ...ORIGINAL_STYLE })
    expect(q(el, '[data-styled-image="plain"]')).toBeTruthy()
    expect(q(el, '[data-styled-image="clip"]')).toBeNull()
    expect(el.innerHTML).not.toMatch(/box-shadow|overflow: hidden|border-radius/)
    expect(q(el, 'img')!.style.objectFit).toBe('contain')
  })

  it('radius, border and shadow keep their proportions when the surface is scaled', () => {
    const full = mount(ROUNDED_RECT_DEFAULT, { boxWidth: 400, boxHeight: 400, factor: 1 })
    const half = mount(ROUNDED_RECT_DEFAULT, { boxWidth: 200, boxHeight: 200, factor: 0.5 })
    const r = (el: HTMLElement) => parseFloat(q(el, '[data-styled-image="clip"]')!.style.borderRadius)
    expect(r(full) / 400).toBeCloseTo(r(half) / 200, 6)
    const shadow = (el: HTMLElement) => q(el, '[data-styled-image="outer"]')!.style.boxShadow
    expect(shadow(half)).toContain('3px 9px') // half of 6px / 18px
  })

  it('uses the injected image renderer (Remotion Img in the composition)', () => {
    const Fake: React.FC<{ src: string; style?: React.CSSProperties }> = ({ src, style }) => <span data-fake={src} style={style} />
    const el = mount(ROUNDED_RECT_DEFAULT, { ImageComponent: Fake as never })
    expect(q(el, '[data-fake="https://x/p.png"]')).toBeTruthy()
    expect(q(el, 'img')).toBeNull()
  })

  it('a background fill sits behind a contained image', () => {
    const el = mount({ ...ROUNDED_RECT_DEFAULT, fill: '#ffffff' })
    expect(q(el, '[data-styled-image="clip"]')!.style.background).toMatch(/#ffffff|rgb\(255, 255, 255\)/)
  })
})

import { ImageCollage, SplitPanel } from '../StyledBusinessImage'
import { presetStyle } from '../imagePresets'

describe('preset rendering', () => {
  it('Product Spotlight: a glow BEHIND the image, the shadow on the outer wrapper', () => {
    const el = mount(presetStyle('product-spotlight'), { aspect: 1 })
    const glow = q(el, '[data-styled-image="spotlight"]')!
    expect(glow.style.background).toContain('radial-gradient')
    expect(glow.compareDocumentPosition(q(el, '[data-styled-image="outer"]')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy() // outer is after → drawn above
    expect(q(el, '[data-styled-image="outer"]')!.style.boxShadow).toMatch(/0\.38/) // medium
    expect(q(el, 'img')!.style.objectFit).toBe('contain') // the whole product
  })
  it('Polaroid: white frame with a thicker bottom, tilted, shadow on the outer wrapper', () => {
    const el = mount(presetStyle('polaroid'), { aspect: 1 })
    const outer = q(el, '[data-styled-image="outer"]')!
    const clip = q(el, '[data-styled-image="clip"]')!
    expect(outer.style.transform).toContain('rotate(-3deg)')
    expect(clip.style.background).toMatch(/#ffffff|rgb\(255, 255, 255\)/)
    const [top, , bottom] = clip.style.padding.split(' ').map(parseFloat)
    expect(bottom).toBeGreaterThan(top * 2.5)
    expect(outer.style.boxShadow).toMatch(/rgba/)
    expect(clip.style.boxShadow).toBe('')
  })
  it('Soft Masked Image: feathered mask, no border and no shadow', () => {
    const el = mount(presetStyle('soft-masked'), { aspect: 1.5 })
    const clip = q(el, '[data-styled-image="clip"]')!
    expect(clip.style.maskImage || clip.style.getPropertyValue('-webkit-mask-image')).toContain('radial-gradient')
    expect(clip.style.border).toBe('')
    expect(q(el, '[data-styled-image="outer"]')!.style.boxShadow).toBe('')
  })
  it('Cinematic Reveal: clip-path wipe and fade follow the progress prop', () => {
    const style = presetStyle('cinematic-reveal')
    const half = mount(style, { aspect: 1.5, revealProgress: 0.4, revealScale: 1.03 })
    expect(q(half, '[data-styled-image="clip"]')!.style.clipPath).toBe('inset(0 60% 0 0)')
    expect(q(half, '[data-styled-image="outer"]')!.style.opacity).toBe('0.4')
    expect(q(half, '[data-styled-image="outer"]')!.style.transform).toContain('scale(1.03)')
    const done = mount(style, { aspect: 1.5, revealProgress: 1 })
    expect(q(done, '[data-styled-image="clip"]')!.style.clipPath).toBe('inset(0 0% 0 0)')
  })
  it('Collage: one rounded tile per picture, never overlapping, each with its own shadow', () => {
    const el = document.createElement('div'); document.body.appendChild(el)
    const root = createRoot(el); mounted.push({ root, el })
    act(() => { root.render(<ImageCollage urls={['a', 'b', 'c']} imageStyle={presetStyle('multi-image-collage')} boxWidth={400} boxHeight={400} compHeight={1000} brand={{ primary: '#111', accent: '#222' }} />) })
    const tiles = Array.from(el.querySelectorAll('[data-styled-image="tile"]')) as HTMLElement[]
    expect(tiles).toHaveLength(3)
    const r = tiles.map((t) => ({ l: parseFloat(t.style.left), t: parseFloat(t.style.top), w: parseFloat(t.style.width), h: parseFloat(t.style.height) }))
    for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) {
      const ow = Math.min(r[i].l + r[i].w, r[j].l + r[j].w) - Math.max(r[i].l, r[j].l)
      const oh = Math.min(r[i].t + r[i].h, r[j].t + r[j].h) - Math.max(r[i].t, r[j].t)
      expect(ow > 0.01 && oh > 0.01).toBe(false)
    }
    expect(tiles.every((t) => t.style.boxShadow.includes('rgba'))).toBe(true)
    expect(el.querySelectorAll('img')).toHaveLength(3)
  })
  it('Split Screen: the panel fills exactly one half of the composition', () => {
    const cases: [('left' | 'right' | 'top' | 'bottom'), number[]][] = [['right', [960, 0, 960, 1080]], ['left', [0, 0, 960, 1080]], ['top', [0, 0, 1920, 540]], ['bottom', [0, 540, 1920, 540]]]
    for (const [side, [l, t, w, h]] of cases) {
      const el = document.createElement('div'); document.body.appendChild(el)
      const root = createRoot(el); mounted.push({ root, el })
      act(() => { root.render(<SplitPanel src="x" side={side} imageStyle={presetStyle('split-screen')} compWidth={1920} compHeight={1080} />) })
      const p = el.querySelector('[data-styled-image="split"]') as HTMLElement
      expect([parseFloat(p.style.left), parseFloat(p.style.top), parseFloat(p.style.width), parseFloat(p.style.height)], side).toEqual([l, t, w, h])
      expect((p.querySelector('img') as HTMLImageElement).style.objectFit).toBe('cover')
    }
  })
})
