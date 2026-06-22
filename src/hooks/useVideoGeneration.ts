/**
 * React hook for end-to-end VFX video generation.
 *
 * Exposes:
 *   uploadImage(source: File | string) -> Promise<string | null>
 *   generateVideo(params: GenerationRequest) -> Promise<string | null>
 *   cancelVideo() -> void
 *   retryVideo() -> void
 *   progress, status, videoUrl, error, loading, requestId
 *
 * Persists the active request ID and settings to localStorage for refresh recovery.
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  GenerationRequest,
  GenerationState,
  GenerationStatus,
  UseVideoGenerationReturn,
} from '@/types/vfx'

const STORAGE_KEY = 'vfx_generation_state'
const POLL_INTERVAL_MS = 5000
const MAX_POLL_ATTEMPTS = 72 // ~6 minutes at 5s intervals

interface PersistedState {
  requestId: string | null
  effect?: string
  imageUrl?: string
  prompt?: string
  aspectRatio?: string
  resolution?: string
  duration?: number
  quality?: string
  videoUrl?: string
  status: GenerationState
}

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024

function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const ext = parsed.pathname.split('.').pop()?.toLowerCase() || ''
    return ['jpg', 'jpeg', 'png', 'webp'].includes(ext)
  } catch {
    return false
  }
}

function validateFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'File must be an image'
  }
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return 'Invalid image format. Allowed: jpg, jpeg, png, webp'
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: 20MB`
  }
  return null
}

function loadPersistedState(): PersistedState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PersistedState) : null
  } catch {
    return null
  }
}

function savePersistedState(state: PersistedState) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota errors
  }
}

export function useVideoGeneration(): UseVideoGenerationReturn {
  const [status, setStatus] = useState<GenerationState>('idle')
  const [progress, setProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [requestId, setRequestId] = useState<string | null>(null)

  const lastRequestRef = useRef<GenerationRequest | null>(null)
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef(false)

  const clearPoll = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current)
      pollTimeoutRef.current = null
    }
  }, [])

  const updateStatus = useCallback(
    (next: GenerationState, opts?: { progress?: number; error?: string | null; videoUrl?: string | null }) => {
      setStatus(next)
      if (opts?.progress !== undefined) setProgress(opts.progress)
      if (opts?.error !== undefined) setError(opts.error)
      if (opts?.videoUrl !== undefined) setVideoUrl(opts.videoUrl)
    },
    []
  )

  const persist = useCallback(
    (state: Partial<PersistedState>) => {
      savePersistedState({
        requestId,
        status,
        ...(lastRequestRef.current || {}),
        videoUrl: videoUrl || undefined,
        ...state,
      })
    },
    [requestId, status, videoUrl]
  )

  const uploadImage = useCallback(async (source: File | string): Promise<string | null> => {
    setError(null)

    if (typeof source === 'string') {
      if (!isValidImageUrl(source)) {
        setError('Invalid image URL. Must end in .jpg, .jpeg, .png, or .webp')
        return null
      }
      return source
    }

    const validationError = validateFile(source)
    if (validationError) {
      setError(validationError)
      return null
    }

    setStatus('uploading')
    setProgress(0)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', source)

      const res = await fetch('/api/vfx/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json().catch(() => ({ error: 'Upload failed' }))

      if (!res.ok) {
        throw new Error(data.error || `Upload failed: ${res.status}`)
      }

      if (!data.url || typeof data.url !== 'string') {
        throw new Error('No URL returned from upload')
      }

      setStatus('idle')
      setProgress(100)
      return data.url
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setError(message)
      setStatus('failed')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const poll = useCallback(
    async (id: string) => {
      abortRef.current = false
      let attempts = 0

      const tick = async () => {
        if (abortRef.current) return
        attempts += 1

        if (attempts > MAX_POLL_ATTEMPTS) {
          setError('Generation timed out. Please try again.')
          setStatus('failed')
          setLoading(false)
          persist({ requestId: id, status: 'failed' })
          return
        }

        try {
          const res = await fetch(`/api/vfx/status?id=${id}`)
          const data: GenerationStatus = await res.json().catch(() => ({ status: 'failed', error: 'Invalid status response' } as GenerationStatus))

          if (!res.ok) {
            throw new Error(data.error || `Status check failed: ${res.status}`)
          }

          if (abortRef.current) return

          if (data.status === 'completed') {
            if (!data.video_url) {
              throw new Error('Generation completed but no video URL was returned')
            }
            setStatus('completed')
            setVideoUrl(data.video_url)
            setProgress(100)
            setLoading(false)
            persist({ requestId: id, status: 'completed', videoUrl: data.video_url })
            return
          }

          if (data.status === 'failed') {
            throw new Error(data.error || 'Generation failed')
          }

          if (data.status === 'cancelled') {
            setStatus('cancelled')
            setLoading(false)
            persist({ requestId: id, status: 'cancelled' })
            return
          }

          const progressEstimate = data.status === 'processing' ? Math.min(90, 10 + Math.round(Date.now() / 1000) % 80) : 5
          setProgress(progressEstimate)
          setStatus(data.status)
          persist({ requestId: id, status: data.status })

          pollTimeoutRef.current = setTimeout(tick, POLL_INTERVAL_MS)
        } catch (err) {
          if (abortRef.current) return
          const message = err instanceof Error ? err.message : 'Polling failed'
          setError(message)
          setStatus('failed')
          setLoading(false)
          persist({ requestId: id, status: 'failed' })
        }
      }

      tick()
    },
    [persist]
  )

  const generateVideo = useCallback(
    async (params: GenerationRequest): Promise<string | null> => {
      clearPoll()
      abortRef.current = false
      setError(null)
      setVideoUrl(null)
      setProgress(0)
      setLoading(true)
      setStatus('queued')
      lastRequestRef.current = params

      try {
        const res = await fetch('/api/vfx/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        })

        const data = await res.json().catch(() => ({ error: 'Generation failed' }))

        if (!res.ok) {
          throw new Error(data.error || `Generation failed: ${res.status}`)
        }

        const id = data.request_id
        if (!id) {
          throw new Error('No request ID returned from generation')
        }

        setRequestId(id)
        persist({ requestId: id, status: 'queued', ...params })
        poll(id)
        return id
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Generation failed'
        setError(message)
        setStatus('failed')
        setLoading(false)
        return null
      }
    },
    [clearPoll, persist, poll]
  )

  const cancelVideo = useCallback(async () => {
    abortRef.current = true
    clearPoll()

    try {
      await fetch('/api/vfx/cancel', { method: 'POST' })
    } catch {
      // ignore
    }

    setStatus('cancelled')
    setLoading(false)
    setProgress(0)
    if (requestId) {
      persist({ requestId, status: 'cancelled' })
    }
  }, [clearPoll, persist, requestId])

  const retryVideo = useCallback(() => {
    if (!lastRequestRef.current) {
      setError('No previous generation to retry')
      return
    }
    generateVideo(lastRequestRef.current)
  }, [generateVideo])

  const reset = useCallback(() => {
    clearPoll()
    abortRef.current = true
    setStatus('idle')
    setProgress(0)
    setVideoUrl(null)
    setError(null)
    setLoading(false)
    setRequestId(null)
    lastRequestRef.current = null
    savePersistedState({ requestId: null, status: 'idle' })
  }, [clearPoll])

  // Recover state after browser refresh
  useEffect(() => {
    const saved = loadPersistedState()
    if (!saved || !saved.requestId) return

    setRequestId(saved.requestId)
    setStatus(saved.status)
    if (saved.videoUrl) setVideoUrl(saved.videoUrl)

    if (saved.status === 'queued' || saved.status === 'processing') {
      lastRequestRef.current = {
        image_url: saved.imageUrl || '',
        effect: saved.effect || '',
        prompt: saved.prompt,
        aspect_ratio: saved.aspectRatio as any,
        resolution: saved.resolution as any,
        duration: saved.duration,
        quality: saved.quality as any,
      }
      setLoading(true)
      poll(saved.requestId)
    }

    return clearPoll
  }, [clearPoll, poll])

  return {
    status,
    progress,
    videoUrl,
    error,
    loading,
    requestId,
    setError,
    uploadImage,
    generateVideo,
    cancelVideo,
    retryVideo,
    reset,
  }
}
