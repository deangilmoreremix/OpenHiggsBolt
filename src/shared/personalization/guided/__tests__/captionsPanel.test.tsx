// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { CaptionSettings } from '../../preview/captions'

const state: { settings: Record<string, unknown> } = { settings: {} }
const updatePreviewComposition = vi.fn()
vi.mock('../../DemoPersonalizeProvider', () => ({ useDemoPersonalize: () => ({ previewSettings: state.settings, updatePreviewComposition }) }))

import { CaptionsPanel } from '../CaptionsPanel'

afterEach(() => { cleanup(); vi.clearAllMocks() })

const brandColors = { primary: '#112233', accent: '#ddeeff', text: '#ffffff', backgroundDim: 0.18 }
const input = { posterUrl: null } as never
const caps = (p: Partial<CaptionSettings> = {}): CaptionSettings => ({
  enabled: true,
  cues: [{ id: 'c1', start: 0, end: 2, text: 'hello world' }, { id: 'c2', start: 2, end: 4, text: 'second line' }],
  style: { preset: 'karaoke', position: 'bottom', size: 0.06, highlight: 'word', color: '#ffffff', highlightColor: '#facc15', box: false, boxColor: '#000000', boxOpacity: 0.5, uppercase: true, bold: true },
  ...p,
})
function open(captions?: CaptionSettings) {
  state.settings = { durationInFrames: 150, fps: 30, brandColors, captions }
  render(<CaptionsPanel inputProps={input} />)
  fireEvent.click(screen.getByTestId('captions-toggle-panel'))
}
const last = () => updatePreviewComposition.mock.calls.at(-1)![0].captions as CaptionSettings | undefined

describe('CaptionsPanel', () => {
  it('times pasted words across the video and turns captions on', () => {
    open()
    fireEvent.change(screen.getByTestId('captions-script'), { target: { value: 'We help small businesses grow with simple honest marketing that works every time you ask.' } })
    fireEvent.click(screen.getByTestId('captions-apply'))
    const c = last()!
    expect(c.enabled).toBe(true)
    expect(c.cues.length).toBeGreaterThanOrEqual(2)
    expect(c.cues.at(-1)!.end).toBeCloseTo(5, 5)
    expect(screen.getByTestId('captions-notice').textContent).toMatch(/lines? timed across 5\.0 seconds/)
  })

  it('keeps subtitle times when SRT is pasted, and says so when there is nothing to caption', () => {
    open()
    fireEvent.click(screen.getByTestId('captions-apply'))
    expect(screen.getByTestId('captions-notice').textContent).toMatch(/Nothing to caption/)
    expect(updatePreviewComposition).not.toHaveBeenCalled()
    fireEvent.change(screen.getByTestId('captions-script'), { target: { value: '1\n00:00:01,000 --> 00:00:02,500\nHi there' } })
    fireEvent.click(screen.getByTestId('captions-apply'))
    expect(last()!.cues[0]).toMatchObject({ start: 1, end: 2.5, text: 'Hi there' })
  })

  it('a preset takes the brand colors; a manual change marks the style custom', () => {
    open(caps())
    fireEvent.click(screen.getByTestId('captions-preset-brand'))
    expect(last()!.style).toMatchObject({ preset: 'brand', boxColor: '#112233', box: true })
    fireEvent.click(screen.getByTestId('captions-box'))
    expect(last()!.style.preset).toBe('custom')
  })

  it('position, highlight, caps and size write to the style', () => {
    open(caps())
    fireEvent.click(screen.getByTestId('captions-pos-top'))
    expect(last()!.style.position).toBe('top')
    fireEvent.click(screen.getByTestId('captions-highlight'))
    expect(last()!.style.highlight).toBe('none')
    fireEvent.click(screen.getByTestId('captions-caps'))
    expect(last()!.style.uppercase).toBe(false)
    fireEvent.change(screen.getByTestId('captions-size'), { target: { value: '0.1' } })
    expect(last()!.style.size).toBe(0.1)
  })

  it('edits one line\'s words and times, adds and deletes lines', () => {
    open(caps())
    const first = screen.getAllByTestId('caption-cue')[0]
    fireEvent.change(first.querySelector('[data-testid="caption-cue-text"]')!, { target: { value: 'changed words' } })
    expect(last()!.cues[0].text).toBe('changed words')
    expect(last()!.cues[1].text).toBe('second line')
    fireEvent.change(screen.getByTestId('caption-end-c1'), { target: { value: '3' } })
    expect(last()!.cues[0].end).toBe(3)
    fireEvent.change(screen.getByTestId('caption-start-c2'), { target: { value: '3.5' } })
    expect(last()!.cues[1]).toMatchObject({ start: 3.5, end: 4 })
    fireEvent.click(screen.getAllByTestId('caption-cue-delete')[0])
    expect(last()!.cues.map((c) => c.id)).toEqual(['c2'])
    fireEvent.click(screen.getByTestId('caption-cue-add'))
    expect(last()!.cues).toHaveLength(3)
  })

  it('turns captions off and on, and removes them', () => {
    open(caps())
    fireEvent.click(screen.getByTestId('captions-enabled'))
    expect(last()!.enabled).toBe(false)
    fireEvent.click(screen.getByTestId('captions-clear'))
    expect(last()).toBeUndefined()
  })

  it('shows the style controls only once there are lines', () => {
    open()
    expect(screen.queryByTestId('captions-preset-clean')).toBeNull()
    cleanup()
    open(caps())
    expect(screen.getByTestId('captions-preset-clean')).toBeTruthy()
  })

  describe('languages and more downloads', () => {
    const readBlob = (b: Blob) => new Promise<string>((resolve) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.readAsText(b) })
    it('downloads the words as a .txt file and the styled captions as an .ass file', async () => {
      const created: Blob[] = []
      URL.createObjectURL = vi.fn((b: Blob) => { created.push(b); return 'blob:x' }) as unknown as typeof URL.createObjectURL
      URL.revokeObjectURL = vi.fn()
      const names: string[] = []
      const origClick = HTMLAnchorElement.prototype.click
      HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) { names.push(this.download) }
      try {
        open(caps())
        fireEvent.click(screen.getByTestId('captions-download-txt'))
        fireEvent.click(screen.getByTestId('captions-download-ass'))
        expect(names).toEqual(['captions.txt', 'captions.ass'])
        expect(await readBlob(created[0])).toBe('hello world\nsecond line\n')
        const ass = await readBlob(created[1])
        expect(ass).toContain('[V4+ Styles]')
        expect(ass).toContain('Dialogue:')
      } finally { HTMLAnchorElement.prototype.click = origClick }
    })
    it('offers the languages and saves the chosen one with the captions, and clears it again', () => {
      open(caps())
      const select = screen.getByTestId('captions-language') as HTMLSelectElement
      expect(select.value).toBe('auto')
      expect(select.querySelectorAll('option').length).toBeGreaterThan(90)
      fireEvent.change(select, { target: { value: 'ar' } })
      expect(last()!.language).toBe('ar')
      fireEvent.change(select, { target: { value: 'auto' } })
      expect(last()!.language).toBeUndefined()
    })
    it('shows the saved language when the panel opens', () => {
      open(caps({ language: 'es' }))
      expect((screen.getByTestId('captions-language') as HTMLSelectElement).value).toBe('es')
    })
    it('has no downloads or language choice before there are any lines', () => {
      open()
      expect(screen.queryByTestId('captions-download-txt')).toBeNull()
      expect(screen.queryByTestId('captions-language')).toBeNull()
    })
  })
})
