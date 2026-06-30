import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

vi.mock('@/lib/muapi', () => ({
  pollForResult: vi.fn(),
  submitAndPoll: vi.fn(),
}))

import { pollForResult } from '@/lib/muapi'
import { usePollResult } from '../hooks/usePollResult.js'
import { useSubmitAndPoll } from '../hooks/useSubmitAndPoll.js'

describe('usePollResult', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    pollForResult.mockReset()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('calls fetch with the right URL by delegating to pollForResult', async () => {
    pollForResult.mockResolvedValue({ outputs: ['https://x/1.png'], status: 'completed' })

    const { result } = renderHook(() =>
      usePollResult({ requestId: 'req-123', apiKey: 'k', maxAttempts: 5, interval: 10 })
    )
    expect(result.current.status).toBe('polling')
    await act(async () => {
      await vi.runAllTimersAsync()
    })
    expect(pollForResult).toHaveBeenCalledWith('req-123', 'k', 5, 10)
  })

  it('stops on succeeded status', async () => {
    pollForResult.mockResolvedValue({ outputs: ['x'], status: 'completed' })
    const onComplete = vi.fn()
    const { result } = renderHook(() =>
      usePollResult({ requestId: 'req-1', apiKey: 'k', maxAttempts: 5, interval: 10, onComplete })
    )
    await act(async () => {
      await vi.runAllTimersAsync()
    })
    expect(result.current.status).toBe('succeeded')
    expect(result.current.data).toEqual({ outputs: ['x'], status: 'completed' })
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('cancellation aborts the loop and reports cancelled status', async () => {
    let resolvePoll
    pollForResult.mockImplementation(
      () => new Promise((resolve) => { resolvePoll = resolve })
    )
    const { result } = renderHook(() =>
      usePollResult({ requestId: 'req-2', apiKey: 'k', maxAttempts: 5, interval: 10 })
    )
    expect(result.current.status).toBe('polling')
    act(() => { result.current.cancel() })
    expect(result.current.status).toBe('cancelled')

    await act(async () => {
      resolvePoll({ outputs: [], status: 'completed' })
      await vi.runAllTimersAsync()
    })
    expect(result.current.data).toBeNull()
  })
})

describe('useSubmitAndPoll', () => {
  beforeEach(() => {
    pollForResult.mockReset()
    global.fetch = vi.fn()
  })

  it('builds the request body and polls on submit', async () => {
    pollForResult.mockResolvedValue({ outputs: ['https://x/1.png'], status: 'completed' })
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ request_id: 'rid-1' }),
    })
    const onRequestId = vi.fn()
    const { result } = renderHook(() =>
      useSubmitAndPoll({
        endpoint: 'nano-banana',
        apiKey: 'k',
        payload: { prompt: 'hi', aspect_ratio: '1:1' },
        onRequestId,
        maxAttempts: 5,
        interval: 10,
      })
    )
    await act(async () => { await result.current.submit() })
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/nano-banana',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ prompt: 'hi', aspect_ratio: '1:1' }),
      })
    )
    const fetchCall = global.fetch.mock.calls[0]
    const headers = fetchCall[1].headers
    expect(headers['x-api-key']).toBe('k')
    expect(headers['Content-Type']).toBe('application/json')
    expect(onRequestId).toHaveBeenCalledWith('rid-1')
    expect(pollForResult).toHaveBeenCalledWith('rid-1', 'k', 5, 10)
    expect(result.current.status).toBe('succeeded')
    expect(result.current.data).toEqual({
      outputs: ['https://x/1.png'],
      status: 'completed',
      url: 'https://x/1.png',
    })
  })
})
