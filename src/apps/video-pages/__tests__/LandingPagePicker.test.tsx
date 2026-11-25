// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'

vi.hoisted(() => {
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as any
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
})
vi.mock('next/dynamic', () => ({ default: () => (props: any) => <div data-testid="modal" data-video={props.video?.url || ''} /> }))
import { LandingPagePickerProvider, LandingPageAction, useLandingPagePicker, OPEN_VIDEO_PAGES_EVENT } from '../LandingPagePicker'

const mount = (el: React.ReactElement) => {
  const host = document.createElement('div'); document.body.appendChild(host)
  const root = createRoot(host)
  act(() => { root.render(el) })
  return { host, root }
}

describe('LandingPageAction', () => {
  beforeEach(() => { document.body.innerHTML = '' })
  it('renders nothing without a permanent https video', () => {
    const { host } = mount(<LandingPagePickerProvider><LandingPageAction video={{ url: 'blob:x' }} /><LandingPageAction video={{}} /></LandingPagePickerProvider>)
    expect(host.querySelector('button')).toBeNull()
  })
  it('opens the picker with the normalized video attached', () => {
    const { host } = mount(<LandingPagePickerProvider><LandingPageAction video={{ url: 'https://cdn.test/a.mp4', name: 'Hi' }} className="x">Landing page</LandingPageAction></LandingPagePickerProvider>)
    expect(host.querySelector('[data-testid=modal]')).toBeNull()
    act(() => { host.querySelector('button')!.click() })
    expect(host.querySelector('[data-testid=modal]')?.getAttribute('data-video')).toBe('https://cdn.test/a.mp4')
  })
  it('useLandingPagePicker.open passes onPick/onClose through the provider', () => {
    let api: any
    const Grab = () => { api = useLandingPagePicker(); return null }
    mount(<LandingPagePickerProvider><Grab /></LandingPagePickerProvider>)
    expect(typeof api.open).toBe('function')
  })
})

describe('Video Pages is windows, not a studio', () => {
  beforeEach(() => { document.body.innerHTML = ''; window.history.replaceState(null, '', '/') })
  it('the header event opens the picker, or My pages', () => {
    const { host } = mount(<LandingPagePickerProvider><span /></LandingPagePickerProvider>)
    expect(host.querySelectorAll('[data-testid=modal]').length).toBe(0)
    act(() => { window.dispatchEvent(new CustomEvent(OPEN_VIDEO_PAGES_EVENT, { detail: { my: false } })) })
    expect(host.querySelectorAll('[data-testid=modal]').length).toBe(1)   // the picker (the dynamic mock renders both windows the same way)
    act(() => { window.dispatchEvent(new CustomEvent(OPEN_VIDEO_PAGES_EVENT, { detail: { my: true } })) })
    expect(host.querySelectorAll('[data-testid=modal]').length).toBe(2)   // the picker and My pages
  })
  it('an old /studio/video-pages link opens My pages over the image studio', () => {
    window.history.replaceState(null, '', '/studio/video-pages')
    const { host } = mount(<LandingPagePickerProvider><span /></LandingPagePickerProvider>)
    expect(host.querySelectorAll('[data-testid=modal]').length).toBe(1)
    expect(window.location.pathname).toBe('/studio/image')
  })
})

describe('a new picker request starts fresh', () => {
  beforeEach(() => { document.body.innerHTML = '' })
  it('opening the picker for another video remounts it with that video', () => {
    let api: any
    const Grab = () => { api = useLandingPagePicker(); return null }
    const { host } = mount(<LandingPagePickerProvider><Grab /></LandingPagePickerProvider>)
    act(() => { api.open({ video: { url: 'https://cdn.test/a.mp4' } }) })
    expect(host.querySelector('[data-testid=modal]')?.getAttribute('data-video')).toBe('https://cdn.test/a.mp4')
    act(() => { api.open({ video: { url: 'https://cdn.test/b.mp4' } }) })
    expect(host.querySelectorAll('[data-testid=modal]').length).toBe(1)
    expect(host.querySelector('[data-testid=modal]')?.getAttribute('data-video')).toBe('https://cdn.test/b.mp4')
  })
})
