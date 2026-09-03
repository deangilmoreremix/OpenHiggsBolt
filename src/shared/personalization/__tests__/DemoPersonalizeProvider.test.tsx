// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, useEffect } from 'react'
import { createRoot } from 'react-dom/client'

vi.mock('studio/src/muapi', () => ({
  uploadFile: vi.fn(),
}))

const { DemoPersonalizeProvider, useDemoPersonalize, getGenerationAssetUrl } = await import('../DemoPersonalizeProvider')
const { uploadFile } = await import('studio/src/muapi')

const generationPromiseResolvers: ((status: string) => void)[] = []

function TestOpener() {
  const ctx = useDemoPersonalize()
  ;(window as any).__personalizationCtx = ctx

  useEffect(() => {
    ;(window as any).__onGenerationChange = (status: string) => {
      generationPromiseResolvers.forEach((r) => r(status))
      generationPromiseResolvers.length = 0
    }
    ;(window as any).__onGenerationChange?.(ctx.generation.status)
  }, [ctx.generation.status])

  return null
}

async function waitForGeneration(expectedStatus: string, timeout = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      generationPromiseResolvers.length = 0
      reject(new Error(`Timed out waiting for generation.status="${expectedStatus}"`))
    }, timeout)

    generationPromiseResolvers.push((status: string) => {
      clearTimeout(timer)
      if (status === expectedStatus) resolve()
      else reject(new Error(`Expected generation.status="${expectedStatus}" but got "${status}"`))
    })
  })
}

function createFile(name: string, type = 'image/png'): File {
  return new File([name], name, { type })
}

function createFileList(files: File[]): FileList {
  return {
    0: files[0],
    1: files[1],
    2: files[2],
    length: files.length,
    item: (i: number) => files[i] ?? null,
  } as unknown as FileList
}

