// @vitest-environment jsdom
/**
 * Certification: the branded render must make NO network calls.
 *
 * The overlay-only final video is produced entirely in-browser by
 * `@remotion/web-renderer` (mocked here via the shared harness). The
 * `createFinalVideo` branded-render branch must therefore never touch `fetch`,
 * `XMLHttpRequest` or `WebSocket`, and must never import the server-side
 * generation path. These tests spy on every network entry point at runtime while
 * a full branded render runs and assert zero calls, then back that up with a
 * source-level scan of `webExport.ts`.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  cancelActiveExport,
  configureCapableBrowser,
  getCtx,
  openSource,
  renderMediaOnWeb,
  renderProvider,
  resetRendererMocks,
  type HarnessRef,
} from './_createFinalVideoHarness'
import {
  WEB_RENDER_MIME_TYPE,
  PERSONALIZATION_COMPOSITION_ID,
} from '../finalOutput'

function makeBlob() {
  return new Blob(['fake-branded-video-bytes'], { type: 'video/mp4' })
}

const OriginalFetch = globalThis.fetch
const OriginalXHR = globalThis.XMLHttpRequest
const OriginalWebSocket = globalThis.WebSocket

beforeEach(() => {
  localStorage.clear()
  URL.createObjectURL = vi.fn(() => 'blob:http://localhost/final') as any
  URL.revokeObjectURL = vi.fn() as any
  resetRendererMocks()
  configureCapableBrowser()
})

afterEach(() => {
  cancelActiveExport()
  vi.restoreAllMocks()
  globalThis.fetch = OriginalFetch
  globalThis.XMLHttpRequest = OriginalXHR
  globalThis.WebSocket = OriginalWebSocket
  document.body.innerHTML = ''
})

describe('no network during branded render', () => {
  it('makes zero fetch / XHR / WebSocket calls while createFinalVideo runs', async () => {
    const fetchSpy = vi.fn()
    const xhrSpy = vi.fn()
    const wsSpy = vi.fn()
    ;(globalThis as any).fetch = fetchSpy
    ;(globalThis as any).XMLHttpRequest = xhrSpy
    ;(globalThis as any).WebSocket = wsSpy

    const ref: HarnessRef = { current: null }
    await renderProvider(ref)
    await openSource(ref)

    await act(async () => {
      getCtx(ref).approvePersonalization()
    })
    await act(async () => {})

    // Let any deferred setup work settle so we only observe the render itself.
    await new Promise((r) => setTimeout(r, 0))
    fetchSpy.mockClear()
    xhrSpy.mockClear()
    wsSpy.mockClear()

    renderMediaOnWeb.mockImplementation(async () => ({
      getBlob: async () => makeBlob(),
    }))

    await act(async () => {
      await getCtx(ref).createFinalVideo()
    })

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(xhrSpy).not.toHaveBeenCalled()
    expect(wsSpy).not.toHaveBeenCalled()

    // The finished video is handed off as a blob URL, not uploaded anywhere.
    expect(getCtx(ref).result.type).toBe('video')
    expect(getCtx(ref).result.url).toMatch(/^blob:/)
    expect(getCtx(ref).result.metadata.source).toBe('branded-render')
  })

  it('webExport.ts never references a network entry point in executable code', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/shared/personalization/webExport.ts'),
      'utf-8',
    )
    const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

    expect(code).not.toMatch(/\bfetch\s*\(/)
    expect(code).not.toMatch(/XMLHttpRequest/)
    expect(code).not.toMatch(/\bWebSocket\b/)
    expect(code).not.toMatch(/muapi/i)
    expect(code).not.toMatch(/openai/i)
    expect(code).not.toMatch(/['"`]\/api\//)
    // The renderer is the only external dependency and it is loaded dynamically.
    expect(code).toContain("import('@remotion/web-renderer')")
  })

  it('brands the render with the approved composition id and mp4 contract', async () => {
    const ref: HarnessRef = { current: null }
    await renderProvider(ref)
    await openSource(ref)

    await act(async () => {
      getCtx(ref).approvePersonalization()
    })
    await act(async () => {})

    renderMediaOnWeb.mockImplementation(async (opts: any) => {
      expect(opts.composition.id).toBe(PERSONALIZATION_COMPOSITION_ID)
      return { getBlob: async () => makeBlob() }
    })

    await act(async () => {
      await getCtx(ref).createFinalVideo()
    })

    expect(getCtx(ref).generation.status).toBe('complete')
    expect(getCtx(ref).result.metadata.container).toBe(WEB_RENDER_MIME_TYPE.mp4)
    expect(getCtx(ref).result.metadata.extension).toBe('mp4')
  })
})
