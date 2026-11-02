// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { DemoPersonalizeProvider, useDemoPersonalize } from '../DemoPersonalizeProvider'

beforeAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
})

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

// The clip lengths the preview should follow.
const clipSeconds: Record<string, number> = {
  'https://cdn.example.com/recast-20s.mp4': 20,
  'https://cdn.example.com/original-5s.mp4': 5,
}
vi.mock('../preview/fitSettingsToClip', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../preview/fitSettingsToClip')>()),
  readClipMetadata: vi.fn(async (url: string) =>
    clipSeconds[url] ? { durationSeconds: clipSeconds[url], width: 1920, height: 1080 } : null),
}))

vi.mock('../postProcessor', () => ({
  applyPostProcessing: vi.fn(),
  generateEndCardImage: vi.fn(),
}))

vi.mock('studio/src/muapi', () => ({
  uploadFile: vi.fn(),
}))

function Capture() {
  ;(window as any).__ctx = useDemoPersonalize()
  return null
}

const ctx = () => (window as any).__ctx
const ORIGINAL = 'https://cdn.example.com/original-5s.mp4'
const RECAST = 'https://cdn.example.com/recast-20s.mp4'

describe('applying a recast sets the preview length', () => {
  let root: ReturnType<typeof createRoot>
  let container: HTMLDivElement

  beforeEach(async () => {
    localStorage.clear()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
      root.render(<DemoPersonalizeProvider><Capture /></DemoPersonalizeProvider>)
    })
    await act(async () => {
      ctx().openPersonalize({
        source: { id: 'demo-len', title: 'Demo', mediaType: 'video', originalPrompt: 'p', sourceMedia: ORIGINAL, poster: null, fullPrompt: 'p', shortPrompt: 'p', sourceType: 'landing-demo', sourceMetadata: {} },
        initialAssets: {
          presenterVideos: [{ id: 'pv-1', url: RECAST, name: 'Recast', type: 'presenter_video', source: 'url', mimeType: 'video/mp4' }],
        },
      })
    })
    await act(async () => {
      ctx().setPreviewVideo({ url: ORIGINAL, poster: null, title: 'Original', kind: 'demo' })
    })
    await act(async () => {
      ctx().updatePreviewComposition({ durationInFrames: 5 * ctx().previewSettings.fps })
    })
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  it('a longer saved recast runs at its own length, and undo goes back to the original length', async () => {
    const fps = ctx().previewSettings.fps
    expect(ctx().previewSettings.durationInFrames).toBe(5 * fps)

    await act(async () => {
      ctx().applyPresenterVideo('pv-1')
    })
    expect(ctx().previewVideo.url).toBe(RECAST)
    expect(ctx().previewSettings.durationInFrames).toBe(20 * fps)

    await act(async () => {
      ctx().restoreOriginalVideo()
    })
    expect(ctx().previewVideo.url).toBe(ORIGINAL)
    expect(ctx().previewSettings.durationInFrames).toBe(5 * fps)
  })

  it('undo with no chosen video goes back to the demo video and its length', async () => {
    const fps = ctx().previewSettings.fps
    await act(async () => {
      ctx().setPreviewVideo(null)
    })
    await act(async () => {
      ctx().applyPresenterVideo('pv-1')
    })
    expect(ctx().previewSettings.durationInFrames).toBe(20 * fps)

    await act(async () => {
      ctx().restoreOriginalVideo()
    })
    expect(ctx().previewVideo).toBeNull()
    expect(ctx().previewSettings.durationInFrames).toBe(5 * fps)
  })
})
