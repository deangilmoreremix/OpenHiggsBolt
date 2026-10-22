import React, { useCallback, useEffect, useState } from 'react'
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Internals,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import { Video, Audio } from '@remotion/media'
import { fontStackById, isImageLayerKind, toBox } from './presets'
import {
  clearPreviewMediaFailure,
  emitPreviewMediaFailure,
  previewMediaLabel,
} from './previewMediaEvents'
import {
  getRemotionDesign,
  resolveRemotionDesignProps,
  type RemotionDesign,
} from '../remotion/registry'
import type {
  PreviewAnimationId,
  PreviewInputProps,
  PreviewLayer,
  PersonalizationPreviewSettings,
} from './types'

const TEXT_LAYER_KINDS: PreviewLayer['kind'][] = [
  'businessName',
  'headline',
  'offer',
  'cta',
  'tagline',
]

const PILL_TEXT_COLOR = '#041014'

/**
 * The <Player> does not provide remotion's internal SequenceManager context and
 * never consumes its sequence registry. Remotion's media components still
 * attempt to register themselves when NODE_ENV === "test" (outside the Studio),
 * which throws without a provider. A stable local no-op keeps the composition
 * renderable under jsdom/vitest without changing browser behavior.
 */
const NOOP_SEQUENCE_MANAGER = {
  registerSequence: () => {},
  unregisterSequence: () => {},
  sequences: [],
}

interface EntranceState {
  opacity: number
  scale: number
  translateX: number
  translateY: number
}

/**
 * Frame-local entrance progress. Spring-based animations read progress from
 * `startFrame + animationDelay`; fade/slide animations ease across 15 frames.
 */
function entranceFor(layer: PreviewLayer, frame: number, fps: number): EntranceState {
  const entryStart = layer.startFrame + layer.animationDelay
  const eased = interpolate(frame, [entryStart, entryStart + 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })
  const springProgress = spring({
    frame: Math.max(0, frame - entryStart),
    fps: Math.max(1, fps),
    config: { damping: 200 },
  })

  const animation: PreviewAnimationId = layer.animation
  switch (animation) {
    case 'none':
      return { opacity: 1, scale: 1, translateX: 0, translateY: 0 }
    case 'fade':
      return { opacity: eased, scale: 1, translateX: 0, translateY: 0 }
    case 'slide-up':
      return { opacity: eased, scale: 1, translateX: 0, translateY: (1 - eased) * 40 }
    case 'slide-down':
      return { opacity: eased, scale: 1, translateX: 0, translateY: -(1 - eased) * 40 }
    case 'slide-left':
      return { opacity: eased, scale: 1, translateX: (1 - eased) * 60, translateY: 0 }
    case 'pop':
      return { opacity: eased, scale: 0.6 + 0.4 * springProgress, translateX: 0, translateY: 0 }
    case 'logo-reveal':
      return { opacity: eased, scale: 0.85 + 0.15 * springProgress, translateX: 0, translateY: 0 }
    case 'lower-third':
      return { opacity: eased, scale: 1, translateX: -(1 - eased) * 30, translateY: 0 }
    case 'cta-pulse': {
      const pulse = interpolate(Math.sin((frame - entryStart) / 6), [-1, 1], [0.97, 1.03])
      return { opacity: eased, scale: pulse, translateX: 0, translateY: 0 }
    }
    default:
      return { opacity: eased, scale: 1, translateX: 0, translateY: 0 }
  }
}

function resolveLayerText(layer: PreviewLayer, brand: PreviewInputProps['brand']): string {
  switch (layer.kind) {
    case 'businessName':
      return layer.text ?? brand.businessName
    case 'headline':
      return layer.text ?? brand.headline
    case 'tagline':
      return layer.text ?? brand.headline
    case 'offer':
      return layer.text ?? brand.offer
    case 'cta':
      return layer.text ?? brand.cta
    default:
      return layer.text ?? ''
  }
}

