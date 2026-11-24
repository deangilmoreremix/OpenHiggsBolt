// @vitest-environment jsdom
/** Step 3 has an optional Captions panel that opens the same free Caption Studio as the Step 4 editor. */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { PREVIEW_LAYOUTS } from '../../preview/presets'

const ctx: Record<string, unknown> = {}
vi.mock('../../DemoPersonalizeProvider', () => ({ useDemoPersonalize: () => ctx }))
vi.mock('../PersonalizationTemplateBrowser', () => ({ PersonalizationTemplateBrowser: () => null }))
vi.mock('../LayoutThumbnails', () => ({ LayoutThumbnails: () => null }))
vi.mock('../AssetUsagePanel', () => ({ AssetUsagePanel: () => null }))

import { StepPersonalize } from '../StepPersonalize'

let root: Root | null = null
let container: HTMLDivElement | null = null

async function render(overrides: Record<string, unknown> = {}) {
  const layout = PREVIEW_LAYOUTS[0]
  Object.keys(ctx).forEach((k) => delete ctx[k])
  Object.assign(ctx, {
    clientForm: {},
    selectedBusiness: null,
    updateClientForm: vi.fn(),
    assets: { logos: [], products: [], primaryLogo: null },
    previewSettings: { layout: layout.id, layers: [], brandColors: { primary: '#000', accent: '#111', text: '#fff', backgroundDim: 0 } },
    setPreviewLayout: vi.fn(),
    setRemotionDesign: vi.fn(),
    updatePreviewLayer: vi.fn(),
    updatePreviewBrandColors: vi.fn(),
    updatePreviewComposition: vi.fn(),
    ...overrides,
  })
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root!.render(<StepPersonalize />))
  return container
}

afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
  root = null
  container = null
})

describe('Step 3 captions', () => {
  it('shows a free Captions panel with the Caption Studio button', async () => {
    const view = await render({ source: { url: 'https://example.com/a.mp4' } })
    const panel = view.querySelector('[data-testid="step3-captions"]')!
    expect(panel.textContent).toContain('Free · no credits')
    expect(panel.querySelector('[data-testid="captions-open-studio"]')?.textContent).toContain('Open Caption Studio')
  })

  it('shows the lines already made when there are captions', async () => {
    const view = await render({
      source: { url: 'https://example.com/a.mp4' },
      previewSettings: {
        layout: PREVIEW_LAYOUTS[0].id, layers: [], width: 1920, height: 1080, fps: 30, durationInFrames: 150,
        brandColors: { primary: '#000', accent: '#111', text: '#fff', backgroundDim: 0 },
        captions: { enabled: true, cues: [{ id: 'a', start: 0, end: 2, text: 'hello there' }], style: { preset: 'x', position: 'bottom', size: 0.05, highlight: 'word', color: '#fff', highlightColor: '#ff0', box: false, boxColor: '#000', boxOpacity: 0.5, uppercase: false, bold: true } },
      },
    })
    expect(view.querySelector('[data-testid="captions-summary"]')?.textContent).toContain('1 lines')
    expect(view.querySelector('[data-testid="captions-open-studio"]')?.textContent).toContain('Edit in the Caption Studio')
  })
})
