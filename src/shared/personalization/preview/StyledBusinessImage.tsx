import React from 'react'
import { collageTiles } from './imagePresets'
import {
  borderPx,
  borderRadiusCss,
  frameRect,
  objectPosition,
  resolveBorderColor,
  shadowCss,
  type ImageStyle,
} from './imageStyle'

export interface StyledImageProps {
  src: string
  alt?: string
  style?: React.CSSProperties
}

export interface StyledBusinessImageProps {
  src: string
  /** The resolved style (see `resolveImageStyle`). */
  imageStyle: ImageStyle
  /** The layer box in THIS surface's pixels. */
  boxWidth: number
  boxHeight: number
  /** Composition height in composition pixels (radius/border/shadow scale from it). */
  compHeight: number
  /** Surface pixels per composition pixel: 1 in the composition, the stage factor in the editor. */
  factor?: number
  brand: { primary: string; accent: string }
  /** Natural width / height when known, so the frame can hug a contained picture. */
  aspect?: number
  /** Image renderer: Remotion's `Img` inside the composition, a plain `<img>` elsewhere. */
  ImageComponent?: React.ComponentType<StyledImageProps>
  testId?: string
  /** Cinematic reveal progress 0..1 (1 = fully shown) and the settle scale; frame-driven by the caller. */
  revealProgress?: number
  revealScale?: number
}

const PlainImg: React.FC<StyledImageProps> = ({ src, alt = '', style }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={src} alt={alt} style={style} draggable={false} />
)

/**
 * A business image drawn as a polished overlay.
 *
 * Structure (why two wrappers): `overflow: hidden` + `border-radius` clip the
 * picture, which would also clip a shadow drawn on the same element. So the
 * OUTER element carries the shadow (same radius, no clipping) and the INNER one
 * carries the clip, border and fill. The original file is never altered — the
 * rounding is pure presentation.
 *
 * An unstyled/`square` style with no border, shadow or fill renders exactly like
 * a plain contained image, so logos and already-framed pictures are untouched.
 */
export const StyledBusinessImage: React.FC<StyledBusinessImageProps> = ({
  src, imageStyle, boxWidth, boxHeight, compHeight, factor = 1, brand, aspect, ImageComponent = PlainImg, testId, revealProgress = 1, revealScale = 1,
}) => {
  const frame = frameRect(imageStyle, boxWidth, boxHeight, aspect)
  const radius = borderRadiusCss(imageStyle, frame)
  const border = borderPx(imageStyle, compHeight, factor)
  const shadow = shadowCss(imageStyle, compHeight, factor)
  const plain = imageStyle.shape === 'square' && !border && !shadow && !imageStyle.fill

  const image = (
    <ImageComponent
      src={src}
      style={{
        width: '100%',
        height: '100%',
        objectFit: imageStyle.fit,
        objectPosition: objectPosition(imageStyle),
        display: 'block',
      }}
    />
  )

  const hasPreset = imageStyle.spotlight || imageStyle.frame === 'polaroid' || imageStyle.mask === 'soft' || imageStyle.reveal === 'wipe' || !!imageStyle.tilt

  if (hasPreset) {
    const short = Math.min(frame.width, frame.height)
    const polaroid = imageStyle.frame === 'polaroid'
    const pad = polaroid ? Math.round(short * 0.05) : 0
    const padBottom = polaroid ? Math.round(short * 0.17) : 0
    const outer = { left: frame.left - pad, top: frame.top - pad, width: frame.width + 2 * pad, height: frame.height + pad + padBottom }
    const outerRadius = polaroid ? `${Math.round(short * 0.02)}px` : radius
    const soft = imageStyle.mask === 'soft'
    const mask = soft ? 'radial-gradient(ellipse at center, #000 58%, rgba(0,0,0,0) 100%)' : undefined
    const wipe = imageStyle.reveal === 'wipe'
    const transforms = [
      imageStyle.tilt ? `rotate(${imageStyle.tilt}deg)` : '',
      revealScale !== 1 ? `scale(${revealScale})` : '',
    ].filter(Boolean).join(' ')
    return (
      <div data-styled-image="preset" data-preset={imageStyle.presetId} data-testid={testId} style={{ position: 'absolute', inset: 0 }}>
        {imageStyle.spotlight && (
          <div
            data-styled-image="spotlight"
            style={{
              position: 'absolute',
              left: frame.left - frame.width * 0.35,
              top: frame.top - frame.height * 0.35,
              width: frame.width * 1.7,
              height: frame.height * 1.7,
              background: 'radial-gradient(closest-side, rgba(255,255,255,0.26), rgba(255,255,255,0))',
              pointerEvents: 'none',
            }}
          />
        )}
        <div
          data-styled-image="outer"
          data-shape={imageStyle.shape}
          style={{
            position: 'absolute',
            ...outer,
            borderRadius: outerRadius,
            boxShadow: shadow, // on the OUTER wrapper: never clipped
            transform: transforms || undefined,
            transformOrigin: 'center center',
            opacity: wipe ? revealProgress : undefined,
          }}
        >
          <div
            data-styled-image="clip"
            style={{
              width: '100%',
              height: '100%',
              borderRadius: outerRadius,
              overflow: 'hidden',
              boxSizing: 'border-box',
              background: polaroid ? '#ffffff' : imageStyle.fill ?? undefined,
              padding: polaroid ? `${pad}px ${pad}px ${padBottom}px` : undefined,
              border: !polaroid && border ? `${border}px solid ${resolveBorderColor(imageStyle.borderColor, brand)}` : undefined,
              WebkitMaskImage: mask,
              maskImage: mask,
              clipPath: wipe ? `inset(0 ${Math.round((1 - revealProgress) * 100)}% 0 0)` : undefined,
            }}
          >
            <div style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: polaroid ? `${Math.round(short * 0.01)}px` : undefined }}>{image}</div>
          </div>
        </div>
      </div>
    )
  }

  if (plain) {
    return (
      <div data-styled-image="plain" data-testid={testId} style={{ position: 'absolute', left: frame.left, top: frame.top, width: frame.width, height: frame.height }}>
        {image}
      </div>
    )
  }

  return (
    <div
      data-styled-image="outer"
      data-shape={imageStyle.shape}
      data-testid={testId}
      style={{
        position: 'absolute',
        left: frame.left,
        top: frame.top,
        width: frame.width,
        height: frame.height,
        borderRadius: radius,
        boxShadow: shadow, // on the OUTER wrapper: never clipped
      }}
    >
      <div
        data-styled-image="clip"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: radius,
          overflow: 'hidden',
          boxSizing: 'border-box',
          background: imageStyle.fill ?? undefined,
          border: border ? `${border}px solid ${resolveBorderColor(imageStyle.borderColor, brand)}` : undefined,
        }}
      >
        {image}
      </div>
    </div>
  )
}


