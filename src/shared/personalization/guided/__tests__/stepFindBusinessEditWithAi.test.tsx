// @vitest-environment jsdom
/**
 * The guided "Find business" step lets a signed-in user open the AI image
 * editor on each discovered asset, right where the assets are reviewed.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { DiscoveredAsset } from '../../types'

const ctx: Record<string, unknown> = {}

vi.mock('../../DemoPersonalizeProvider', () => ({
  useDemoPersonalize: () => ctx,
}))

import { StepFindBusiness } from '../StepFindBusiness'

function asset(overrides: Partial<DiscoveredAsset>): DiscoveredAsset {
  return {
    id: 'asset',
    previewUrl: 'https://joes-pizza.example/logo.png',
    sourceUrl: 'https://joes-pizza.example/logo.png',
    sourceType: 'WEBSITE',
    category: 'logo',
    selected: true,
    recommended: true,
    rejected: false,
    ...overrides,
  } as DiscoveredAsset
}

const ASSETS = [
  asset({ id: 'logo', category: 'logo' }),
  asset({ id: 'storefront', category: 'storefront', previewUrl: 'https://joes-pizza.example/storefront.jpg' }),
  asset({ id: 'blob', category: 'product', previewUrl: 'blob:https://app/123' }),
]

let root: Root | null = null
let container: HTMLDivElement | null = null

async function render(onEditAsset?: (asset: DiscoveredAsset) => void) {
  Object.assign(ctx, {
    clientForm: { businessName: "Joe's Pizza", website: 'https://joes-pizza.example' },
    access: onEditAsset ? 'authenticated' : 'anonymous',
    discoveredAssets: ASSETS,
    discoveryStatus: 'idle',
    toggleDiscoveredAssetSelection: vi.fn(),
    importDiscoveredAssets: vi.fn(),
    saveClient: vi.fn(),
    setViewMode: vi.fn(),
  })
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root!.render(<StepFindBusiness onEditAsset={onEditAsset} />)
  })
  return container
}

afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
  root = null
  container = null
})

describe('StepFindBusiness: Edit with AI', () => {
  it('offers Edit with AI on every editable discovered asset and opens the editor on that asset', async () => {
    const onEditAsset = vi.fn()
    const view = await render(onEditAsset)

    const buttons = Array.from(view.querySelectorAll('button')).filter((b) => b.textContent === 'Edit with AI')
    // The blob: preview cannot be sent to the editor, so it gets no button.
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual(['Edit logo with AI', 'Edit storefront with AI'])

    await act(async () => buttons[1].click())

    expect(onEditAsset).toHaveBeenCalledTimes(1)
    expect(onEditAsset.mock.calls[0][0].id).toBe('storefront')
  })

  it('offers no Edit with AI when no editor handler is given (anonymous session)', async () => {
    const view = await render(undefined)

    const buttons = Array.from(view.querySelectorAll('button')).filter((b) => b.textContent === 'Edit with AI')
    expect(buttons).toHaveLength(0)
    // Review and import still work without it.
    expect(view.textContent).toContain('Discovered assets')
  })
})
