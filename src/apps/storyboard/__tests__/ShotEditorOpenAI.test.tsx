// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const generateOpenAiPanel = vi.fn()
const generateShotFrame = vi.fn(async () => 'https://cdn.example.com/muapi-frame.png')
const saveUploadedFile = vi.fn(async () => ({ url: 'https://store.example.com/panel.png' }))
vi.mock('@/api/storyboardOpenAI', () => ({
  generateOpenAiPanel: (...a: unknown[]) => generateOpenAiPanel(...a),
  listOpenAiStoryboardModels: async () => ({
    models: [{ id: 'gpt-image-2.5-flare', label: 'Flare (fast)' }, { id: 'gpt-image-2.5-sunburst', label: 'Sunburst (detailed)' }],
    default: 'gpt-image-2.5-flare',
  }),
}))
vi.mock('@/api/storyboard', () => ({ generateShotFrame: (...a: unknown[]) => generateShotFrame(...(a as [])) }))
vi.mock('studio/src/lib/assetStore.js', () => ({ saveUploadedFile: (...a: unknown[]) => saveUploadedFile(...(a as [])) }))
vi.mock('@/components/SocialPublishProvider', () => ({ PublishStep: () => null }))
vi.mock('../exportUtils', () => ({ exportGif: vi.fn(async () => 1) }))

import { StoryboardProvider } from '../StoryboardContext'
import ShotEditor from '../pages/ShotEditor'

const DATA_URL = `data:image/png;base64,${btoa('png-bytes')}`

function seed(shots: unknown[], characters: unknown[] = []) {
  localStorage.setItem(
    'storyboard_context',
    JSON.stringify({ projectId: 'p1', projectName: 'Demo', shots, characters, projects: [{ id: 'p1', projectName: 'Demo' }], aspectRatio: '16:9' }),
  )
}

function renderEditor() {
  return render(
    <MemoryRouter>
      <StoryboardProvider>
        <ShotEditor />
      </StoryboardProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  cleanup()
  localStorage.clear()
  generateOpenAiPanel.mockReset().mockResolvedValue(DATA_URL)
  generateShotFrame.mockClear()
  saveUploadedFile.mockClear()
})
afterEach(() => cleanup())

describe('ShotEditor with the OpenAI frame engine', () => {
  it('generates a panel with the chosen model, tagged character references, and keeps a hosted copy', async () => {
    seed(
      [{ id: 's1', scene: 'A fox crosses a bridge', duration: 3, characterIds: ['c1'] }],
      [{ id: 'c1', name: 'Fox', description: 'a small red fox', referenceImageUrl: 'https://store.example.com/fox.png' }],
    )
    renderEditor()
    fireEvent.click(await screen.findByRole('button', { name: 'OpenAI Images' }))
    const model = await screen.findByLabelText('OpenAI image model')
    await waitFor(() => expect((model as HTMLSelectElement).value).toBe('gpt-image-2.5-flare'))
    fireEvent.change(model, { target: { value: 'gpt-image-2.5-sunburst' } })

    fireEvent.click(screen.getByRole('button', { name: /Frame/ }))
    await waitFor(() => expect(generateOpenAiPanel).toHaveBeenCalledTimes(1))
    const args = generateOpenAiPanel.mock.calls[0][0]
    expect(args).toMatchObject({ model: 'gpt-image-2.5-sunburst', aspect_ratio: '16:9', quality: 'medium', reference_urls: ['https://store.example.com/fox.png'] })
    expect(args.prompt).toContain('A fox crosses a bridge')
    expect(args.prompt).toContain('Reference image 1 shows Fox')
    expect(generateShotFrame).not.toHaveBeenCalled()

    // The data URL is swapped for the hosted copy.
    await waitFor(() => expect(screen.getByAltText('frame 1').getAttribute('src')).toBe('https://store.example.com/panel.png'))
    expect(saveUploadedFile).toHaveBeenCalled()
  })

  it('edits the current frame in place', async () => {
    seed([{ id: 's1', scene: 'A fox crosses a bridge', duration: 3, frameUrl: 'https://store.example.com/old.png' }])
    renderEditor()
    fireEvent.click(await screen.findByRole('button', { name: 'OpenAI Images' }))
    const input = await screen.findByPlaceholderText(/Change this frame/)
    fireEvent.change(input, { target: { value: 'make it night' } })
    fireEvent.click(screen.getByRole('button', { name: /Edit/ }))
    await waitFor(() => expect(generateOpenAiPanel).toHaveBeenCalled())
    expect(generateOpenAiPanel.mock.calls[0][0]).toMatchObject({ prompt: 'make it night', image_url: 'https://store.example.com/old.png' })
  })

  it('keeps using MuAPI by default', async () => {
    seed([{ id: 's1', scene: 'A fox crosses a bridge', duration: 3 }])
    renderEditor()
    fireEvent.click(await screen.findByRole('button', { name: /Frame/ }))
    await waitFor(() => expect(generateShotFrame).toHaveBeenCalledTimes(1))
    expect(generateOpenAiPanel).not.toHaveBeenCalled()
  })
})
