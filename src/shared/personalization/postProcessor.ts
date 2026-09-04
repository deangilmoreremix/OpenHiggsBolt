/**
 * Post-Processing Service for Personalization
 *
 * Handles deterministic post-generation compositing:
 * - Exact logo overlay on images and videos
 * - Exact CTA/end-card generation and compositing
 *
 * Uses MuAPI composition endpoints:
 * - add-image-watermark (image logo/CTA overlay)
 * - add-video-watermark (video logo/CTA overlay)
 *
 * For CTA end cards requiring exact text, generates a deterministic
 * canvas image, uploads it, then applies it via MuAPI watermark endpoints.
 */

import { generateI2I, uploadFile } from '@/packages/studio/src/muapi'

// ── Types ────────────────────────────────────────────────────────────────────

export interface PostProcessingInput {
  generatedUrl: string
  type: 'image' | 'video'
  postProcessing: Record<string, unknown>
  apiKey: string
}

export interface PostProcessingResult {
  finalUrl: string | null
  originalUrl: string
  applied: string[]
  failed?: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

// ── Canvas End Card Generation ───────────────────────────────────────────────

export async function generateEndCardImage(
  client: Record<string, unknown> | undefined,
  logoFile?: File | null,
  apiKey?: string,
): Promise<string | null> {
  if (!isBrowser()) return null
  if (!apiKey) return null

  const canvas = document.createElement('canvas')
  canvas.width = 1280
  canvas.height = 720
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // Premium dark background
  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
  bg.addColorStop(0, '#0a0a0f')
  bg.addColorStop(0.5, '#111118')
  bg.addColorStop(1, '#0a0a0f')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Top accent line
  ctx.fillStyle = '#29d3f2'
  ctx.fillRect(0, 0, canvas.width, 4)

  // Bottom accent line
  ctx.fillStyle = '#29d3f2'
  ctx.fillRect(0, canvas.height - 4, canvas.width, 4)

  // Logo (top-right, max 100px height)
  if (logoFile) {
    try {
      const logoUrl = URL.createObjectURL(logoFile)
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load logo'))
        img.src = logoUrl
      })
      const maxHeight = 100
      const scale = Math.min(1, maxHeight / Math.max(1, img.height))
      const w = img.width * scale
      const h = img.height * scale
      ctx.drawImage(img, canvas.width - w - 40, 40, w, h)
      URL.revokeObjectURL(logoUrl)
    } catch {
      // Logo load failed — continue without it
    }
  }

  // Business Name
  const businessName = (client?.businessName as string) || ''
  if (businessName) {
    ctx.fillStyle = '#f7f9fb'
    ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(businessName, canvas.width / 2, 260)
  }

  // CTA Headline
  const ctaHeadline = (client?.ctaHeadline as string) || ''
  if (ctaHeadline) {
    ctx.fillStyle = '#29d3f2'
    ctx.font = 'bold 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(ctaHeadline, canvas.width / 2, 360)
  }

  // Offer
  const offer = (client?.offer as string) || ''
  if (offer) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.font = '32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(offer, canvas.width / 2, 430)
  }

  // Button / Action text
  const buttonText = (client?.callToAction as string) || ctaHeadline || ''
  if (buttonText) {
    const btnWidth = 340
    const btnHeight = 60
    const btnX = (canvas.width - btnWidth) / 2
    const btnY = 500

    ctx.fillStyle = '#29d3f2'
    ctx.beginPath()
    const r = 12
    ctx.moveTo(btnX + r, btnY)
    ctx.lineTo(btnX + btnWidth - r, btnY)
    ctx.quadraticCurveTo(btnX + btnWidth, btnY, btnX + btnWidth, btnY + r)
    ctx.lineTo(btnX + btnWidth, btnY + btnHeight - r)
    ctx.quadraticCurveTo(btnX + btnWidth, btnY + btnHeight, btnX + btnWidth - r, btnY + btnHeight)
    ctx.lineTo(btnX + r, btnY + btnHeight)
    ctx.quadraticCurveTo(btnX, btnY + btnHeight, btnX, btnY + btnHeight - r)
    ctx.lineTo(btnX, btnY + r)
    ctx.quadraticCurveTo(btnX, btnY, btnX + r, btnY)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#051014'
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(buttonText, canvas.width / 2, btnY + btnHeight / 2)
    ctx.textBaseline = 'alphabetic'
  }

  // Phone + Website
  const parts = [client?.phone, client?.website].filter(Boolean)
  if (parts.length > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(parts.join('  |  '), canvas.width / 2, 620)
  }

  // Convert to blob and upload
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/png')
  })
  if (!blob) return null

  const file = new File([blob], 'cta-end-card.png', { type: 'image/png' })
  try {
    const url = await uploadFile(apiKey, file)
    return url
  } catch {
    return null
  }
}

