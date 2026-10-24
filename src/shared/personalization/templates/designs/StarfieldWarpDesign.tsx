/**
 * Adapter for the upstream `starfield` template.
 *
 * Upstream: `src/components/starfield/Starfield.tsx`
 * (MIT, © 2026 Trimora Inc. / RenderComp).
 *
 * The upstream is reproduced verbatim in
 * `./_upstream/starfield-warp/Starfield.tsx` and is NEVER edited (contract
 * rule: repo-1 `_upstream` files are frozen). The upstream hardcodes each
 * star's core at `1 + seededRandom(...) * 2.5` px (1–3.5 px), which H.264
 * quantisation smears below the brand-colour tolerance in the browser export
 * (Phase 3 finding F2).
 *
 * This adapter therefore renders the starfield locally instead of delegating
 * to the frozen upstream: same seeded layout, same radial-warp motion, same
 * glow and trails — only the star core is wider (`3 + seededRandom(...) * 4`
 * px, i.e. 3–7 px) so it survives export quantisation. The visual intent is
 * unchanged; the stars remain thin streaks, just thick enough to stay visible.
 *
 * The design is placed full-frame (`scale = 1`, `animation: 'none'`,
 * `opacity: 1`) because it is a whole-canvas effect. It uses no
 * `mix-blend-mode` and no `filter`, so it rasterises identically in the
 * browser export.
 */

import React from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { useDesignFonts } from './fonts'
import {
  DesignStage,
  TRANSPARENT,
  pickColor,
  type DesignAdapterProps,
} from './shared'

const FPS = 30
const DURATION_FRAMES = 150

const FONT_SANS = '-apple-system, "Segoe UI", Roboto, sans-serif'

/** Deterministic pseudo-random generator so star layout is stable across renders. */
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

/** Number of stars — one third of the upstream's 180; 60 still read as a full warp field. */
const STAR_COUNT = 60
/** Warp speed — the upstream's own motion constant. */
const WARP_SPEED = 4

/** Star core width range: 3–7 px instead of the upstream's 1–3.5 px (Phase 3 finding F2 fix). */
const STAR_SIZE_BASE_MIN = 3
const STAR_SIZE_BASE_SPAN = 4

export const StarfieldWarpDesign: React.FC<DesignAdapterProps> = (props) => {
  useDesignFonts()

  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const cx = width / 2
  const cy = height / 2
  const maxR = Math.sqrt(cx * cx + cy * cy)

  const starColor = pickColor(
    [props.colors?.text, props.colors?.accent, props.colors?.primary],
    '#ffffff',
  )

  const stars = React.useMemo(() => {
    return Array.from({ length: STAR_COUNT }, (_, i) => ({
      angle: seededRandom(i * 3 + 1) * Math.PI * 2,
      startOffset: seededRandom(i * 5 + 2) * maxR,
      sizeBase: STAR_SIZE_BASE_MIN + seededRandom(i * 7 + 3) * STAR_SIZE_BASE_SPAN,
      speedJitter: 0.7 + seededRandom(i * 11 + 4) * 0.6,
    }))
  }, [STAR_COUNT, maxR])

  return (
    <DesignStage designId="starfield-warp" props={props}>
      <AbsoluteFill style={{ backgroundColor: TRANSPARENT, overflow: 'hidden' }}>
        {stars.map((s, i) => {
          const dist = (s.startOffset + frame * WARP_SPEED * s.speedJitter) % maxR
          const x = cx + Math.cos(s.angle) * dist
          const y = cy + Math.sin(s.angle) * dist
          const sizeScale = dist / maxR
          const size = s.sizeBase * (0.5 + sizeScale * 1.5)
          const alpha = Math.min(1, sizeScale * 1.5)
          const trailLen = sizeScale * 18 * WARP_SPEED * 0.5
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: size + trailLen,
                height: size,
                marginLeft: -(size + trailLen) / 2,
                marginTop: -size / 2,
                background: `linear-gradient(90deg, transparent, ${starColor})`,
                borderRadius: size / 2,
                opacity: alpha,
                transform: `rotate(${s.angle}rad)`,
                transformOrigin: 'center',
                boxShadow: `0 0 ${size * 2}px ${starColor}`,
              }}
            />
          )
        })}
      </AbsoluteFill>
    </DesignStage>
  )
}

export default StarfieldWarpDesign
