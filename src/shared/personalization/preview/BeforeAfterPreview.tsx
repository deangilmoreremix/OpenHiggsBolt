'use client'

import React, { useMemo, useRef, useState } from 'react'
import type { PlayerRef } from '@remotion/player'
import { PersonalizationPlayer } from './PersonalizationPlayer'
import type { PreviewInputProps } from './types'

export type BeforeAfterMode = 'toggle' | 'split'

export interface BeforeAfterPreviewProps {
  inputProps: PreviewInputProps
  defaultMode?: BeforeAfterMode
}

function resolveInitialMode(defaultMode?: BeforeAfterMode): BeforeAfterMode {
  if (defaultMode) return defaultMode
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(min-width: 900px)').matches ? 'split' : 'toggle'
  }
  return 'toggle'
}

/**
 * Before/after comparison for the personalization preview. The BEFORE player
 * renders the plain original video (all overlays hidden); the AFTER player
 * renders the personalized scene.
 */
export function BeforeAfterPreview(props: BeforeAfterPreviewProps): React.JSX.Element {
  const { inputProps, defaultMode } = props
  const [mode, setMode] = useState<BeforeAfterMode>(() => resolveInitialMode(defaultMode))
  const [showingBefore, setShowingBefore] = useState(true)
  const beforeRef = useRef<PlayerRef | null>(null)
  const afterRef = useRef<PlayerRef | null>(null)

  const beforeInputProps = useMemo<PreviewInputProps>(
    () => ({
      ...inputProps,
      settings: {
        ...inputProps.settings,
        layers: inputProps.settings.layers.map((layer) => ({ ...layer, visible: false })),
        showEndCard: false,
      },
    }),
    [inputProps],
  )

  const syncFrame = (target: React.RefObject<PlayerRef | null>, frame: number) => {
    const player = target.current
    if (!player) return
    let current = frame
    try {
      current = player.getCurrentFrame()
    } catch {
      current = frame
    }
    if (Math.abs(current - frame) > 2) player.seekTo(frame)
  }

  const syncPlaying = (target: React.RefObject<PlayerRef | null>, playing: boolean) => {
    const player = target.current
    if (!player) return
    if (playing) {
      if (!player.isPlaying()) player.play()
    } else if (player.isPlaying()) {
      player.pause()
    }
  }

  const handleBeforeFrame = (frame: number) => syncFrame(afterRef, frame)
  const handleBeforePlaying = (playing: boolean) => syncPlaying(afterRef, playing)
  const handleAfterFrame = (frame: number) => syncFrame(beforeRef, frame)
  const handleAfterPlaying = (playing: boolean) => syncPlaying(beforeRef, playing)

  const aspectRatio = inputProps.settings.aspectRatio.replace(':', ' / ')

  const modeButtonStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    borderRadius: 999,
    border: `1px solid ${active ? '#29d3f2' : 'rgba(148, 163, 184, 0.35)'}`,
    background: active ? 'rgba(41, 211, 242, 0.15)' : 'rgba(15, 23, 42, 0.8)',
    color: active ? '#e0f7ff' : '#cbd5e1',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  })

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#cbd5e1',
  }

  const stageStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 960,
    margin: '0 auto',
  }

  const modeSwitch = (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        type="button"
        onClick={() => setMode('split')}
        aria-pressed={mode === 'split'}
        style={modeButtonStyle(mode === 'split')}
      >
        Compare
      </button>
      <button
        type="button"
        onClick={() => setMode('toggle')}
        aria-pressed={mode === 'toggle'}
        style={modeButtonStyle(mode === 'toggle')}
      >
        Switch
      </button>
    </div>
  )

  if (mode === 'toggle') {
    return (
      <div style={{ ...stageStyle, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {modeSwitch}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 12px',
              borderRadius: 999,
              background: showingBefore ? 'rgba(148, 163, 184, 0.25)' : 'rgba(40, 201, 139, 0.2)',
              border: `1px solid ${showingBefore ? 'rgba(148, 163, 184, 0.45)' : 'rgba(40, 201, 139, 0.5)'}`,
              color: '#e2e8f0',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
            role="button"
            tabIndex={0}
            onClick={() => setShowingBefore((previous) => !previous)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                setShowingBefore((previous) => !previous)
              }
            }}
          >
            {showingBefore ? 'Before' : 'After'}
          </span>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>
            {showingBefore ? 'Original video' : 'Personalized preview'}
          </span>
        </div>
        <div
          style={{
            width: '100%',
            aspectRatio,
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid rgba(148, 163, 184, 0.25)',
          }}
        >
          {/* Constant key keeps the same player instance across Before/After switches. */}
          <PersonalizationPlayer
            key="personalization-before-after"
            inputProps={showingBefore ? beforeInputProps : inputProps}
            ariaLabel={showingBefore ? 'Before: original video' : 'After: personalized preview'}
          />
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...stageStyle, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {modeSwitch}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={labelStyle}>Before — original</span>
          <div
            style={{
              width: '100%',
              aspectRatio,
              borderRadius: 12,
              overflow: 'hidden',
              border: '1px solid rgba(148, 163, 184, 0.25)',
            }}
          >
            <PersonalizationPlayer
              inputProps={beforeInputProps}
              playerRefOverride={beforeRef}
              hideTransport
              ariaLabel="Before: original video"
              onFrameChange={handleBeforeFrame}
              onPlayingChange={handleBeforePlaying}
            />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={labelStyle}>After — personalized</span>
          <div
            style={{
              width: '100%',
              aspectRatio,
              borderRadius: 12,
              overflow: 'hidden',
              border: '1px solid rgba(148, 163, 184, 0.25)',
            }}
          >
            <PersonalizationPlayer
              inputProps={inputProps}
              playerRefOverride={afterRef}
              ariaLabel="After: personalized preview"
              onFrameChange={handleAfterFrame}
              onPlayingChange={handleAfterPlaying}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
