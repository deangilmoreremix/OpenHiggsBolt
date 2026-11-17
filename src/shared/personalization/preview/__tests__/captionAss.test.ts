import { describe, it, expect } from 'vitest'
import { captionsToAss } from '../captionAss'
import { captionPreset, DEFAULT_CAPTION_STYLE, CAPITE_PRESETS, type CaptionSettings } from '../captions'

const brand = { primary: '#112233', accent: '#ddeeff', text: '#ffffff' }
const caps = (over: Partial<CaptionSettings> = {}): CaptionSettings => ({
  enabled: true,
  cues: [{ id: 'a', start: 0.5, end: 2, text: 'Call us today' }, { id: 'b', start: 2.5, end: 4, text: 'for a free quote' }],
  style: DEFAULT_CAPTION_STYLE,
  ...over,
})
const opts = { width: 1920, height: 1080 }
const dialogues = (ass: string) => ass.split('\n').filter((l) => l.startsWith('Dialogue:'))

describe('captionsToAss', () => {
  it('shares each line\'s time between its words and covers every word', () => {
    const d = dialogues(captionsToAss(caps(), opts))
    expect(d).toHaveLength(3 + 4)
    expect(d[0]).toContain('0:00:00.50')
    expect(d[3]).toContain('0:00:02.50')
  })
  it('uses the colours and highlight of the style, and the brand preset\'s own numbers', () => {
    const style = captionPreset('karaoke', brand)!
    const ass = captionsToAss(caps({ style }), opts)
    expect(dialogues(ass)[0]).toContain('&H00FFEEDD') // the accent #ddeeff
  })
  it('draws a Capite look in its own font and animation', () => {
    const look = CAPITE_PRESETS.find((p) => p.id === 'capite-karaoke') ?? CAPITE_PRESETS[0]
    const style = captionPreset(look.id, brand)!
    const ass = captionsToAss(caps({ style }), opts)
    expect(ass).toContain('Style: Default,')
    expect(ass).not.toContain('Style: Default,Inter,')
    expect(dialogues(ass).length).toBeGreaterThan(0)
  })
  it('turns the highlight off when the style has none, and the box into the box effect', () => {
    const none = captionsToAss(caps({ style: { ...DEFAULT_CAPTION_STYLE, highlight: 'none' } }), opts)
    expect(dialogues(none)[1]).not.toContain(DEFAULT_CAPTION_STYLE.highlightColor.replace('#', '').toUpperCase())
    const boxed = captionsToAss(caps({ style: { ...DEFAULT_CAPTION_STYLE, box: true } }), opts)
    expect(dialogues(boxed)[0]).toContain('\\3a&H00&')
  })
  it('keeps the casing the style asks for and places top, middle and bottom at different heights', () => {
    expect(dialogues(captionsToAss(caps({ style: { ...DEFAULT_CAPTION_STYLE, uppercase: false } }), opts))[0]).toContain('Call')
    const y = (position: 'top' | 'middle' | 'bottom') => Number(/\\pos\(\d+,(\d+)\)/.exec(dialogues(captionsToAss(caps({ style: { ...DEFAULT_CAPTION_STYLE, position } }), opts))[0])![1])
    expect(y('top')).toBeLessThan(y('middle'))
    expect(y('middle')).toBeLessThan(y('bottom'))
  })
  it('uses the saved language or the script of the text for the font and layout', () => {
    expect(captionsToAss(caps({ language: 'ar', cues: [{ id: 'a', start: 0, end: 1, text: 'مرحبا' }] }), opts)).toContain('Style: Default,Noto Sans,')
    expect(captionsToAss(caps({ cues: [{ id: 'a', start: 0, end: 1, text: '你好世界' }] }), opts)).toContain('Style: Default,Noto Sans,')
  })
  it('is empty when there are no captions', () => { expect(captionsToAss(caps({ cues: [] }), opts)).toBe('') })
})
