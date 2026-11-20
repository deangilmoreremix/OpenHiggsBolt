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
  cues: [{ id: 'c1', start: 0, end: 2, text: 'hello world' }, { id: 'c2', start: 2, end: 4, text: 'Second HELLO line' }],
  style: { preset: 'karaoke', position: 'bottom', size: 0.06, highlight: 'word', color: '#ffffff', highlightColor: '#facc15', box: false, boxColor: '#000000', boxOpacity: 0.5, uppercase: false, bold: true },
  ...p,
})
function open(captions: CaptionSettings, props: { onSeek?: (frame: number) => void; playFrame?: number } = {}) {
  state.settings = { durationInFrames: 150, fps: 30, brandColors, captions }
  render(<CaptionsPanel inputProps={input} {...props} />)
  fireEvent.click(screen.getByTestId('captions-toggle-panel'))
}
const last = () => updatePreviewComposition.mock.calls.at(-1)![0].captions as CaptionSettings

describe('transcript editor: nudging a line\'s times', () => {
  it('moves a start or an end by a tenth of a second', () => {
    open(caps())
    fireEvent.click(screen.getByTestId('caption-nudge-c2-start-plus'))
    expect(last().cues[1]).toMatchObject({ start: 2.1, end: 4 })
    fireEvent.click(screen.getByTestId('caption-nudge-c1-end-minus'))
    expect(last().cues[0]).toMatchObject({ start: 0, end: 1.9 })
  })
  it('never goes below zero or past the end of the video, and keeps a minimum length', () => {
    open(caps())
    fireEvent.click(screen.getByTestId('caption-nudge-c1-start-minus'))
    expect(last().cues[0].start).toBe(0)
    fireEvent.click(screen.getByTestId('caption-nudge-c2-end-plus')) // 4.1 s is still inside the 5 s video
    expect(last().cues[1].end).toBe(4.1)
    cleanup()
    open(caps({ cues: [{ id: 'c1', start: 4.95, end: 5, text: 'last' }] }))
    fireEvent.click(screen.getByTestId('caption-nudge-c1-end-plus'))
    expect(last().cues[0].end).toBeLessThanOrEqual(5)
    expect(last().cues[0].end).toBeGreaterThan(last().cues[0].start)
  })
})

describe('transcript editor: find and replace', () => {
  it('replaces in every line, ignoring case by default, and says how many', () => {
    open(caps())
    fireEvent.change(screen.getByTestId('captions-find'), { target: { value: 'hello' } })
    fireEvent.change(screen.getByTestId('captions-replace'), { target: { value: 'hi' } })
    fireEvent.click(screen.getByTestId('captions-replace-all'))
    expect(last().cues.map((c) => c.text)).toEqual(['hi world', 'Second hi line'])
    expect(screen.getByTestId('captions-edit-notice').textContent).toMatch(/2 replacements/)
  })
  it('can match case and whole words', () => {
    open(caps())
    fireEvent.change(screen.getByTestId('captions-find'), { target: { value: 'hello' } })
    fireEvent.click(screen.getByTestId('captions-find-case'))
    fireEvent.change(screen.getByTestId('captions-replace'), { target: { value: 'X' } })
    fireEvent.click(screen.getByTestId('captions-replace-all'))
    expect(last().cues.map((c) => c.text)).toEqual(['X world', 'Second HELLO line'])
    cleanup(); vi.clearAllMocks()
    open(caps())
    fireEvent.change(screen.getByTestId('captions-find'), { target: { value: 'hell' } })
    fireEvent.click(screen.getByTestId('captions-find-word'))
    fireEvent.change(screen.getByTestId('captions-replace'), { target: { value: 'X' } })
    fireEvent.click(screen.getByTestId('captions-replace-all'))
    expect(updatePreviewComposition).not.toHaveBeenCalled()
    expect(screen.getByTestId('captions-edit-notice').textContent).toMatch(/Nothing to replace/)
  })
  it('does nothing for an empty search', () => {
    open(caps())
    fireEvent.click(screen.getByTestId('captions-replace-all'))
    expect(updatePreviewComposition).not.toHaveBeenCalled()
  })
})

describe('transcript editor: casing', () => {
  it('changes every line to UPPER, Title or lower case', () => {
    open(caps())
    fireEvent.click(screen.getByTestId('captions-case-upper'))
    expect(last().cues.map((c) => c.text)).toEqual(['HELLO WORLD', 'SECOND HELLO LINE'])
    fireEvent.click(screen.getByTestId('captions-case-title'))
    expect(last().cues.map((c) => c.text)).toEqual(['Hello World', 'Second Hello Line'])
    fireEvent.click(screen.getByTestId('captions-case-lower'))
    expect(last().cues.map((c) => c.text)).toEqual(['hello world', 'second hello line'])
  })
})

describe('transcript editor: following the video', () => {
  it('jumps the preview to a line when its time is clicked', () => {
    const onSeek = vi.fn()
    open(caps(), { onSeek })
    fireEvent.click(screen.getAllByTestId('caption-cue-seek')[1])
    expect(onSeek).toHaveBeenCalledWith(60) // 2 s at 30 fps
  })
  it('has no jump button when there is no live preview to jump', () => {
    open(caps())
    expect(screen.queryAllByTestId('caption-cue-seek')).toHaveLength(0)
  })
  it('marks the line that is playing', () => {
    open(caps(), { onSeek: vi.fn(), playFrame: 70 }) // 2.33 s
    const rows = screen.getAllByTestId('caption-cue')
    expect(rows[0].getAttribute('data-active')).toBe('false')
    expect(rows[1].getAttribute('data-active')).toBe('true')
  })
})