describe('DemoPersonalizeProvider durable uploads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test')
    URL.revokeObjectURL = vi.fn()
    generationPromiseResolvers.length = 0
  })

  const renderProvider = async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <DemoPersonalizeProvider apiKey="test-key">
          <TestOpener />
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

  it('uploads identity files and stores durable URL', async () => {
    const mockUploadFile = uploadFile as any
    mockUploadFile.mockResolvedValue('https://example.com/uploaded-identity.jpg')

    await renderProvider()
    await openSource()

    const files = createFileList([createFile('dean.jpg', 'image/jpeg')])

    await act(async () => {
      ;(window as any).__personalizationCtx.addIdentityFiles(files)
    })

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    const ctx = (window as any).__personalizationCtx
    const identity = ctx.assets.identities[0]
    expect(identity).toBeTruthy()
    expect(identity.url).toBe('https://example.com/uploaded-identity.jpg')
    expect(identity.uploadStatus).toBe('ready')
  })

  it('uploads logo files and stores durable URL', async () => {
    const mockUploadFile = uploadFile as any
    mockUploadFile.mockResolvedValue('https://example.com/uploaded-logo.png')

    await renderProvider()
    await openSource()

    const files = createFileList([createFile('logo.png')])

    await act(async () => {
      ;(window as any).__personalizationCtx.addLogoFiles(files)
    })

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    const ctx = (window as any).__personalizationCtx
    const logo = ctx.assets.logos[0]
    expect(logo).toBeTruthy()
    expect(logo.url).toBe('https://example.com/uploaded-logo.png')
    expect(logo.uploadStatus).toBe('ready')
  })

  it('uploads product files and stores durable URL', async () => {
    const mockUploadFile = uploadFile as any
    mockUploadFile.mockResolvedValue('https://example.com/uploaded-product.png')

    await renderProvider()
    await openSource()

    const files = createFileList([createFile('product.png')])

    await act(async () => {
      ;(window as any).__personalizationCtx.addProductFiles(files)
    })

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    const ctx = (window as any).__personalizationCtx
    const product = ctx.assets.products[0]
    expect(product).toBeTruthy()
    expect(product.url).toBe('https://example.com/uploaded-product.png')
    expect(product.uploadStatus).toBe('ready')
  })

  it('uploads brand reference files and stores durable URL', async () => {
    const mockUploadFile = uploadFile as any
    mockUploadFile.mockResolvedValue('https://example.com/uploaded-brand.png')

    await renderProvider()
    await openSource()

    const files = createFileList([createFile('brand.png')])

    await act(async () => {
      ;(window as any).__personalizationCtx.addBrandReferenceFiles(files)
    })

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    const ctx = (window as any).__personalizationCtx
    const brand = ctx.assets.brandReferences[0]
    expect(brand).toBeTruthy()
    expect(brand.url).toBe('https://example.com/uploaded-brand.png')
    expect(brand.uploadStatus).toBe('ready')
  })

  it('uploads first frame and stores durable URL', async () => {
    const mockUploadFile = uploadFile as any
    mockUploadFile.mockResolvedValue('https://example.com/uploaded-first.png')

    await renderProvider()
    await openSource()

    const file = createFile('first.png')

    await act(async () => {
      ;(window as any).__personalizationCtx.setFirstFrameFile(file)
    })

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    const ctx = (window as any).__personalizationCtx
    const firstFrame = ctx.assets.firstFrame
    expect(firstFrame).toBeTruthy()
    expect(firstFrame!.url).toBe('https://example.com/uploaded-first.png')
    expect(firstFrame!.uploadStatus).toBe('ready')
  })

  it('uploads last frame and stores durable URL', async () => {
    const mockUploadFile = uploadFile as any
    mockUploadFile.mockResolvedValue('https://example.com/uploaded-last.png')

    await renderProvider()
    await openSource()

    const file = createFile('last.png')

    await act(async () => {
      ;(window as any).__personalizationCtx.setLastFrameFile(file)
    })

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    const ctx = (window as any).__personalizationCtx
    const lastFrame = ctx.assets.lastFrame
    expect(lastFrame).toBeTruthy()
    expect(lastFrame!.url).toBe('https://example.com/uploaded-last.png')
    expect(lastFrame!.uploadStatus).toBe('ready')
  })

  it('uploads CTA graphic and stores durable URL', async () => {
    const mockUploadFile = uploadFile as any
    mockUploadFile.mockResolvedValue('https://example.com/uploaded-cta.png')

    await renderProvider()
    await openSource()

    const file = createFile('cta.png')

    await act(async () => {
      ;(window as any).__personalizationCtx.setCtaGraphicFile(file)
    })

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    const ctx = (window as any).__personalizationCtx
    const cta = ctx.assets.ctaGraphic
    expect(cta).toBeTruthy()
    expect(cta!.url).toBe('https://example.com/uploaded-cta.png')
    expect(cta!.uploadStatus).toBe('ready')
  })

  it('rejects blob URLs in generation guard for logo', async () => {
    const mockUploadFile = uploadFile as any
    mockUploadFile.mockImplementation(() => new Promise(() => {}))

    await renderProvider()
    await openSource()

    const files = createFileList([createFile('logo.png')])

    await act(async () => {
      ;(window as any).__personalizationCtx.addLogoFiles(files)
    })

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    const updatedCtx = (window as any).__personalizationCtx
    const logo = updatedCtx.assets.logos[0]
    expect(logo).toBeTruthy()
    expect(logo.url.startsWith('blob:')).toBe(true)

    const genPromise = waitForGeneration('error')

    await act(async () => {
      await updatedCtx.generate()
    })

    await genPromise

    const finalCtx = (window as any).__personalizationCtx
    expect(finalCtx.generation.status).toBe('error')
    expect(finalCtx.generation.errorMessage).toMatch(/still uploading/i)
  })

  it('handles upload failure and retry', async () => {
    const mockUploadFile = uploadFile as any
    mockUploadFile
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce('https://example.com/retried-logo.png')

    await renderProvider()
    await openSource()

    const files = createFileList([createFile('logo.png')])

    await act(async () => {
      ;(window as any).__personalizationCtx.addLogoFiles(files)
    })

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    let ctx = (window as any).__personalizationCtx
    const logo = ctx.assets.logos[0]
    expect(logo.uploadStatus).toBe('error')

    await act(async () => {
      await ctx.retryAssetUpload(logo.id)
    })

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    ctx = (window as any).__personalizationCtx
    const retriedLogo = ctx.assets.logos[0]
    expect(retriedLogo.url).toBe('https://example.com/retried-logo.png')
    expect(retriedLogo.uploadStatus).toBe('ready')
  })

  it('removes asset and revokes blob URL', async () => {
    const mockUploadFile = uploadFile as any
    mockUploadFile.mockResolvedValue('https://example.com/uploaded-logo.png')

    await renderProvider()
    await openSource()

    const files = createFileList([createFile('logo.png')])

    await act(async () => {
      ;(window as any).__personalizationCtx.addLogoFiles(files)
    })

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    const ctx = (window as any).__personalizationCtx
    const logo = ctx.assets.logos[0]
    expect(logo).toBeTruthy()

    await act(async () => {
      ;(window as any).__personalizationCtx.removeLogo(logo.id)
    })

    expect((window as any).__personalizationCtx.assets.logos.length).toBe(0)
    expect(URL.revokeObjectURL).toHaveBeenCalled()
  })

  it('supports multiple concurrent product uploads', async () => {
    const mockUploadFile = uploadFile as any
    mockUploadFile.mockImplementation((_apiKey: string, _file: File) => {
      return new Promise<string>((resolve) => {
        setTimeout(() => resolve(`https://example.com/uploaded-${_file.name}`), Math.random() * 50 + 10)
      })
    })

    await renderProvider()
    await openSource()

    const files = createFileList([createFile('p1.png'), createFile('p2.png'), createFile('p3.png')])

    await act(async () => {
      ;(window as any).__personalizationCtx.addProductFiles(files)
    })

    await act(async () => {
      await new Promise((r) => setTimeout(r, 200))
    })

    const ctx = (window as any).__personalizationCtx
    expect(ctx.assets.products.length).toBe(3)
    expect(ctx.assets.products.every((p: any) => p.uploadStatus === 'ready')).toBe(true)
    expect(ctx.assets.products.map((p: any) => p.url)).toEqual([
      'https://example.com/uploaded-p1.png',
      'https://example.com/uploaded-p2.png',
      'https://example.com/uploaded-p3.png',
    ])
  })

  it('supports multiple concurrent brand reference uploads', async () => {
    const mockUploadFile = uploadFile as any
    mockUploadFile.mockImplementation((_apiKey: string, _file: File) => {
      return new Promise<string>((resolve) => {
        setTimeout(() => resolve(`https://example.com/uploaded-${_file.name}`), Math.random() * 50 + 10)
      })
    })

    await renderProvider()
    await openSource()

    const files = createFileList([createFile('b1.png'), createFile('b2.png')])

    await act(async () => {
      ;(window as any).__personalizationCtx.addBrandReferenceFiles(files)
    })

    await act(async () => {
      await new Promise((r) => setTimeout(r, 200))
    })

    const ctx = (window as any).__personalizationCtx
    expect(ctx.assets.brandReferences.length).toBe(2)
    expect(ctx.assets.brandReferences.every((b: any) => b.uploadStatus === 'ready')).toBe(true)
  })

  it('keeps primary identity correct during async uploads', async () => {
    const mockUploadFile = uploadFile as any
    mockUploadFile.mockImplementation((_apiKey: string, _file: File) => {
      return new Promise<string>((resolve) => {
        setTimeout(() => resolve(`https://example.com/uploaded-${_file.name}`), Math.random() * 100 + 20)
      })
    })

    await renderProvider()
    await openSource()

    const files = createFileList([createFile('face.jpg'), createFile('body.jpg'), createFile('side.jpg')])

    await act(async () => {
      ;(window as any).__personalizationCtx.addIdentityFiles(files)
    })

    await act(async () => {
      await new Promise((r) => setTimeout(r, 150))
    })

    const ctx = (window as any).__personalizationCtx
    expect(ctx.assets.identities.length).toBe(3)
    expect(ctx.assets.primaryIdentity?.id).toBe(ctx.assets.identities[0].id)
    expect(ctx.assets.identities.every((i: any) => i.uploadStatus === 'ready' || i.uploadStatus === 'uploading')).toBe(true)
  })

  it('keeps primary logo correct during async uploads', async () => {
    const mockUploadFile = uploadFile as any
    mockUploadFile.mockImplementation((_apiKey: string, _file: File) => {
      return new Promise<string>((resolve) => {
        setTimeout(() => resolve(`https://example.com/uploaded-${_file.name}`), Math.random() * 100 + 20)
      })
    })

    await renderProvider()
    await openSource()

    const files1 = createFileList([createFile('logo1.png')])
    const files2 = createFileList([createFile('logo2.png')])

    await act(async () => {
      ;(window as any).__personalizationCtx.addLogoFiles(files1)
    })

    await act(async () => {
      ;(window as any).__personalizationCtx.addLogoFiles(files2)
    })

    await act(async () => {
      await new Promise((r) => setTimeout(r, 150))
    })

    const ctx = (window as any).__personalizationCtx
    expect(ctx.assets.logos.length).toBe(2)
    expect(ctx.assets.primaryLogo?.id).toBe(ctx.assets.logos[0].id)
    expect(ctx.assets.logos.every((l: any) => l.uploadStatus === 'ready' || l.uploadStatus === 'uploading')).toBe(true)
  })

  it('getGenerationAssetUrl returns undefined for uploading asset', () => {
    const asset = {
      id: '1',
      role: 'logo' as const,
      name: 'logo.png',
      url: 'blob:http://localhost/test',
      isPrimary: false,
      createdAt: new Date().toISOString(),
      uploadStatus: 'uploading' as const,
    }
    expect(getGenerationAssetUrl(asset)).toBeUndefined()
  })

  it('getGenerationAssetUrl returns undefined for failed asset', () => {
    const asset = {
      id: '1',
      role: 'logo' as const,
      name: 'logo.png',
      url: 'blob:http://localhost/test',
      isPrimary: false,
      createdAt: new Date().toISOString(),
      uploadStatus: 'error' as const,
    }
    expect(getGenerationAssetUrl(asset)).toBeUndefined()
  })

  it('getGenerationAssetUrl returns durable URL when ready', () => {
    const asset = {
      id: '1',
      role: 'logo' as const,
      name: 'logo.png',
      url: 'blob:http://localhost/test',
      uploadedUrl: 'https://example.com/logo.png',
      isPrimary: false,
      createdAt: new Date().toISOString(),
      uploadStatus: 'ready' as const,
    }
    expect(getGenerationAssetUrl(asset)).toBe('https://example.com/logo.png')
  })

  it('getGenerationAssetUrl rejects blob URLs even if status is ready', () => {
    const asset = {
      id: '1',
      role: 'logo' as const,
      name: 'logo.png',
      url: 'blob:http://localhost/test',
      isPrimary: false,
      createdAt: new Date().toISOString(),
      uploadStatus: 'ready' as const,
    }
    expect(getGenerationAssetUrl(asset)).toBeUndefined()
  })
})
