import React from 'react'
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
  src, imageStyle, boxWidth, boxHeight, compHeight, factor = 1, brand, aspect, ImageComponent = PlainImg, testId,
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
