'use client'
/**
 * MuapiImageStream — generation / editing progress UI for the Thumbnail Studio
 * backed by the user's MuAPI key (flux-dev etc.), instead of OpenAI.
 *
 * Contract mirrors the old OpenAI-based `ImageStream` (request / onComplete /
 * onError) so the studio can swap implementations without touching the gallery.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { Loader2, Zap } from 'lucide-react'
import { panels, semantic } from '@/shared/styles/designTokens'
import { getImageClient, type MuAPIImageClient, DEFAULT_IMAGE_MODEL } from '@/shared/api/muapiImage'
import type { GenerationRequest, GeneratedImage } from './types'
import { QUALITY_PRESETS } from './types'

interface Props {
  request: GenerationRequest | null   // null = idle
  onComplete: (images: GeneratedImage[]) => void
  onError: (error: string) => void
}

export default function MuapiImageStream({ request, onComplete, onError }: Props) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [step, setStep] = useState('')
  const [progress, setProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const clientRef = useRef<MuAPIImageClient | null>(null)
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(true)

  const qualityPreset = QUALITY_PRESETS.find(q => q.value === request?.quality)

  const run = useCallback(async () => {
    if (!request) return
    const apiKey = request.apiKey
    if (!apiKey) {
      onError('No MuAPI key found. Please add your key in Settings.')
      return
    }

    const safeSet = (fn: () => void) => {
      if (mountedRef.current) fn()
    }

    let client: MuAPIImageClient
    try {
      client = getImageClient(apiKey)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'MuAPI key is required.')
      return
    }
    clientRef.current = client

    safeSet(() => setIsStreaming(true))
    safeSet(() => setProgress(0))
    safeSet(() => setPreviewUrl(null))

    const steps = [
      'Submitting to MuAPI...',
      'Queued...',
      'Generating your thumbnail...',
      'Finalizing image...',
    ]
    let stepIdx = 0
    safeSet(() => setStep(steps[0]))

    // Advance the step label on a timer so the user sees movement while polling.
    const stepTimer = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, steps.length - 1)
      safeSet(() => setStep(steps[stepIdx]))
      safeSet(() => setProgress(p => Math.min(p + 18, 90)))
    }, 4000)
    stepTimerRef.current = stepTimer

    try {
      let imageUrl: string | undefined
      // For edit mode we need the uploaded reference image hosted on MuAPI.
      if (request.mode === 'edit') {
        if (request.referenceImage) {
          safeSet(() => setStep('Uploading reference image...'))
          imageUrl = await client.uploadImage(request.referenceImage)
        }
      }

      const results = await client.generate({
        prompt: request.prompt,
        model: (request.model as string) || DEFAULT_IMAGE_MODEL,
        aspectRatio: request.size.ratio,
        quality: request.quality as 'low' | 'medium' | 'high',
        n: request.n,
        imageUrl,
        strength: request.mode === 'edit' ? 0.6 : 0.45,
        mask: request.mask,
      })

      if (!results.length) {
        onError('No images returned. Please try again.')
        return
      }

      const finalImages: GeneratedImage[] = results.map((r, i) => ({
        id: `${Date.now()}-${i}`,
        url: r.url,
        prompt: request.prompt,
        model: (request.model as GeneratedImage['model']) || DEFAULT_IMAGE_MODEL,
        quality: request.quality,
        format: request.format,
        style: request.style,
        aspectRatio: request.size.ratio,
        width: request.size.width,
        height: request.size.height,
        isPublic: request.isPublic ?? true,
        sessionId: request.sessionId,
        createdAt: new Date().toISOString(),
      }))

      safeSet(() => setPreviewUrl(finalImages[0]?.url || null))
      safeSet(() => setProgress(100))
      safeSet(() => setStep('Done!'))
      onComplete(finalImages)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      clearInterval(stepTimer)
      stepTimerRef.current = null
      setTimeout(() => {
        if (!mountedRef.current) return
        setIsStreaming(false)
        setPreviewUrl(null)
        setProgress(0)
        setStep('')
      }, 1000)
    }
  }, [request, onComplete, onError])

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!request) return
    run()
    return () => {
      clientRef.current?.cancel()
      if (stepTimerRef.current) clearInterval(stepTimerRef.current)
    }
  }, [request, run])

  if (!isStreaming && !previewUrl) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Loader2 size={14} className="animate-spin flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs" style={{ color: semantic.textMuted }}>{step}</span>
            <span className="text-xs font-mono" style={{ color: semantic.textMuted }}>{Math.round(progress)}%</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: 'var(--color-primary)' }}
            />
          </div>
        </div>
        {qualityPreset && (
          <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--color-primary)' }}>
            <Zap size={10} />
            {qualityPreset.speed}
          </div>
        )}
      </div>

      {previewUrl && (
        <div className="relative rounded-xl overflow-hidden" style={panels.card}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Generated thumbnail preview"
            className="w-full object-cover"
            style={{ aspectRatio: `${request?.size.width}/${request?.size.height}` }}
          />
        </div>
      )}
    </div>
  )
}