function resolveLayerImageUrl(
  layer: PreviewLayer,
  brand: PreviewInputProps['brand'],
): string {
  if (layer.imageUrl) return layer.imageUrl
  if (layer.kind === 'serviceImage') return brand.serviceUrl ?? brand.productUrl ?? ''
  if (layer.kind === 'productImage') return brand.productUrl ?? brand.serviceUrl ?? ''
  if (layer.kind === 'logo') return brand.logoUrl ?? ''
  return ''
}

const EndCard: React.FC<{
  settings: PersonalizationPreviewSettings
  brand: PreviewInputProps['brand']
}> = ({ settings, brand }) => {
  const frame = useCurrentFrame()
  const fade = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })
  const logoUrl = brand.logoUrl
  const contactLine = [brand.phone, brand.website].filter((value) => value && value.trim()).join('   ·   ')
  const ctaText = brand.cta && brand.cta.trim() ? brand.cta : ''

  return (
    <AbsoluteFill
      style={{
        background: settings.brandColors.primary,
        opacity: 0.92 * fade,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Math.round(settings.height * 0.02),
        pointerEvents: 'none',
      }}
    >
      {logoUrl ? (
        <Img
          src={logoUrl}
          style={{
            width: Math.round(settings.width * 0.18),
            height: Math.round(settings.width * 0.18),
            objectFit: 'contain',
          }}
        />
      ) : null}
      {brand.businessName ? (
        <div
          style={{
            fontFamily: fontStackById(),
            color: PILL_TEXT_COLOR,
            fontSize: Math.round(settings.height * 0.055),
            fontWeight: 800,
            lineHeight: 1.15,
            textAlign: 'center',
            wordBreak: 'break-word',
            width: '90%',
          }}
        >
          {brand.businessName}
        </div>
      ) : null}
      {contactLine ? (
        <div
          style={{
            fontFamily: fontStackById(),
            color: PILL_TEXT_COLOR,
            fontSize: Math.round(settings.height * 0.032),
            fontWeight: 600,
            lineHeight: 1.2,
            textAlign: 'center',
          }}
        >
          {contactLine}
        </div>
      ) : null}
      {ctaText ? (
        <div style={{ width: '100%', textAlign: 'center' }}>
          <span
            style={{
              background: settings.brandColors.accent,
              color: PILL_TEXT_COLOR,
              padding: '0.4em 1.1em',
              borderRadius: 999,
              display: 'inline-block',
              fontFamily: fontStackById(),
              fontSize: Math.round(settings.height * 0.036),
              fontWeight: 800,
            }}
          >
            {ctaText}
          </span>
        </div>
      ) : null}
    </AbsoluteFill>
  )
}

/**
 * Draws a registered Remotion design.
 *
 * The design owns its own props: the caller (the wizard) resolves them from
 * the customer's business data and their own edits, and the registry already
 * merged them over the design's defaults. This wrapper only exists so the
 * design's component and its props are mounted in one place.
 */
const RemotionDesignLayer: React.FC<{
  design: RemotionDesign
  props: Record<string, unknown>
}> = ({ design, props }) => {
  const DesignComponent = design.component
  return <DesignComponent {...props} />
}

/**
 * Free, browser-based personalization preview composition. Renders the selected
 * source video (or poster image) as the background layer with the customer's
 * branding overlays on top. Never calls any paid API.
 *
 * When a Remotion design is selected, the design REPLACES the built-in layer
 * stack — exactly like the browser export does — so the preview and the
 * exported video show the same thing:
 *   - an `overlay` design is drawn transparently on top of the customer's
 *     actual video (the video keeps its own audio);
 *   - a `full-frame` design owns the frame, so the footage is not drawn
 *     underneath it.
 */
