// @vitest-environment jsdom
import React, { act } from 'react'
import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { createRoot } from 'react-dom/client'
import { fireEvent } from '@testing-library/react'
import { Timeline } from '../Timeline'
import { createLayer } from '../../../preview/presets'
import type { PreviewLayer } from '../../../preview/types'

beforeAll(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true })
const mounted: { root: ReturnType<typeof createRoot>; el: HTMLElement }[] = []
afterEach(() => { for (const { root, el } of mounted.splice(0)) { act(() => root.unmount()); el.remove() } })

const D = 150
function mount(layers: PreviewLayer[], onChange = vi.fn(), onSelect = vi.fn()) {
  const el = document.createElement('div'); document.body.appendChild(el)
  const root = createRoot(el); mounted.push({ root, el })
  const labels = Object.fromEntries(layers.map((l) => [l.id, l.kind]))
  act(() => { root.render(<Timeline layers={layers} labels={labels} durationInFrames={D} fps={30} selectedId="" onSelect={onSelect} onChange={onChange} />) })
  // jsdom has no layout: give the ruler track a width so pixel drags map to frames
  el.querySelectorAll('div[aria-hidden]').forEach((n) => { (n as HTMLElement).getBoundingClientRect = () => ({ left: 0, top: 0, width: 1490, height: 14, right: 1490, bottom: 14, x: 0, y: 0, toJSON: () => ({}) }) })
  return { el, onChange, onSelect }
}
const q = (el: HTMLElement, sel: string) => el.querySelector(sel) as HTMLElement | null

const headline = { ...createLayer('headline'), id: 'headline', startFrame: 30, endFrame: 90 }
const logo = { ...createLayer('logo'), id: 'logo', startFrame: 0, endFrame: undefined }

