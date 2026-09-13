// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { screen } from '@testing-library/react'
import { DemoPersonalizeProvider, useDemoPersonalize } from '../DemoPersonalizeProvider'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

vi.mock('@/components/SocialPublishProvider', () => ({
  SocialPublishContext: { Provider: ({ children }: any) => children, Consumer: ({ children }: any) => children(null) } as any,
  useSocialPublish: () => {
    throw new Error('useSocialPublish must be used within a <SocialPublishProvider>')
  },
}))

vi.mock('@/lib/authConfig', () => ({
  useAuthConfig: () => ({
    apiKey: 'test-key',
    openaiKey: '',
    setApiKey: vi.fn(),
    setOpenAiKey: vi.fn(),
    clearApiKey: vi.fn(),
    clearOpenAiKey: vi.fn(),
    clearAllKeys: vi.fn(),
    hasApiKey: true,
    hasOpenAiKey: false,
    isAuthenticated: true,
  }),
}))

vi.mock('../promptPersonalizer', () => ({
  personalizePrompt: vi.fn(),
  regeneratePrompt: vi.fn(),
}))

vi.mock('../generationRouter', () => ({
  runGeneration: vi.fn(),
}))

vi.mock('../postProcessor', () => ({
  applyPostProcessing: vi.fn(),
  generateEndCardImage: vi.fn(),
}))

vi.mock('studio/src/muapi', () => ({
  uploadFile: vi.fn(),
}))

function TestOpener({ source, onMounted }: { source: any; onMounted: (open: (opts: any) => void) => void }) {
  const ctx = useDemoPersonalize()
  ;(window as any).__personalizationCtx = ctx
  onMounted(ctx.openPersonalize)
  return null
}

