// @vitest-environment jsdom
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { DEFAULT_CAPTION_STYLE, type CaptionSettings } from '../captions'

let FRAME = 30
vi.mock('remotion', () => ({
  AbsoluteFill: ({ children, style, ...rest }: { children?: React.ReactNode; style?: React.CSSProperties }) => <div style={style} {...(rest as object)}>{children}</div>,
  useCurrentFrame: () => FRAME,
  useVideoConfig: () => ({ fps: 30, width: 1920, height: 1080, durationInFrames: 150 }),
}))
import { CaptionsLayer } from '../CaptionsLayer'

afterEach(() => { cleanup(); FRAME = 30 })
const caps = (text: string, language?: string): CaptionSettings => ({ enabled: true, cues: [{ id: 'a', start: 0.5, end: 3, text }], style: DEFAULT_CAPTION_STYLE, ...(language ? { language } : {}) })
const line = (c: CaptionSettings) => { cleanup(); render(<CaptionsLayer captions={c} compH={1080} />); return document.querySelector('[data-testid="caption-line"]') as HTMLElement }

describe('CaptionsLayer: other languages and scripts', () => {
  it('sets right-to-left languages right to left, from the saved language or from the text', () => {
    expect(line(caps('مرحبا بالعالم', 'ar')).style.direction).toBe('rtl')
    expect(line(caps('שלום עולם')).style.direction).toBe('rtl')
    expect(line(caps('Call us today')).style.direction).toBe('')
    expect(line(caps('Call us today', 'es')).style.direction).toBe('')
  })
  it('adds the script\'s fonts and keeps Latin text as it was', () => {
    expect(line(caps('مرحبا', 'ar')).style.fontFamily).toContain('Noto Sans Arabic')
    expect(line(caps('こんにちは', 'ja')).style.fontFamily).toContain('Noto Sans')
    expect(line(caps('Call us today')).style.fontFamily).not.toContain('Noto Sans Arabic')
  })
  it('sets wide scripts a little smaller, never below 60 %', () => {
    const size = (el: HTMLElement) => parseFloat(el.style.fontSize)
    const latin = size(line(caps('Call us today')))
    const cjk = size(line(caps('今日は電話してください', 'ja')))
    expect(cjk).toBeLessThan(latin)
    expect(cjk).toBeGreaterThanOrEqual(latin * 0.6 - 1)
  })
  it('puts the script\'s fonts BEFORE the generic families, so an installed Arabic or CJK font is used instead of whatever the system font covers', () => {
    for (const [text, language, font] of [['مرحبا', 'ar', 'Noto Sans Arabic'], ['שלום', 'he', 'Noto Sans Hebrew'], ['こんにちは', 'ja', 'Noto Sans JP']] as const) {
      const stack = line(caps(text, language)).style.fontFamily
      expect(stack.indexOf(font), language).toBeGreaterThan(-1)
      expect(stack.indexOf(font), language).toBeLessThan(stack.indexOf('system-ui'))
      expect(stack.indexOf(font), language).toBeLessThan(stack.indexOf('ui-sans-serif'))
    }
  })
})
