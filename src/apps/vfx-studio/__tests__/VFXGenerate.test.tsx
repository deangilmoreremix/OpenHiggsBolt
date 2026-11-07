// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react'

const uploadImage = vi.fn(async (_source: unknown) => 'https://hosted.test/source.png')
const generateVideo = vi.fn(async (_params: unknown) => null)
const setError = vi.fn()
vi.mock('@/hooks/useVideoGeneration', () => ({
  useVideoGeneration: () => ({
    status: 'idle',
    progress: 0,
    videoUrl: null,
    error: null,
    loading: false,
    requestId: null,
    uploadImage,
    generateVideo,
    cancelVideo: vi.fn(),
    retryVideo: vi.fn(),
    reset: vi.fn(),
    setError,
  }),
}))
vi.mock('@/components/SocialPublishProvider', () => ({ PublishStep: () => null }))
vi.mock('@/components/AiAssistantProvider', () => ({ AssistStep: () => null }))
vi.mock('@/shared/crossStudio', () => ({ readStoryboardHandoff: () => null, clearStoryboardHandoff: () => {} }))

import VFXGenerate from '../pages/VFXGenerate'

const cards = () => document.querySelectorAll('[data-vfx-effect]')

beforeEach(() => {
  cleanup()
  localStorage.clear()
  uploadImage.mockClear()
  generateVideo.mockClear()
  setError.mockClear()
})
afterEach(() => cleanup())

describe('AI VFX Studio page', () => {
  it('shows the banner, the three category pills with their counts and the AI effects grid', () => {
    render(<VFXGenerate apiKey="k" />)
    expect(screen.getByRole('heading', { name: 'AI VFX Studio' })).toBeTruthy()
    expect(screen.getByText(/Hollywood camera moves/)).toBeTruthy()
    const tabs = within(screen.getByRole('tablist'))
    expect(tabs.getByRole('tab', { name: /AI Effects · 64/ })).toBeTruthy()
    expect(tabs.getByRole('tab', { name: /Motion Controls · 47/ })).toBeTruthy()
    expect(tabs.getByRole('tab', { name: /VFX · 9/ })).toBeTruthy()
    expect(cards()).toHaveLength(64)
    expect(screen.getByRole('button', { name: /Generate/ })).toBeTruthy()
  })

  it('switches category and searches within it', () => {
    render(<VFXGenerate apiKey="k" />)
    fireEvent.click(screen.getByRole('tab', { name: /Motion Controls/ }))
    expect(cards()).toHaveLength(47)
    fireEvent.click(screen.getByRole('tab', { name: /VFX · 9/ }))
    expect(cards()).toHaveLength(9)
    fireEvent.change(screen.getByLabelText('Search effects'), { target: { value: 'tornado' } })
    expect(cards()).toHaveLength(1)
    fireEvent.change(screen.getByLabelText('Search effects'), { target: { value: 'zzzz' } })
    expect(cards()).toHaveLength(0)
    expect(screen.getByText(/No effects match/)).toBeTruthy()
  })

  it('asks for an effect, then an image, before generating', async () => {
    render(<VFXGenerate apiKey="k" />)
    fireEvent.click(screen.getByRole('button', { name: /Generate/ }))
    expect(setError).toHaveBeenLastCalledWith('Select an effect first')
    fireEvent.click(document.querySelector('[data-vfx-effect="360 Rotation"]') as Element)
    fireEvent.click(screen.getByRole('button', { name: /Generate/ }))
    expect(setError).toHaveBeenLastCalledWith('Upload an image or paste an image URL first')
    expect(generateVideo).not.toHaveBeenCalled()
  })

  it('re-hosts a pasted image URL and generates with the chosen effect and settings', async () => {
    render(<VFXGenerate apiKey="k" />)
    fireEvent.click(document.querySelector('[data-vfx-effect="360 Rotation"]') as Element)
    fireEvent.change(screen.getByLabelText('Aspect'), { target: { value: '9:16' } })
    fireEvent.change(screen.getByLabelText('Duration'), { target: { value: '10' } })
    fireEvent.change(screen.getByPlaceholderText(/Optional: describe/), { target: { value: 'a red car' } })

    const url = screen.getByLabelText('Image URL')
    fireEvent.change(url, { target: { value: 'https://example.test/car.png' } })
    fireEvent.keyDown(url, { key: 'Enter' })
    await waitFor(() => expect(uploadImage).toHaveBeenCalledWith('https://example.test/car.png'))

    fireEvent.click(screen.getByRole('button', { name: /Generate/ }))
    await waitFor(() => expect(generateVideo).toHaveBeenCalledTimes(1))
    expect(generateVideo.mock.calls[0][0]).toEqual({
      image_url: 'https://hosted.test/source.png',
      effect: '360 Rotation',
      prompt: 'a red car',
      aspect_ratio: '9:16',
      resolution: '480p',
      duration: 10,
      quality: 'medium',
    })
  })

  it('sends no prompt when the user typed none, and rejects a non-http image URL', async () => {
    render(<VFXGenerate apiKey="k" />)
    fireEvent.click(document.querySelector('[data-vfx-effect="Angry"]') as Element)
    const url = screen.getByLabelText('Image URL')
    fireEvent.change(url, { target: { value: 'ftp://nope/x.png' } })
    fireEvent.keyDown(url, { key: 'Enter' })
    expect(setError).toHaveBeenLastCalledWith('Image URL must start with http:// or https://')
    expect(uploadImage).not.toHaveBeenCalled()

    fireEvent.change(url, { target: { value: 'https://example.test/face.png' } })
    fireEvent.keyDown(url, { key: 'Enter' })
    await waitFor(() => expect(uploadImage).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: /Generate/ }))
    await waitFor(() => expect(generateVideo).toHaveBeenCalled())
    expect((generateVideo.mock.calls[0][0] as { prompt?: string }).prompt).toBeUndefined()
  })

  it('asks for the API key instead of generating when there is none', async () => {
    const onRequestApiKey = vi.fn()
    render(<VFXGenerate onRequestApiKey={onRequestApiKey} />)
    fireEvent.click(document.querySelector('[data-vfx-effect="Angry"]') as Element)
    const url = screen.getByLabelText('Image URL')
    fireEvent.change(url, { target: { value: 'https://example.test/face.png' } })
    fireEvent.keyDown(url, { key: 'Enter' })
    await waitFor(() => expect(uploadImage).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: /Generate/ }))
    expect(onRequestApiKey).toHaveBeenCalled()
    expect(generateVideo).not.toHaveBeenCalled()
  })
})