export const PersonalizationComposition: React.FC<PreviewInputProps> = ({
  videoUrl,
  posterUrl,
  isImageSource,
  audioUrl,
  settings,
  brand,
  remotionDesignId,
  remotionDesignProps,
}) => {
  const frame = useCurrentFrame()
  const videoConfig = useVideoConfig()
  const compW = settings.width > 0 ? settings.width : videoConfig.width
  const compH = settings.height > 0 ? settings.height : videoConfig.height
  const [mediaFailed, setMediaFailed] = useState(false)

  // The selected design, resolved against the registry. An unknown id (a
  // document saved by a newer build) simply renders no design, so the preview
  // falls back to the built-in layers instead of breaking.
  const design = remotionDesignId ? getRemotionDesign(remotionDesignId) : undefined
  const designProps = design
    ? resolveRemotionDesignProps(design.id, remotionDesignProps)
    : null
  const isFullFrameDesign = design?.placement === 'full-frame'

  // A browser media element that cannot be decoded/loaded (codec, network or
  // CORS restrictions on unusual remote URLs) would otherwise surface as an
  // unhandled error from the media component. Record it and render the same
  // static fallback used when no video is selected. `'fallback'` is the
  // component's own default action (it may retry through its HTML fallback);
  // during a web-renderer export the same failure cancels the render with an
  // actionable error instead of silently producing a broken video.
  const handleMediaError = useCallback((): 'fallback' => {
    setMediaFailed(true)
    // Report the failure on the module-level channel so the player wrapper can
    // show an actionable message instead of a silent placeholder. The local
    // `mediaFailed` state above still drives the poster fallback.
    emitPreviewMediaFailure({
      videoUrl: videoUrl ?? null,
      posterUrl: posterUrl ?? null,
      label: previewMediaLabel(videoUrl ?? null),
      reason: 'MEDIA_ELEMENT_ERROR',
    })
    return 'fallback'
  }, [videoUrl, posterUrl])

  // Switching videos in the wizard must clear a failure recorded for the
  // previously selected source, in the composition and on the shared channel.
  useEffect(() => {
    setMediaFailed(false)
    clearPreviewMediaFailure()
  }, [videoUrl])

  const renderBackground = () => {
    // A full-frame design owns the whole frame: the customer's footage is not
    // drawn underneath it. The browser export composites the design the same
    // way, so preview and export stay identical.
    if (isFullFrameDesign) return null
    if (isImageSource && !videoUrl) {
      if (!posterUrl) return null
      return (
        <Img
          src={posterUrl}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )
    }
    if (videoUrl && !mediaFailed) {
      // One code path for same-origin and remote sources. `@remotion/media`'s
      // <Video> decodes the source with the browser's own media stack, so it is
      // the component the web renderer can also extract frames AND audio from
      // (OffthreadVideo is not supported there). `muted={false}` keeps the
      // source video's audio track in the composition so it survives export;
      // playback muting stays a Player-level concern.
      return (
        <Video
          src={videoUrl}
          muted={false}
          onError={handleMediaError}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )
    }
    if (mediaFailed && posterUrl) {
      return (
        <Img
          src={posterUrl}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )
    }
    return (
      <AbsoluteFill
        style={{
          background: '#0b1220',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 12,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontFamily: fontStackById(),
            color: '#dbeafe',
            fontSize: Math.round(compH * 0.045),
            fontWeight: 700,
            textAlign: 'center',
            width: '80%',
            wordBreak: 'break-word',
          }}
        >
          {brand.businessName || 'Your personalized video preview'}
        </div>
        <div
          style={{
            fontFamily: fontStackById(),
            color: 'rgba(219, 234, 254, 0.6)',
            fontSize: Math.round(compH * 0.024),
            textAlign: 'center',
            width: '80%',
          }}
        >
          Select a video or image to preview your branding
        </div>
      </AbsoluteFill>
    )
  }

  // A selected design replaces the built-in layer stack: the browser export
  // renders the design alone, so the preview must not draw the customer's
  // layers on top of it as well.
  const visibleLayers = design
    ? []
    : settings.layers.filter(
        (layer) =>
          layer.visible &&
          layer.kind !== 'endCard' &&
          frame >= layer.startFrame &&
          (layer.endFrame === undefined || frame <= layer.endFrame),
      )

  const endCardLen = Math.min(90, Math.max(45, Math.round(settings.durationInFrames * 0.2)))
  const endCardStart = Math.max(0, settings.durationInFrames - endCardLen)

  return (
    <Internals.SequenceManager.Provider value={NOOP_SEQUENCE_MANAGER}>
    <AbsoluteFill style={{ background: '#05070a' }}>
      {renderBackground()}
        {audioUrl ? <Audio src={audioUrl} /> : null}
        {isFullFrameDesign ? null : (
          <AbsoluteFill
              style={{
                background: '#000',
                opacity: settings.brandColors.backgroundDim,
                pointerEvents: 'none',
              }}
            />
          )}
        {design && designProps ? (
          <RemotionDesignLayer design={design} props={designProps} />
        ) : null}
        {visibleLayers.map((layer) => {
          const isImage = isImageLayerKind(layer.kind)
          const isText = TEXT_LAYER_KINDS.includes(layer.kind)
          if (!isImage && !isText) return null
          const text = isText ? resolveLayerText(layer, brand) : ''
          const imageUrl = isImage ? resolveLayerImageUrl(layer, brand) : ''
          if (isText && !text.trim()) return null
          if (isImage && !imageUrl) return null

          const box = toBox(layer, compW, compH)
          const entrance = entranceFor(layer, frame, settings.fps)
          const textColor =
            layer.color ??
            (layer.kind === 'cta' ? settings.brandColors.accent : settings.brandColors.text)
          const isExtraBold = layer.kind === 'businessName' || layer.kind === 'cta'
          const transformParts: string[] = []
          if (entrance.translateX) transformParts.push(`translateX(${entrance.translateX}px)`)
          if (entrance.translateY) transformParts.push(`translateY(${entrance.translateY}px)`)
          if (entrance.scale !== 1) transformParts.push(`scale(${entrance.scale})`)

          const layerStyle: React.CSSProperties = {
            left: box.leftPx,
            top: box.topPx,
            width: box.widthPx,
            transform: transformParts.length > 0 ? transformParts.join(' ') : undefined,
            opacity: layer.opacity * entrance.opacity,
            pointerEvents: 'none',
          }

          if (isImage) {
            return (
              <AbsoluteFill key={layer.id} style={{ ...layerStyle, height: box.widthPx }}>
                <Img
                  src={imageUrl}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </AbsoluteFill>
            )
          }

          if (layer.kind === 'cta') {
            return (
              <AbsoluteFill key={layer.id} style={layerStyle}>
                <div style={{ width: '100%', textAlign: 'center' }}>
                  <span
                    style={{
                      background: settings.brandColors.accent,
                      color: PILL_TEXT_COLOR,
                      padding: '0.4em 1.1em',
                      borderRadius: 999,
                      display: 'inline-block',
                      fontFamily: fontStackById(layer.fontFamily),
                      fontSize: box.fontSizePx,
                      fontWeight: 800,
                    }}
                  >
                    {text}
                  </span>
                </div>
              </AbsoluteFill>
            )
          }

          return (
            <AbsoluteFill key={layer.id} style={layerStyle}>
              <div
                style={{
                  fontFamily: fontStackById(layer.fontFamily),
                  color: textColor,
                  fontSize: box.fontSizePx,
                  fontWeight: isExtraBold ? 800 : 600,
                  lineHeight: 1.15,
                  textAlign: 'center',
                  width: '100%',
                  wordBreak: 'break-word',
                }}
              >
                {text}
              </div>
            </AbsoluteFill>
          )
        })}
        {design ? null : settings.showEndCard ? (
          <Sequence from={endCardStart} durationInFrames={endCardLen}>
            <EndCard settings={settings} brand={brand} />
          </Sequence>
        ) : null}
      </AbsoluteFill>
    </Internals.SequenceManager.Provider>
  )
}
