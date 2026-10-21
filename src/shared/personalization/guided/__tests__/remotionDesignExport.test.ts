// @vitest-environment jsdom
/**
 * The browser export carries the selected Remotion design.
 *
 * The approved preview is what the customer signs off on, so the exported
 * video has to be the same scene: when a motion design is selected, the
 * export renders THAT design (resolved from the design registry) instead of
 * the plain personalization composition.
 *
 * The test drives the real provider (through the shared createFinalVideo
 * harness) and only stubs the renderer, so the whole chain — provider state →
 * preview input props → export options → renderer call — is exercised.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import {
  cancelActiveExport,
  configureCapableBrowser,
  getCtx,
  openSource,
  renderMediaOnWeb,
  renderProvider,
  resetRendererMocks,
  type HarnessRef,
} from '../../__tests__/_createFinalVideoHarness'
import { PERSONALIZATION_COMPOSITION_ID } from '../../finalOutput'

beforeEach(() => {
  localStorage.clear()
  URL.createObjectURL = vi.fn(() => 'blob:http://localhost/final') as any
  URL.revokeObjectURL = vi.fn() as any
  resetRendererMocks()
  configureCapableBrowser()
})

afterEach(() => {
  cancelActiveExport()
  document.body.innerHTML = ''
})

async function renderWithDesign(designId: string | null): Promise<any> {
  const ref: HarnessRef = { current: null }
  await renderProvider(ref)
  await openSource(ref)

  await act(async () => {
    getCtx(ref).updateClientForm({
      businessName: 'Acme Roofing',
      offer: 'Free inspection',
      callToAction: 'Visit acme.test',
    })
  })
  await act(async () => {
    getCtx(ref).setPreviewDesign(designId)
  })
  await act(async () => {
    getCtx(ref).approvePersonalization()
  })

  await act(async () => {
    await getCtx(ref).createFinalVideo()
  })

  await vi.waitFor(() => expect(renderMediaOnWeb).toHaveBeenCalledTimes(1), { timeout: 5000 })
  return renderMediaOnWeb.mock.calls[0][0]
}

describe('the branded export carries the selected design', () => {
  it('renders the selected design instead of the plain composition', async () => {
    const options = await renderWithDesign('social-reel')

    expect(options.composition.id).toBe('social-reel')
    expect(options.composition.id).not.toBe(PERSONALIZATION_COMPOSITION_ID)
  })

  it('exports the design filled with the customer own business data', async () => {
    const options = await renderWithDesign('social-reel')

    expect(options.inputProps.brandName).toBe('Acme Roofing')
    expect(options.inputProps.headline).toBe('Free inspection')
    expect(options.inputProps.ctaText).toBe('Visit acme.test')
  })

  it('keeps exporting the plain composition when no design is selected', async () => {
    const options = await renderWithDesign(null)

    expect(options.composition.id).toBe(PERSONALIZATION_COMPOSITION_ID)
  })
})
