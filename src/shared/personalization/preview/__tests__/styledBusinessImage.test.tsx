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
