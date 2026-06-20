'use client'
/**
 * ImageStream — shows progressive image generation / editing via OpenAI streaming
 * Displays partial images as they come in, with a progress overlay
 */
import { useState, useEffect, useCallback } from 'react'
import { Loader2, Zap } from 'lucide-react'
import { panels, semantic } from '@/shared/styles/designTokens'
import { editImageStream } from '@/shared/api/openaiImage'
import type { GenerationRequest, GeneratedImage } from './types'
import { QUALITY_PRESETS } from './types'

interface Props {
  request: GenerationRequest | null   // null = idle
  onComplete: (images: GeneratedImage[]) => void
  onError: (error: string) => void
}

interface PartialState {
  index: number
  url: string
}

export default function ImageStream({ request, onComplete, onError }: Props) {
  const [partials, setPartials] = useState<PartialState[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [step, setStep] = useState('')
  const [progress, setProgress] = useState(0)

  const qualityPreset = QUALITY_PRESETS.find(q => q.value === request?.quality)

  const runStream = useCallback(async () => {
    if (!request) return
    setIsStreaming(true)
    setPartials([])
    setProgress(0)

    const steps = [
      'Sending to gpt-image-2...',
      'Generating base composition...',
      'Refining details...',
      'Finalizing image...',
    ]
    let stepIdx = 0
    setStep(steps[0])

    const stepTimer = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, steps.length - 1)
      setStep(steps[stepIdx])
      setProgress(p => Math.min(p + 20, 85))
    }, 3000)

    const b64ToObjectUrl = async (b64: string) => {
      const blob = await fetch(`data:image/${request.format};base64,${b64}`).then(r => r.blob())
      return URL.createObjectURL(blob)
    }

    const makeGeneratedImage = async (b64: string, index: number): Promise<GeneratedImage> => ({
      id: `${Date.now()}-${index}`,
      url: await b64ToObjectUrl(b64),
      b64,
      prompt: request.prompt,
      model: request.model,
      quality: request.quality,
      format: request.format,
      style: request.style,
      aspectRatio: request.size.ratio,
      width: request.size.width,
      height: request.size.height,
      isPublic: request.isPublic ?? true,
      sessionId: request.sessionId,
      createdAt: new Date().toISOString(),
    })

    try {
      const finalImages: GeneratedImage[] = []

      if (request.mode === 'edit') {
        if (!request.referenceImage) {
          throw new Error('Edit mode requires a reference image')
        }

        for await (const event of editImageStream({
          image: request.referenceImage,
          mask: request.mask,
          prompt: request.prompt,
          model: request.model as 'gpt-image-2',
          n: request.n,
          quality: request.quality,
          size: request.size.openaiSize as any,
          output_format: request.format,
          output_compression: request.compression,
          partial_images: 2,
        })) {
          if (event.partial && event.b64) {
            const url = await b64ToObjectUrl(event.b64)
            setPartials(prev => {
              const next = [...prev]
              next[event.index] = { index: event.index, url }
              return next
            })
            setProgress(p => Math.min(p + 10, 90))
          } else if (event.b64) {
            finalImages.push(await makeGeneratedImage(event.b64, finalImages.length))
          }
        }
      } else {
        // Generate / refine flow
        const OPENAI_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''
        const body: Record<string, any> = {
          model: request.model,
          prompt: request.prompt,
          n: request.n,
          quality: request.quality,
          size: request.size.openaiSize,
          stream: true,
          partial_images: 2,
          output_format: request.format,
        }
        if (request.compression !== undefined && request.format !== 'png') {
          body.output_compression = request.compression
        }

        const res = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })

        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err?.error?.message || 'Generation failed')
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (raw === '[DONE]') continue
            try {
              const event = JSON.parse(raw)

              // Partial image preview
              if (event.type === 'image_generation.partial_image' && event.b64_json) {
                const url = await b64ToObjectUrl(event.b64_json)
                setPartials(prev => {
                  const next = [...prev]
                  next[event.partial_image_index] = { index: event.partial_image_index, url }
                  return next
                })
                setProgress(p => Math.min(p + 10, 90))
              }

              // Final images
              if (event.data) {
                for (const img of event.data) {
                  if (img.b64_json) {
                    finalImages.push(await makeGeneratedImage(img.b64_json, finalImages.length))
                  }
                }
              }
            } catch {}
          }
        }
      }

      setProgress(100)
      setStep('Done!')
      if (finalImages.length > 0) {
        onComplete(finalImages)
      } else {
        onError('No images returned. Please try again.')
      }
    } catch (err: any) {
      onError(err.message || 'Request failed')
    } finally {
      clearInterval(stepTimer)
      setTimeout(() => {
        setIsStreaming(false)
        setPartials([])
        setProgress(0)
        setStep('')
      }, 1000)
    }
  }, [request, onComplete, onError])

  useEffect(() => {
    if (request) runStream()
  }, [request])

  if (!isStreaming && partials.length === 0) return null

  return (
    <div className="space-y-3">
      {/* Progress bar */}
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
        <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--color-primary)' }}>
          <Zap size={10} />
          {qualityPreset?.speed}
        </div>
      </div>

      {/* Partial previews */}
      {partials.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {partials.map((p, i) => p && (
            <div key={i} className="relative rounded-xl overflow-hidden animate-pulse" style={panels.card}>
              <img src={p.url} alt={`Preview ${i + 1}`} className="w-full object-cover opacity-70" style={{ aspectRatio: `${request?.size.width}/${request?.size.height}` }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="px-2 py-1 rounded-full text-xs" style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.7)' }}>
                  Generating...
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
