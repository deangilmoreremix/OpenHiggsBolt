// SPDX-License-Identifier: MIT
/**
 * ParticleExplosion — adapted for this repository.
 *
 * Source:   https://github.com/deangilmoreremix/remotion-templates
 * File:     templates/particle-explosion.tsx
 * Licence:  MIT (asserted by the upstream README — that repository ships no
 *           LICENSE file; "Credit appreciated but not required. Created by the
 *           team at https://www.reactvideoeditor.com"). See
 *           docs/REMOTION_TEMPLATE_INVENTORY.md §4.2.
 *
 * Adaptations for this repository (Remotion 4.0.499, browser render path):
 *  - The hardcoded "BOOM!" word is replaced by an optional `text` prop that
 *    defaults to empty, so the design is a pure effect unless the caller asks
 *    for a word.
 *  - The particle count, the burst length and the burst origin became props
 *    so the effect can be timed and positioned inside a longer composition.
 *  - The particle size is derived from the composition height so the burst
 *    keeps its proportions at 16:9, 9:16, 1:1 and 4:5.
 *  - The seeded PRNG (`random(i)`) is kept, so the burst stays deterministic
 *    and frame-accurate across renders.
 *  - The root stays TRANSPARENT (no background) so the effect composites over
 *    the customer's video.
 *  - No `staticFile()`, no CSS `@keyframes`, no `<Sequence>`, no network fonts.
 */
import React from 'react'
import { random, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { REMOTION_DESIGN_FONT_SANS, designScale } from '../designTokens'

const PARTICLE_COUNT = 150

export type ParticleExplosionProps = {
  /** Optional word rendered in the centre of the burst. Empty by default. */
  text?: string
  /** Number of particles in the burst. */
  particleCount?: number
  /** Length of the effect in frames; the burst has fully faded at this point. */
  durationInFrames?: number
  /** Horizontal origin of the burst as a 0..1 fraction of the frame width. */
  centerX?: number
  /** Vertical origin of the burst as a 0..1 fraction of the frame height. */
  centerY?: number
  /** Colour of the optional centre word. */
  color?: string
  /** Optional font stack override. Defaults to the system sans stack. */
  fontFamily?: string
}

export const defaultParticleExplosionProps: ParticleExplosionProps = {
  text: '',
  particleCount: PARTICLE_COUNT,
  durationInFrames: 90,
  centerX: 0.5,
  centerY: 0.5,
  color: '#ffffff',
  fontFamily: REMOTION_DESIGN_FONT_SANS,
}

export const ParticleExplosion: React.FC<ParticleExplosionProps> = ({
  text = '',
  particleCount = PARTICLE_COUNT,
  durationInFrames = 90,
  centerX = 0.5,
  centerY = 0.5,
  color = '#ffffff',
  fontFamily = REMOTION_DESIGN_FONT_SANS,
}) => {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const scale = designScale(height)
  const count = Math.max(0, Math.round(particleCount))
  const originX = width * Math.min(1, Math.max(0, centerX))
  const originY = height * Math.min(1, Math.max(0, centerY))
  const effectLength = Math.max(1, Math.round(durationInFrames))

  const particles = Array.from({ length: count }).map((_, i) => {
    const baseAngle = (i / count) * Math.PI * 2
    const rotationSpeed = 0.02
    const rotatingAngle = baseAngle + frame * rotationSpeed

    const scaleFactor = spring({
      frame,
      fps,
      from: 0,
      to: random(i) * 1.2 + 0.3,
      config: { mass: 0.3, damping: 12 },
    })

    const distance = spring({
      frame,
      fps,
      from: 0,
      to: 180 + random(i) * 40,
      config: { mass: 0.4, damping: 10 },
    })

    const x = Math.cos(rotatingAngle) * distance * scale
    const y = Math.sin(rotatingAngle) * distance * scale
    const opacity = Math.max(0, 1 - frame / effectLength)

    return { x, y, opacity, scale: scaleFactor }
  })

  return (
    // Transparent root: the effect composites over the customer's video.
    <div
      data-remotion-design-id="particle-explosion"
      style={{ width, height, position: 'relative', pointerEvents: 'none' }}
    >
      {text ? (
        <div
          style={{
            position: 'absolute',
            left: originX,
            top: originY,
            transform: `translate(-50%, -50%) scale(${Math.min(1, frame / 10)})`,
            fontSize: 48 * scale,
            fontWeight: 'bold',
            color,
            fontFamily,
            textShadow: '0 0 10px rgba(255,255,255,0.5)',
            zIndex: 2,
          }}
        >
          {text}
        </div>
      ) : null}

      {particles.map((particle, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: originX,
            top: originY,
            transform: `translate(-50%, -50%) translate(${particle.x}px, ${particle.y}px) scale(${particle.scale})`,
            width: 12 * scale,
            height: 12 * scale,
            backgroundColor: `hsl(${
              200 + (i / count) * 40
            }, 85%, 70%)`,
            borderRadius: '50%',
            opacity: particle.opacity,
            boxShadow: '0 0 5px rgba(255,255,255,0.3)',
          }}
        />
      ))}
    </div>
  )
}

export default ParticleExplosion
