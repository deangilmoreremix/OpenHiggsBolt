// @vitest-environment jsdom
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { CAPITE_CAPTION_STYLES } from '../../captions/capiteStyles'
import { capiteLook, captionPreset, type CaptionSettings } from '../captions'

let FRAME = 30
vi.mock('remotion', () => ({
  AbsoluteFill: ({ children, style, ...rest }: { children?: React.ReactNode; style?: React.CSSProperties }) => <div style={style} {...(rest as object)}>{children}</div>,
  useCurrentFrame: () => FRAME,
  useVideoConfig: () => ({ fps: 30, width: 1920, height: 1080, durationInFrames: 150 }),
}))

import { CaptionsLayer } from '../CaptionsLayer'

afterEach(() => { cleanup(); FRAME = 30 })
const brand = { primary: '#112233', accent: '#ddeeff', text: '#ffffff' }
// One line, 0.5 s to 3.5 s: three words, so the highlight moves one word per second.
const withStyle = (style: CaptionSettings['style']): CaptionSettings => ({ enabled: true, cues: [{ id: 'a', start: 0.5, end: 3.5, text: 'Call us today' }], style })
const mount = (c: CaptionSettings) => render(<CaptionsLayer captions={c} compH={1080} />)
const line = () => document.querySelector('[data-testid="caption-line"]') as HTMLElement
const words = () => [...document.querySelectorAll('[data-testid="caption-word"]')] as HTMLElement[]

describe('CaptionsLayer: brand presets still draw as before', () => {
  it('draws the line with the active word marked', () => {
    FRAME = 60 // 2.0 s: second word
    mount(withStyle(captionPreset('karaoke', brand)!))
    expect(words().map((w) => w.textContent)).toEqual(['Call', 'us', 'today'])
    expect(words().map((w) => w.getAttribute('data-active'))).toEqual(['0', '1', '0'])
  })
})

describe('CaptionsLayer: Capite looks', () => {
  it('draws every look with its own font and outline', () => {
    for (const l of CAPITE_CAPTION_STYLES) {
      cleanup()
      mount(withStyle(capiteLook(l.id)!))
      expect(line().style.fontFamily, l.id).toContain(l.fontName)
      if (l.outlineSize > 0 && l.animationType !== 'box') expect(line().style.textShadow, l.id).toContain(l.outlineColor)
    }
  })
  it('picks out the spoken word the way the look says, and not at all when highlighting is off', () => {
    FRAME = 60 // 2.0 s: "us" is spoken, "Call" already spoken, "today" not yet
    const highlight = CAPITE_CAPTION_STYLES.find((l) => l.animationType === 'highlight')!
    mount(withStyle(capiteLook(highlight.id)!))
    const [a, b, c] = words().map((w) => w.style.color)
    expect(b).not.toBe(a)
    expect(a).toBe(c) // only the active word differs for a highlight look
    cleanup()
    mount(withStyle({ ...capiteLook(highlight.id)!, highlight: 'none' }))
    const none = words().map((w) => w.style.color)
    expect(new Set(none).size).toBe(1)
  })
  it('karaoke keeps already-spoken words lit', () => {
    FRAME = 90 // 3.0 s: the last word is active, the earlier ones were spoken
    const karaoke = CAPITE_CAPTION_STYLES.find((l) => l.animationType === 'karaoke')!
    mount(withStyle(capiteLook(karaoke.id)!))
    const colors = words().map((w) => w.style.color)
    expect(colors[0]).toBe(colors[2])
  })
  it('keeps following the person\'s own controls: caps off and a changed colour apply to a Capite look', () => {
    const look = capiteLook(CAPITE_CAPTION_STYLES[0].id)!
    mount(withStyle({ ...look, preset: 'custom', uppercase: false, color: '#ff0000' }))
    expect(line().style.textTransform).toBe('none')
    expect(words()[2].style.color).toBe('rgb(255, 0, 0)') // an idle word takes the changed colour (the first word is the active one here)
  })
  it('an unknown look id falls back to the brand drawing instead of crashing', () => {
    mount(withStyle({ ...captionPreset('karaoke', brand)!, look: 'does-not-exist' }))
    expect(line().textContent).toBe('Call us today')
  })
})