// ── MuAPI Post-Processing Calls ──────────────────────────────────────────────

async function applyImageWatermark(
  apiKey: string,
  imageUrl: string,
  watermarkUrl: string,
  position = 'bottom-right',
  opacity = 0.8,
  scale = 0.2,
): Promise<string | null> {
  try {
    const result = await generateI2I(apiKey, {
      model: 'add-image-watermark',
      prompt: '',
      image_url: imageUrl,
      watermark_image_url: watermarkUrl,
      position,
      opacity,
      scale,
    })
    return (result as any).url || (result as any).output?.url || (result as any).outputs?.[0] || null
  } catch (error) {
    console.error('[Personalization Post-Process] Image watermark failed:', error)
    return null
  }
}

async function applyVideoWatermark(
  apiKey: string,
  videoUrl: string,
  watermarkUrl: string,
): Promise<string | null> {
  try {
    const { processV2V } = await import('@/packages/studio/src/muapi')
    const result = await processV2V(apiKey, {
      model: 'add-video-watermark',
      video_url: videoUrl,
      image_url: watermarkUrl,
    })
    return (result as any).url || (result as any).output?.url || (result as any).outputs?.[0] || null
  } catch (error) {
    console.error('[Personalization Post-Process] Video watermark failed:', error)
    return null
  }
}

// ── Main Post-Processing Entry ───────────────────────────────────────────────

export async function applyPostProcessing(
  input: PostProcessingInput,
): Promise<PostProcessingResult> {
  const { generatedUrl, type, postProcessing, apiKey } = input
  const applied: string[] = []
  let currentUrl = generatedUrl

  const logoUrl = postProcessing.logo as string | undefined
  const endCardUrl = postProcessing.endCard as string | undefined
  const ctaGraphicUrl = postProcessing.ctaGraphic as string | undefined

  // ── Image post-processing ──────────────────────────────────────────────────

  if (type === 'image') {
    // Logo overlay via MuAPI add-image-watermark
    const watermarkSource = logoUrl || ctaGraphicUrl
    if (watermarkSource) {
      const result = await applyImageWatermark(
        apiKey,
        currentUrl,
        watermarkSource,
        'bottom-right',
        0.8,
        0.2,
      )
      if (result) {
        currentUrl = result
        applied.push('logo-overlay')
      } else {
        return {
          finalUrl: currentUrl,
          originalUrl: generatedUrl,
          applied,
          failed: 'logo-overlay',
        }
      }
    }

    // End card overlay for CTA (if endCardUrl is provided and differs from logo)
    if (endCardUrl && endCardUrl !== logoUrl && endCardUrl !== ctaGraphicUrl) {
      const result = await applyImageWatermark(
        apiKey,
        currentUrl,
        endCardUrl,
        'bottom-right',
        1.0,
        0.5,
      )
      if (result) {
        currentUrl = result
        applied.push('end-card-overlay')
      } else {
        return {
          finalUrl: currentUrl,
          originalUrl: generatedUrl,
          applied,
          failed: 'end-card-overlay',
        }
      }
    }
  }

  // ── Video post-processing ──────────────────────────────────────────────────

  if (type === 'video') {
    // Collect watermark sources: logo + CTA graphic + end card
    const watermarkSources = [logoUrl, ctaGraphicUrl, endCardUrl].filter(Boolean) as string[]

    for (const wmUrl of watermarkSources) {
      const result = await applyVideoWatermark(apiKey, currentUrl, wmUrl)
      if (result) {
        currentUrl = result
        applied.push('video-overlay')
      } else {
        return {
          finalUrl: currentUrl,
          originalUrl: generatedUrl,
          applied,
          failed: 'video-overlay',
        }
      }
    }
  }

  return {
    finalUrl: currentUrl,
    originalUrl: generatedUrl,
    applied,
  }
}