/**
 * 2–4 pictures in rounded tiles with even spacing (Multi-Image Collage). Tiles never overlap;
 * each tile crops to fill (that is what a collage is) around the style's crop focus.
 */
export const ImageCollage: React.FC<{
  urls: string[]
  imageStyle: ImageStyle
  boxWidth: number
  boxHeight: number
  compHeight: number
  factor?: number
  brand: { primary: string; accent: string }
  ImageComponent?: React.ComponentType<StyledImageProps>
  testId?: string
}> = ({ urls, imageStyle, boxWidth, boxHeight, compHeight, factor = 1, brand, ImageComponent = PlainImg, testId }) => {
  const tiles = collageTiles(urls.length)
  const border = borderPx(imageStyle, compHeight, factor)
  const shadow = shadowCss(imageStyle, compHeight, factor)
  return (
    <div data-styled-image="collage" data-count={tiles.length} data-testid={testId} style={{ position: 'absolute', inset: 0 }}>
      {tiles.map((t, i) => {
        const w = t.w * boxWidth
        const h = t.h * boxHeight
        const radius = borderRadiusCss(imageStyle, { width: w, height: h })
        return (
          <div key={i} data-styled-image="tile" style={{ position: 'absolute', left: t.x * boxWidth, top: t.y * boxHeight, width: w, height: h, borderRadius: radius, boxShadow: shadow }}>
            <div style={{ width: '100%', height: '100%', borderRadius: radius, overflow: 'hidden', boxSizing: 'border-box', border: border ? `${border}px solid ${resolveBorderColor(imageStyle.borderColor, brand)}` : undefined }}>
              <ImageComponent src={urls[i]} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: objectPosition(imageStyle), display: 'block' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * A half-frame picture panel (Split Screen): the picture fills one half of the composition
 * edge to edge and the customer's video fills the other. A soft shadow falls on the video side.
 */
export const SplitPanel: React.FC<{
  src: string
  side: 'left' | 'right' | 'top' | 'bottom'
  imageStyle: ImageStyle
  compWidth: number
  compHeight: number
  ImageComponent?: React.ComponentType<StyledImageProps>
  testId?: string
}> = ({ src, side, imageStyle, compWidth, compHeight, ImageComponent = PlainImg, testId }) => {
  const horizontal = side === 'left' || side === 'right'
  const w = horizontal ? compWidth / 2 : compWidth
  const h = horizontal ? compHeight : compHeight / 2
  const left = side === 'right' ? compWidth / 2 : 0
  const top = side === 'bottom' ? compHeight / 2 : 0
  const edge = Math.round(compHeight * 0.02)
  const shadowDir = side === 'right' ? `${-edge}px 0` : side === 'left' ? `${edge}px 0` : side === 'bottom' ? `0 ${-edge}px` : `0 ${edge}px`
  return (
    <div data-styled-image="split" data-side={side} data-testid={testId} style={{ position: 'absolute', left, top, width: w, height: h, overflow: 'hidden', boxShadow: imageStyle.shadow === 'none' ? undefined : `${shadowDir} ${edge * 2}px rgba(0,0,0,0.35)` }}>
      <ImageComponent src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: objectPosition(imageStyle), display: 'block' }} />
    </div>
  )
}