describe('Discovered Assets Integration', () => {
  let mockUploadFile: any
  let originalFetch: typeof globalThis.fetch
  let originalCreateObjectURL: typeof URL.createObjectURL
  let originalRevokeObjectURL: typeof URL.revokeObjectURL

  beforeEach(async () => {
    vi.clearAllMocks()
    originalFetch = globalThis.fetch
    originalCreateObjectURL = URL.createObjectURL
    originalRevokeObjectURL = URL.revokeObjectURL
    URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test')
    URL.revokeObjectURL = vi.fn()
    document.body.innerHTML = ''

    // Mock the download-image endpoint used by importDiscoveredAssets
    ;(globalThis as any).fetch = vi.fn(async (url: string, options?: any) => {
      if (typeof url === 'string' && url.includes('/api/personalization/download-image')) {
        const body = typeof options?.body === 'string' ? JSON.parse(options.body) : {}
        const urls = Array.isArray(body?.urls) ? body.urls : []
        const results = urls.map((u: string) => ({
          url: u,
          dataUrl: `data:image/png;base64,${Buffer.from('fake-image-data').toString('base64')}`,
          ok: true,
        }))
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, results }),
        } as any
      }
      if (typeof url === 'string' && url.includes('/api/personalization/discover-assets')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, discoveredAssets: [], count: 0 }),
        } as any
      }
      return originalFetch(url, options)
    })

    // Configure uploadFile mock to return a durable URL
    try {
      const mod = await import('studio/src/muapi')
      mockUploadFile = (mod as any)?.uploadFile
      if (mockUploadFile) {
        mockUploadFile.mockResolvedValue('https://uploaded.example.com/discovered.png')
      }
    } catch {
      // ignore if module cannot be imported in test env
    }
  })

  afterEach(() => {
    ;(globalThis as any).fetch = originalFetch
    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
  })

  const renderProvider = async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <DemoPersonalizeProvider>
          <TestOpener
            source={{ id: 'demo-1', title: 'Test Demo', mediaType: 'video', originalPrompt: 'test', sourceMedia: null, poster: null, fullPrompt: 'test', shortPrompt: 'test', sourceType: 'landing-demo', sourceMetadata: {} }}
            onMounted={() => {}}
          />
        </DemoPersonalizeProvider>,
      )
    })

    return container
  }

  const openSource = async () => {
    await act(async () => {
      ;(window as any).__personalizationCtx.openPersonalize({
        source: { id: 'demo-1', title: 'Test', mediaType: 'video', originalPrompt: 'test', sourceMedia: null, poster: null, fullPrompt: 'test', shortPrompt: 'test', sourceType: 'landing-demo', sourceMetadata: {} },
      })
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })
  }

  it('renders the Find Business Assets button', async () => {
    const container = await renderProvider()
    await openSource()

    const findButtons = screen.getAllByText('Find Business Assets')
    expect(findButtons.length).toBeGreaterThanOrEqual(1)
  })

  it('does not render a duplicate Website field in CTA section', async () => {
    const container = await renderProvider()
    await openSource()

    const websiteLabels = screen.getAllByText('Website')
    expect(websiteLabels.length).toBe(1)
  })

  it('renders Website above Business Name in Client Profile', async () => {
    const container = await renderProvider()
    await openSource()

    const websiteLabels = screen.getAllByText('Website')
    const businessNameLabels = screen.getAllByText('Business Name')

    const websiteLabel = websiteLabels[0]
    const businessNameLabel = businessNameLabels[0]

    const allLabels = Array.from(container.querySelectorAll('label'))
    expect(allLabels.indexOf(websiteLabel as any)).toBeGreaterThanOrEqual(0)
    expect(allLabels.indexOf(businessNameLabel as any)).toBeGreaterThanOrEqual(0)
    expect(allLabels.indexOf(websiteLabel as any)).toBeLessThan(allLabels.indexOf(businessNameLabel as any))
  })

  it('binds Website input to clientForm.website', async () => {
    const container = await renderProvider()
    await openSource()

    let c = (window as any).__personalizationCtx
    expect(c.clientForm.website).toBeUndefined()

    await act(async () => {
      c.updateClientForm({ website: 'https://test.com' })
    })

    c = (window as any).__personalizationCtx
    expect(c.clientForm.website).toBe('https://test.com')
  })

  it('preserves manual uploads after discovery state changes', async () => {
    const container = await renderProvider()
    await openSource()

    let c = (window as any).__personalizationCtx
    await act(async () => {
      c.addLogoUrl('https://manual-logo.png')
    })

    c = (window as any).__personalizationCtx
    expect(c.assets.logos.length).toBe(1)
    expect(c.assets.logos[0].url).toBe('https://manual-logo.png')

    await act(async () => {
      c.discoverAssets('https://test.com')
    })

    c = (window as any).__personalizationCtx
    expect(c.assets.logos.length).toBe(1)
    expect(c.assets.logos[0].url).toBe('https://manual-logo.png')
  })

  it('keeps discovered assets temporary and separate from AssetLibrary', async () => {
    const container = await renderProvider()
    await openSource()

    let c = (window as any).__personalizationCtx
    await act(async () => {
      c.setDiscoveredAssets([
        {
          id: 'disc-1',
          sourceUrl: 'https://test.com/logo.png',
          previewUrl: 'https://test.com/logo.png',
          category: 'logo',
          selected: true,
          recommended: true,
          rejected: false,
        },
      ])
    })

    c = (window as any).__personalizationCtx
    expect(c.discoveredAssets.length).toBe(1)
    expect(c.assets.logos.length).toBe(0)
    expect(c.discoveryStatus).toBe('reviewing')
  })

  it('rejecting a discovered asset does not affect AssetLibrary', async () => {
    const container = await renderProvider()
    await openSource()

    let c = (window as any).__personalizationCtx
    const logosBefore = c.assets.logos.length

    await act(async () => {
      c.setDiscoveredAssets([
        {
          id: 'disc-1',
          sourceUrl: 'https://test.com/logo.png',
          previewUrl: 'https://test.com/logo.png',
          category: 'logo',
          selected: true,
          recommended: true,
          rejected: false,
        },
      ])
    })

    c = (window as any).__personalizationCtx
    const logosAfterSet = c.assets.logos.length
    expect(logosAfterSet).toBe(logosBefore)

    await act(async () => {
      c.rejectDiscoveredAsset('disc-1')
    })

    c = (window as any).__personalizationCtx
    expect(c.discoveredAssets[0].rejected).toBe(true)
    expect(c.assets.logos.length).toBe(logosBefore)
  })

  it('changing discovered asset category updates the asset', async () => {
    const container = await renderProvider()
    await openSource()

    let c = (window as any).__personalizationCtx
    await act(async () => {
      c.setDiscoveredAssets([
        {
          id: 'disc-1',
          sourceUrl: 'https://test.com/logo.png',
          previewUrl: 'https://test.com/logo.png',
          category: 'logo',
          selected: true,
          recommended: true,
          rejected: false,
        },
      ])
    })

    c = (window as any).__personalizationCtx
    await act(async () => {
      c.updateDiscoveredAssetCategory('disc-1', 'brand')
    })

    c = (window as any).__personalizationCtx
    expect(c.discoveredAssets[0].category).toBe('brand')
  })

  it('selecting recommended assets selects only recommended ones', async () => {
    const container = await renderProvider()
    await openSource()

    let c = (window as any).__personalizationCtx
    await act(async () => {
      c.setDiscoveredAssets([
        {
          id: 'disc-1',
          sourceUrl: 'https://test.com/logo.png',
          previewUrl: 'https://test.com/logo.png',
          category: 'logo',
          selected: false,
          recommended: true,
          rejected: false,
        },
        {
          id: 'disc-2',
          sourceUrl: 'https://test.com/product.png',
          previewUrl: 'https://test.com/product.png',
          category: 'product',
          selected: false,
          recommended: false,
          rejected: false,
        },
      ])
    })

    c = (window as any).__personalizationCtx
    await act(async () => {
      c.selectRecommendedDiscoveredAssets()
    })

    c = (window as any).__personalizationCtx
    expect(c.discoveredAssets[0].selected).toBe(true)
    expect(c.discoveredAssets[1].selected).toBe(false)
  })

  it('imports selected person assets into identities', async () => {
    const container = await renderProvider()
    await openSource()

    let c = (window as any).__personalizationCtx
    await act(async () => {
      c.setDiscoveredAssets([
        {
          id: 'disc-1',
          sourceUrl: 'https://test.com/person.jpg',
          previewUrl: 'https://test.com/person.jpg',
          category: 'person',
          selected: true,
          recommended: true,
          rejected: false,
        },
      ])
    })

    c = (window as any).__personalizationCtx
    await act(async () => {
      c.importDiscoveredAssets()
    })

    c = (window as any).__personalizationCtx
    expect(c.assets.identities.length).toBe(1)
    expect(c.assets.identities[0].role).toBe('presenter_identity')
    expect(c.assets.identities[0].url).toBeTruthy()
    expect(c.discoveredAssets.length).toBe(0)
  })

  it('imports selected logo assets into logos', async () => {
    const container = await renderProvider()
    await openSource()

    let c = (window as any).__personalizationCtx
    await act(async () => {
      c.setDiscoveredAssets([
        {
          id: 'disc-1',
          sourceUrl: 'https://test.com/logo.png',
          previewUrl: 'https://test.com/logo.png',
          category: 'logo',
          selected: true,
          recommended: true,
          rejected: false,
        },
      ])
    })

    c = (window as any).__personalizationCtx
    await act(async () => {
      c.importDiscoveredAssets()
    })

    c = (window as any).__personalizationCtx
    expect(c.assets.logos.length).toBe(1)
    expect(c.assets.logos[0].role).toBe('logo')
    // After durable import the URL may be a blob URL (test env) or a durable URL (real env)
    expect(c.assets.logos[0].url).toBeTruthy()
  })

  it('imports selected product/service assets into products', async () => {
    const container = await renderProvider()
    await openSource()

    let c = (window as any).__personalizationCtx
    await act(async () => {
      c.setDiscoveredAssets([
        {
          id: 'disc-1',
          sourceUrl: 'https://test.com/product.png',
          previewUrl: 'https://test.com/product.png',
          category: 'product',
          selected: true,
          recommended: true,
          rejected: false,
        },
        {
          id: 'disc-2',
          sourceUrl: 'https://test.com/service.png',
          previewUrl: 'https://test.com/service.png',
          category: 'service',
          selected: true,
          recommended: true,
          rejected: false,
        },
      ])
    })

    c = (window as any).__personalizationCtx
    await act(async () => {
      c.importDiscoveredAssets()
    })

    c = (window as any).__personalizationCtx
    expect(c.assets.products.length).toBe(2)
    expect(c.assets.products.every((p: any) => p.role === 'product_reference')).toBe(true)
  })

  it('imports selected brand/storefront assets into brandReferences', async () => {
    const container = await renderProvider()
    await openSource()

    let c = (window as any).__personalizationCtx
    await act(async () => {
      c.setDiscoveredAssets([
        {
          id: 'disc-1',
          sourceUrl: 'https://test.com/storefront.png',
          previewUrl: 'https://test.com/storefront.png',
          category: 'storefront',
          selected: true,
          recommended: true,
          rejected: false,
        },
        {
          id: 'disc-2',
          sourceUrl: 'https://test.com/office.png',
          previewUrl: 'https://test.com/office.png',
          category: 'office',
          selected: true,
          recommended: true,
          rejected: false,
        },
      ])
    })

    c = (window as any).__personalizationCtx
    await act(async () => {
      c.importDiscoveredAssets()
    })

    c = (window as any).__personalizationCtx
    expect(c.assets.brandReferences.length).toBe(2)
    expect(c.assets.brandReferences.every((b: any) => b.role === 'brand_reference')).toBe(true)
  })

  it('does not auto-populate firstFrame during import', async () => {
    const container = await renderProvider()
    await openSource()

    let c = (window as any).__personalizationCtx
    await act(async () => {
      c.setDiscoveredAssets([
        {
          id: 'disc-1',
          sourceUrl: 'https://test.com/anything.png',
          previewUrl: 'https://test.com/anything.png',
          category: 'brand',
          selected: true,
          recommended: true,
          rejected: false,
        },
      ])
    })

    c = (window as any).__personalizationCtx
    await act(async () => {
      c.importDiscoveredAssets()
    })

    c = (window as any).__personalizationCtx
    expect(c.assets.firstFrame).toBeNull()
  })

  it('does not auto-populate lastFrame during import', async () => {
    const container = await renderProvider()
    await openSource()

    let c = (window as any).__personalizationCtx
    await act(async () => {
      c.setDiscoveredAssets([
        {
          id: 'disc-1',
          sourceUrl: 'https://test.com/anything.png',
          previewUrl: 'https://test.com/anything.png',
          category: 'brand',
          selected: true,
          recommended: true,
          rejected: false,
        },
      ])
    })

    c = (window as any).__personalizationCtx
    await act(async () => {
      c.importDiscoveredAssets()
    })

    c = (window as any).__personalizationCtx
    expect(c.assets.lastFrame).toBeNull()
  })

  it('does not auto-populate ctaGraphic during import', async () => {
    const container = await renderProvider()
    await openSource()

    let c = (window as any).__personalizationCtx
    await act(async () => {
      c.setDiscoveredAssets([
        {
          id: 'disc-1',
          sourceUrl: 'https://test.com/anything.png',
          previewUrl: 'https://test.com/anything.png',
          category: 'brand',
          selected: true,
          recommended: true,
          rejected: false,
        },
      ])
    })

    c = (window as any).__personalizationCtx
    await act(async () => {
      c.importDiscoveredAssets()
    })

    c = (window as any).__personalizationCtx
    expect(c.assets.ctaGraphic).toBeNull()
  })

  it('preserves existing primary identity unless none exists', async () => {
    const container = await renderProvider()
    await openSource()

    let c = (window as any).__personalizationCtx
    await act(async () => {
      c.addIdentityUrl('https://existing-identity.png')
    })

    c = (window as any).__personalizationCtx
    const existingId = c.assets.primaryIdentity?.id
    expect(existingId).toBeTruthy()

    await act(async () => {
      c.setDiscoveredAssets([
        {
          id: 'disc-1',
          sourceUrl: 'https://test.com/person.jpg',
          previewUrl: 'https://test.com/person.jpg',
          category: 'person',
          selected: true,
          recommended: true,
          rejected: false,
        },
      ])
    })

    c = (window as any).__personalizationCtx
    await act(async () => {
      c.importDiscoveredAssets()
    })

    c = (window as any).__personalizationCtx
    expect(c.assets.identities.length).toBe(2)
    expect(c.assets.primaryIdentity?.id).toBe(existingId)
  })

  it('preserves existing primary logo unless none exists', async () => {
    const container = await renderProvider()
    await openSource()

    let c = (window as any).__personalizationCtx
    await act(async () => {
      c.addLogoUrl('https://existing-logo.png')
    })

    c = (window as any).__personalizationCtx
    const existingLogoId = c.assets.primaryLogo?.id
    expect(existingLogoId).toBeTruthy()

    await act(async () => {
      c.setDiscoveredAssets([
        {
          id: 'disc-1',
          sourceUrl: 'https://test.com/logo.png',
          previewUrl: 'https://test.com/logo.png',
          category: 'logo',
          selected: true,
          recommended: true,
          rejected: false,
        },
      ])
    })

    c = (window as any).__personalizationCtx
    await act(async () => {
      c.importDiscoveredAssets()
    })

    c = (window as any).__personalizationCtx
    expect(c.assets.logos.length).toBe(2)
    expect(c.assets.primaryLogo?.id).toBe(existingLogoId)
  })

  it('only imports selected and non-rejected assets', async () => {
    const container = await renderProvider()
    await openSource()

    let c = (window as any).__personalizationCtx
    await act(async () => {
      c.setDiscoveredAssets([
        {
          id: 'disc-1',
          sourceUrl: 'https://test.com/selected.png',
          previewUrl: 'https://test.com/selected.png',
          category: 'logo',
          selected: true,
          recommended: true,
          rejected: false,
        },
        {
          id: 'disc-2',
          sourceUrl: 'https://test.com/unselected.png',
          previewUrl: 'https://test.com/unselected.png',
          category: 'logo',
          selected: false,
          recommended: false,
          rejected: false,
        },
        {
          id: 'disc-3',
          sourceUrl: 'https://test.com/rejected.png',
          previewUrl: 'https://test.com/rejected.png',
          category: 'logo',
          selected: true,
          recommended: true,
          rejected: true,
        },
      ])
    })

    c = (window as any).__personalizationCtx
    await act(async () => {
      c.importDiscoveredAssets()
    })

    c = (window as any).__personalizationCtx
    expect(c.assets.logos.length).toBe(1)
    expect(c.assets.logos[0].url).toBeTruthy()
  })
})
