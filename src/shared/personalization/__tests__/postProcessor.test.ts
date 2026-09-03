// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { applyPostProcessing, generateEndCardImage } from '../postProcessor'

vi.mock('@/packages/studio/src/muapi', () => ({
  generateI2I: vi.fn(),
  uploadFile: vi.fn(),
  processV2V: vi.fn(),
}))

const mockGenerateI2I = await import('@/packages/studio/src/muapi').then(m => m.generateI2I) as any
const mockUploadFile = await import('@/packages/studio/src/muapi').then(m => m.uploadFile) as any
const mockProcessV2V = await import('@/packages/studio/src/muapi').then(m => m.processV2V) as any

describe('applyPostProcessing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('applies image logo watermark via add-image-watermark', async () => {
    mockGenerateI2I.mockResolvedValue({ url: 'https://example.com/watermarked-image.png' })

    const result = await applyPostProcessing({
      generatedUrl: 'https://example.com/generated-image.png',
      type: 'image',
      postProcessing: { logo: 'https://example.com/logo.png' },
      apiKey: 'test-key',
    })

    expect(mockGenerateI2I).toHaveBeenCalledWith('test-key', expect.objectContaining({
      model: 'add-image-watermark',
      image_url: 'https://example.com/generated-image.png',
      watermark_image_url: 'https://example.com/logo.png',
    }))
    expect(result.finalUrl).toBe('https://example.com/watermarked-image.png')
    expect(result.applied).toContain('logo-overlay')
    expect(result.originalUrl).toBe('https://example.com/generated-image.png')
  })

  it('falls back to original image when image watermark fails', async () => {
    mockGenerateI2I.mockResolvedValue({})

    const result = await applyPostProcessing({
      generatedUrl: 'https://example.com/generated-image.png',
      type: 'image',
      postProcessing: { logo: 'https://example.com/logo.png' },
      apiKey: 'test-key',
    })

    expect(result.finalUrl).toBe('https://example.com/generated-image.png')
    expect(result.failed).toBe('logo-overlay')
  })

  it('applies video watermark via add-video-watermark', async () => {
    mockProcessV2V.mockResolvedValue({ url: 'https://example.com/watermarked-video.mp4' })

    const result = await applyPostProcessing({
      generatedUrl: 'https://example.com/generated-video.mp4',
      type: 'video',
      postProcessing: { logo: 'https://example.com/logo.png' },
      apiKey: 'test-key',
    })

    expect(mockProcessV2V).toHaveBeenCalledWith('test-key', expect.objectContaining({
      model: 'add-video-watermark',
      video_url: 'https://example.com/generated-video.mp4',
      image_url: 'https://example.com/logo.png',
    }))
    expect(result.finalUrl).toBe('https://example.com/watermarked-video.mp4')
    expect(result.applied).toContain('video-overlay')
  })

  it('applies multiple overlays sequentially for video', async () => {
    mockProcessV2V
      .mockResolvedValueOnce({ url: 'https://example.com/video-with-logo.mp4' })
      .mockResolvedValueOnce({ url: 'https://example.com/video-with-logo-and-cta.mp4' })

    const result = await applyPostProcessing({
      generatedUrl: 'https://example.com/generated-video.mp4',
      type: 'video',
      postProcessing: {
        logo: 'https://example.com/logo.png',
        endCard: 'https://example.com/cta-card.png',
      },
      apiKey: 'test-key',
    })

    expect(mockProcessV2V).toHaveBeenCalledTimes(2)
    expect(result.finalUrl).toBe('https://example.com/video-with-logo-and-cta.mp4')
    expect(result.applied).toEqual(['video-overlay', 'video-overlay'])
  })

  it('stops on first video overlay failure and returns current URL', async () => {
    mockProcessV2V
      .mockResolvedValueOnce({ url: 'https://example.com/video-with-logo.mp4' })
      .mockResolvedValueOnce({})

    const result = await applyPostProcessing({
      generatedUrl: 'https://example.com/generated-video.mp4',
      type: 'video',
      postProcessing: {
        logo: 'https://example.com/logo.png',
        endCard: 'https://example.com/cta-card.png',
      },
      apiKey: 'test-key',
    })

    expect(mockProcessV2V).toHaveBeenCalledTimes(2)
    expect(result.finalUrl).toBe('https://example.com/video-with-logo.mp4')
    expect(result.failed).toBe('video-overlay')
  })

  it('returns original URL when no post-processing is requested', async () => {
    const result = await applyPostProcessing({
      generatedUrl: 'https://example.com/generated.png',
      type: 'image',
      postProcessing: {},
      apiKey: 'test-key',
    })

    expect(result.finalUrl).toBe('https://example.com/generated.png')
    expect(result.originalUrl).toBe('https://example.com/generated.png')
    expect(result.applied).toEqual([])
  })
})

describe('generateEndCardImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUploadFile.mockResolvedValue('https://example.com/end-card.png')
  })

  it('generates a canvas end card and uploads it', async () => {
    // Mock document.createElement for canvas
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: () => ({
        createLinearGradient: () => ({
          addColorStop: () => {},
        }),
        fillRect: () => {},
        fillText: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        quadraticCurveTo: () => {},
        closePath: () => {},
        fill: () => {},
        textAlign: '',
        textBaseline: '',
        font: '',
        fillStyle: '',
      }),
      toBlob: (cb) => cb(new Blob(['test'], { type: 'image/png' })),
    }

    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return mockCanvas as any
      return originalCreateElement(tag)
    })

    const result = await generateEndCardImage(
      {
        businessName: 'ABC Roofing',
        callToAction: 'Protect Your Home Today',
        offer: 'Free Roof Inspection',
        phone: '555-555-5555',
        website: 'abcroofing.com',
      },
      null,
      'test-key',
    )

    expect(mockUploadFile).toHaveBeenCalledWith('test-key', expect.any(File))
    expect(result).toBe('https://example.com/end-card.png')
  })
})