describe('Timeline', () => {
  it('draws one bar per visible layer (not the end card, not hidden layers) at the right place', () => {
    const { el } = mount([headline, logo, { ...createLayer('cta'), id: 'cta', visible: false }, { ...createLayer('endCard'), id: 'endCard' }])
    const bars = [...el.querySelectorAll('[data-testid="timeline-bar"]')]
    expect(bars.map((b) => b.getAttribute('data-layer-id'))).toEqual(['headline', 'logo'])
    expect(bars[0].getAttribute('data-start')).toBe('30')
    expect(bars[0].getAttribute('data-end')).toBe('90')
    expect(bars[1].getAttribute('data-end')).toBe('') // open-ended
  })

  it('moves a bar one frame with the arrow keys and ten with Shift, and selects the layer', () => {
    const { el, onChange, onSelect } = mount([headline])
    const move = q(el, '[data-testid="timeline-move"]')!
    act(() => { fireEvent.keyDown(move, { key: 'ArrowRight' }) })
    expect(onChange).toHaveBeenLastCalledWith('headline', { startFrame: 31, endFrame: 91 })
    act(() => { fireEvent.keyDown(move, { key: 'ArrowLeft', shiftKey: true }) })
    expect(onChange).toHaveBeenLastCalledWith('headline', { startFrame: 20, endFrame: 80 })
    expect(onSelect).toHaveBeenCalledWith('headline')
  })

  it('trims the edges from the keyboard, with sliders that report the frame', () => {
    const { el, onChange } = mount([headline])
    const start = q(el, '[data-testid="timeline-start"]')!
    const end = q(el, '[data-testid="timeline-end"]')!
    expect(start.getAttribute('role')).toBe('slider')
    expect(start.getAttribute('aria-valuenow')).toBe('30')
    expect(end.getAttribute('aria-label')).toContain('ends at 3.0 s')
    act(() => { fireEvent.keyDown(start, { key: 'ArrowRight', shiftKey: true }) })
    expect(onChange).toHaveBeenLastCalledWith('headline', { startFrame: 40, endFrame: 90 })
    act(() => { fireEvent.keyDown(end, { key: 'ArrowLeft' }) })
    expect(onChange).toHaveBeenLastCalledWith('headline', { startFrame: 30, endFrame: 89 })
  })

  it('dragging a bar with the pointer retimes it by the distance moved, from where the drag began', () => {
    const { el, onChange } = mount([headline])
    const move = q(el, '[data-testid="timeline-move"]')!
    act(() => { fireEvent.pointerDown(move, { clientX: 100, pointerId: 1 }) })
    // 149 px of a 1490 px track = 10% of 149 frames = 15 frames
    act(() => { fireEvent.pointerMove(window, { clientX: 249, pointerId: 1 }) })
    expect(onChange).toHaveBeenLastCalledWith('headline', { startFrame: 45, endFrame: 105 })
    // moving further is measured from the start of the drag, not compounded
    act(() => { fireEvent.pointerMove(window, { clientX: 100, pointerId: 1 }) })
    expect(onChange).toHaveBeenLastCalledWith('headline', { startFrame: 30, endFrame: 90 })
    act(() => { fireEvent.pointerUp(window, { pointerId: 1 }) })
    onChange.mockClear()
    act(() => { fireEvent.pointerMove(window, { clientX: 400, pointerId: 1 }) })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('dragging the end edge to the far right makes the layer open-ended again', () => {
    const { el, onChange } = mount([headline])
    act(() => { fireEvent.pointerDown(q(el, '[data-testid="timeline-end"]')!, { clientX: 500, pointerId: 2 }) })
    act(() => { fireEvent.pointerMove(window, { clientX: 5000, pointerId: 2 }) })
    expect(onChange).toHaveBeenLastCalledWith('headline', { startFrame: 30, endFrame: undefined })
  })

  it('renders nothing when there is nothing to retime', () => {
    const { el } = mount([{ ...createLayer('endCard'), id: 'endCard' }])
    expect(q(el, '[data-testid="timeline"]')).toBeNull()
  })
})

describe('Timeline audio lanes', () => {
  type Audio = { id: string; name: string; start: number; length?: number; muted: boolean }
  function mountAudio(layers: PreviewLayer[], audio: Audio[], onAudioChange = vi.fn()) {
    const el = document.createElement('div'); document.body.appendChild(el)
    const root = createRoot(el); mounted.push({ root, el })
    act(() => { root.render(<Timeline layers={layers} labels={{}} durationInFrames={D} fps={30} selectedId="" onSelect={vi.fn()} onChange={vi.fn()} audio={audio} onAudioChange={onAudioChange} />) })
    return { el, onAudioChange }
  }

  it('shows a lane per track, positioned by its start and length', () => {
    const { el } = mountAudio([logo], [{ id: 'a1', name: 'song.mp3', start: 1, length: 2, muted: false }, { id: 'a2', name: 'voice.wav', start: 0, muted: true }])
    const bars = [...el.querySelectorAll('[data-testid="timeline-audio-bar"]')]
    expect(bars).toHaveLength(2)
    expect(bars[0].getAttribute('data-start')).toBe('30')
    expect(bars[0].getAttribute('data-end')).toBe('89')
    expect(bars[1].getAttribute('data-end')).toBe('') // plays to the end
    expect(q(el, '[data-testid="timeline-audio-label"]')!.textContent).toContain('song.mp3')
  })

  it('moves a track and sets how long it plays with the keyboard', () => {
    const { el, onAudioChange } = mountAudio([logo], [{ id: 'a1', name: 'song.mp3', start: 1, length: 2, muted: false }])
    act(() => { fireEvent.keyDown(q(el, '[data-testid="timeline-audio-move"]')!, { key: 'ArrowRight', shiftKey: true }) })
    expect(onAudioChange).toHaveBeenLastCalledWith('a1', { start: 1.33, length: 2 })
    act(() => { fireEvent.keyDown(q(el, '[data-testid="timeline-audio-end"]')!, { key: 'ArrowLeft' }) })
    expect(onAudioChange).toHaveBeenLastCalledWith('a1', { start: 1, length: 1.97 })
  })

  it('shows lanes even when every layer is hidden, and no timeline without tracks or layers', () => {
    const { el } = mountAudio([], [{ id: 'a1', name: 'x.mp3', start: 0, muted: false }])
    expect(q(el, '[data-testid="timeline-audio-bar"]')).not.toBeNull()
    const { el: empty } = mountAudio([], [])
    expect(q(empty, '[data-testid="timeline"]')).toBeNull()
  })
})
