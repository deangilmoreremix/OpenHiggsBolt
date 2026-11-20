// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { CaptionSettings } from '../../preview/captions'

const state: { settings: Record<string, unknown> } = { settings: {} }
const updatePreviewComposition = vi.fn()
vi.mock('../../DemoPersonalizeProvider', () => ({ useDemoPersonalize: () => ({ previewSettings: state.settings, updatePreviewComposition }) }))
const studio = vi.hoisted(() => ({ open: vi.fn() }))
vi.mock('../../../captionStudio/modal.js', () => ({ openCaptionStudio: (o: unknown) => studio.open(o) }))
// What the Studio's studioPayload() would return for the captions it hands back.
vi.mock('../../../captionStudio/studioData.js', () => ({
  studioPayload: (captions: { text: string; startMs: number; endMs: number }[], style: Record<string, unknown>) => ({
    pages: [{ startMs: captions[0].startMs, durationMs: 1200, tokens: captions.map((c) => ({ text: c.text, fromMs: c.startMs, toMs: c.endMs })) }],
    style: { ...style, animation: 'highlight' },
  }),
}))

import { CaptionsPanel } from '../CaptionsPanel'

afterEach(() => { cleanup(); vi.clearAllMocks() })

const brandColors = { primary: '#112233', accent: '#ddeeff', text: '#ffffff', backgroundDim: 0.18 }
const VIDEO = 'https://x/clip.mp4'
const caps = (): CaptionSettings => ({
  enabled: true,
  cues: [{ id: 'c1', start: 0, end: 2, text: 'hello world' }],
  style: { preset: 'karaoke', position: 'bottom', size: 0.06, highlight: 'word', color: '#ffffff', highlightColor: '#facc15', box: false, boxColor: '#000000', boxOpacity: 0.5, uppercase: true, bold: true },
})
function open(input: Record<string, unknown>, captions?: CaptionSettings) {
  state.settings = { durationInFrames: 150, fps: 30, brandColors, captions }
  render(<CaptionsPanel inputProps={input as never} />)
  fireEvent.click(screen.getByTestId('captions-toggle-panel'))
}
const request = () => studio.open.mock.calls.at(-1)![0] as {
  videoUrl: string; captions: { text: string; startMs: number; endMs: number }[]; style: Record<string, unknown>; fonts: string[]; applyLabel: string
  onApply: (r: unknown) => void; onError: (e: Error) => void
}

describe('CaptionsPanel with the Caption Studio', () => {
  it('writes captions from the video’s speech: opens the studio on this video, in the one allowed font', async () => {
    open({ videoUrl: VIDEO, posterUrl: null, isImageSource: false })
    fireEvent.click(screen.getByTestId('captions-open-studio'))
    await waitFor(() => expect(studio.open).toHaveBeenCalledTimes(1))
    const r = request()
    expect(r.videoUrl).toBe(VIDEO)
    expect(r.fonts).toEqual(['Inter'])
    expect(r.applyLabel).toContain('captions in the video')
    expect(r.captions).toEqual([]) // nothing yet: the studio transcribes
  })

  it('stores what the studio returns as lines with exact word times and its look', async () => {
    open({ videoUrl: VIDEO, posterUrl: null, isImageSource: false })
    fireEvent.click(screen.getByTestId('captions-open-studio'))
    await waitFor(() => expect(studio.open).toHaveBeenCalled())
    act(() => { request().onApply({ captions: [{ text: 'Call', startMs: 0, endMs: 400 }, { text: ' us', startMs: 500, endMs: 900 }], captionStyle: { preset: 'capite-hormozi', fontSize: 7, position: 'top', positionY: 0.3, highlightColor: '#00ffff', stroke: true } }) })
    await waitFor(() => expect(updatePreviewComposition).toHaveBeenCalled())
    const c = updatePreviewComposition.mock.calls.at(-1)![0].captions as CaptionSettings
    expect(c.enabled).toBe(true)
    expect(c.cues[0]).toMatchObject({ text: 'Call us', start: 0 })
    expect(c.cues[0].words).toEqual([{ text: 'Call', start: 0, end: 0.4 }, { text: 'us', start: 0.5, end: 0.9 }])
    expect(c.style).toMatchObject({ preset: 'capite-hormozi', positionY: 0.3, highlightColor: '#00ffff' })
    expect(screen.getByTestId('captions-notice').textContent).toMatch(/1 line written from the video’s speech/)
  })

  it('reopens on the captions already there, word by word, keeping their look', async () => {
    open({ videoUrl: VIDEO, posterUrl: null, isImageSource: false }, caps())
    expect(screen.getByTestId('captions-open-studio').textContent).toContain('Edit in the Caption Studio')
    fireEvent.click(screen.getByTestId('captions-open-studio'))
    await waitFor(() => expect(studio.open).toHaveBeenCalled())
    const r = request()
    expect(r.captions.map((c) => c.text)).toEqual(['hello', ' world'])
    expect(r.captions[0].startMs).toBe(0)
    expect(r.captions[1].endMs).toBe(2000)
    expect(r.style).toMatchObject({ fontFamily: 'Inter', fontSize: 6, highlightColor: '#facc15', preset: 'tiktok' })
  })

  it('needs a video: the button is off without one, and for image sources', () => {
    open({ videoUrl: null, posterUrl: null, isImageSource: false })
    expect((screen.getByTestId('captions-open-studio') as HTMLButtonElement).disabled).toBe(true)
    cleanup()
    open({ videoUrl: VIDEO, posterUrl: null, isImageSource: true })
    expect((screen.getByTestId('captions-open-studio') as HTMLButtonElement).disabled).toBe(true)
  })

  it('says so, and changes nothing, when the studio returns no words or fails to open', async () => {
    open({ videoUrl: VIDEO, posterUrl: null, isImageSource: false }, caps())
    fireEvent.click(screen.getByTestId('captions-open-studio'))
    await waitFor(() => expect(studio.open).toHaveBeenCalled())
    act(() => { request().onApply({ captions: [{ text: '  ', startMs: 0, endMs: 100 }], captionStyle: {} }) })
    await waitFor(() => expect(screen.getByTestId('captions-notice').textContent).toMatch(/nothing was changed/))
    expect(updatePreviewComposition).not.toHaveBeenCalled()
    act(() => { request().onError(new Error('no model')) })
    await waitFor(() => expect(screen.getByTestId('captions-notice').textContent).toContain('no model'))
  })

  it('still lets people paste a script', () => {
    open({ videoUrl: VIDEO, posterUrl: null, isImageSource: false })
    fireEvent.change(screen.getByTestId('captions-script'), { target: { value: 'We help small businesses grow with simple honest marketing.' } })
    fireEvent.click(screen.getByTestId('captions-apply'))
    expect((updatePreviewComposition.mock.calls.at(-1)![0].captions as CaptionSettings).cues.length).toBeGreaterThan(0)
  })
})
