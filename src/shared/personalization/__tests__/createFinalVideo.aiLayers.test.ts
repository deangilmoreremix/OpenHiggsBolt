// @vitest-environment jsdom
/**
 * AI personalization keeps the on-video layout: after the AI video is
 * generated, the overlay editor's layers are rendered over it in the browser
 * (in place of the MuAPI logo / end-card watermark). If the browser can't
 * render, today's watermark path runs and the result says why.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import {
  cancelActiveExport,
  configureCapableBrowser,
  getCtx,
  renderMediaOnWeb,
  renderProvider,
  resetRendererMocks,
  makeDemoSource,
  type HarnessRef,
} from './_createFinalVideoHarness'
import { runGeneration } from '../generationRouter'
import { readClipMetadata } from '../preview/fitSettingsToClip'

// The generated clip: 8 s, portrait.
vi.mock('../preview/fitSettingsToClip', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../preview/fitSettingsToClip')>()),
  readClipMetadata: vi.fn(async () => ({ durationSeconds: 8, width: 720, height: 1280 })),
}))
import { applyPostProcessing } from '../postProcessor'

const GENERATED = 'https://cdn.example/generated.mp4'

async function openAuthenticated(mode = 'face_only', { consent = true, sourceMedia = null as string | null } = {}) {
  await act(async () => {
    ;(window as any).__personalizationCtx.openPersonalize({ source: { ...makeDemoSource(), sourceMedia }, access: 'authenticated' })
  })
  await act(async () => { await new Promise((r) => setTimeout(r, 50)) })
  await act(async () => {
    getCtx({ current: null }).setOutputType('video')
    getCtx({ current: null }).setMode(mode)
    getCtx({ current: null }).updateGenOptions({ ...getCtx({ current: null }).genOptions, consentGiven: consent })
  })
}

beforeEach(() => {
  localStorage.clear()
  URL.createObjectURL = vi.fn(() => 'blob:http://localhost/final') as any
  URL.revokeObjectURL = vi.fn() as any
  resetRendererMocks()
  configureCapableBrowser()
  ;(runGeneration as any).mockResolvedValue({ type: 'video', url: GENERATED, metadata: { model: 'm' } })
  ;(applyPostProcessing as any).mockResolvedValue({ finalUrl: 'https://cdn.example/watermarked.mp4', originalUrl: GENERATED, applied: ['video-overlay'] })
})

afterEach(() => {
  cancelActiveExport()
  document.body.innerHTML = ''
})

describe('createFinalVideo with an AI mode', () => {
  it('passes the approved size and length straight to generation, then burns the layers in', async () => {
    const ref: HarnessRef = { current: null }
    await renderProvider(ref)
    await openAuthenticated()

    const settings = getCtx(ref).previewSettings
    await act(async () => { await getCtx(ref).createFinalVideo() })

    // The options reach this run directly (no same-tick setGenOptions race).
    const call = (runGeneration as any).mock.calls[0][0]
    expect(call.options.aspectRatio).toBe(settings.aspectRatio)
    expect(call.options.duration).toBe(Math.max(1, Math.round(settings.durationInFrames / settings.fps)))

    // The layers are rendered over the generated clip; no MuAPI watermark.
    expect(renderMediaOnWeb).toHaveBeenCalledTimes(1)
    expect(renderMediaOnWeb.mock.calls[0][0].inputProps.videoUrl).toBe(GENERATED)
    // …at the clip's own length and shape, so it isn't cut, padded or cropped.
    expect(readClipMetadata).toHaveBeenCalledWith(GENERATED)
    const composition = renderMediaOnWeb.mock.calls[0][0].composition
    expect(composition.durationInFrames).toBe(8 * settings.fps)
    expect([composition.width, composition.height]).toEqual([1080, 1920])
    expect(applyPostProcessing).not.toHaveBeenCalled()

    const result = getCtx(ref).result
    expect(result.url).toBe('blob:http://localhost/final')
    expect(result.metadata).toMatchObject({ layersBurnedIn: true, generatedUrl: GENERATED })
  })

  it('falls back to the watermark and says why when the browser cannot render', async () => {
    renderMediaOnWeb.mockRejectedValue(new Error('no encoder'))
    const ref: HarnessRef = { current: null }
    await renderProvider(ref)
    await openAuthenticated()

    await act(async () => { await getCtx(ref).createFinalVideo() })

    expect(applyPostProcessing).toHaveBeenCalledTimes(1)
    const result = getCtx(ref).result
    expect(result.url).toBe('https://cdn.example/watermarked.mp4')
    expect(String(result.metadata.layersNote)).toMatch(/couldn't be added/)
  })

  it('refuses a face/person mode without consent, even if the button was bypassed', async () => {
    const ref: HarnessRef = { current: null }
    await renderProvider(ref)
    await openAuthenticated('face_only', { consent: false })
    await act(async () => { await getCtx(ref).createFinalVideo() })
    expect(runGeneration).not.toHaveBeenCalled()
    expect(getCtx(ref).generation.errorMessage).toMatch(/permission/i)
  })

  it("Full presenter keeps the original video's sound under the silent recast", async () => {
    const ref: HarnessRef = { current: null }
    await renderProvider(ref)
    await openAuthenticated('full_body', { sourceMedia: 'https://cdn.example/demo.mp4' })
    await act(async () => { await getCtx(ref).createFinalVideo() })
    expect(renderMediaOnWeb.mock.calls[0][0].inputProps.audioUrl).toBe('https://cdn.example/demo.mp4')
  })
})
