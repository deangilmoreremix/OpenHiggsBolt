'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Player } from '@remotion/player'
import type { PlayerRef } from '@remotion/player'
import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { PersonalizationComposition } from './PersonalizationComposition'
import { previewPlayerRef } from './PreviewControls'
import type { PreviewInputProps } from './types'

export interface PersonalizationPlayerProps {
  inputProps: PreviewInputProps
  /** CSS width of the player element. Defaults to '100%'. */
  width?: number | string
  /** CSS height of the player element. Defaults to '100%'. */
  height?: number | string
  autoPlay?: boolean
  loop?: boolean
  className?: string
  ariaLabel?: string
  /** When true, render only the Player (used for side-by-side followers). */
  hideTransport?: boolean
  /** When provided, drive this ref instead of the shared previewPlayerRef. */
  playerRefOverride?: React.RefObject<PlayerRef | null>
  onFrameChange?: (frame: number) => void
  onPlayingChange?: (playing: boolean) => void
  /** Controlled mute state; uncontrolled internal state when undefined. */
  muted?: boolean
  onMutedChange?: (muted: boolean) => void
}

function formatTimecode(frame: number, fps: number): string {
  const safeFps = fps > 0 ? fps : 30
  const totalSeconds = Math.max(0, frame) / safeFps
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds - minutes * 60
  return `${minutes}:${seconds.toFixed(1).padStart(4, '0')}`
}

/**
 * Personalization preview player: a free, browser-based Remotion Player that
 * renders the customer's selected video with their branding overlays.
 */
export function PersonalizationPlayer(
  props: PersonalizationPlayerProps,
): React.JSX.Element {
  const {
    inputProps,
    width = '100%',
    height = '100%',
    autoPlay = false,
    loop = true,
    className,
    ariaLabel = 'Personalized video preview',
    hideTransport = false,
    playerRefOverride,
    onFrameChange,
    onPlayingChange,
    muted,
    onMutedChange,
  } = props

  const settings = inputProps.settings
  const durationInFrames = Math.max(1, Math.round(settings.durationInFrames))
  const compositionWidth = settings.width
  const compositionHeight = settings.height
  const fps = settings.fps

  const ref = playerRefOverride ?? previewPlayerRef
  const [frame, setFrame] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [internalMuted, setInternalMuted] = useState(muted ?? true)
  const didMountRef = useRef(false)

  useEffect(() => {
    const player = ref.current
    if (!player || typeof player.addEventListener !== 'function') return
    const onFrameUpdate = (event: { detail: { frame: number } }) => {
      const next = typeof event?.detail?.frame === 'number' ? event.detail.frame : 0
      setFrame(next)
      onFrameChange?.(next)
    }
    const onPlay = () => {
      setPlaying(true)
      onPlayingChange?.(true)
    }
    const onPause = () => {
      setPlaying(false)
      onPlayingChange?.(false)
    }
    player.addEventListener('frameupdate', onFrameUpdate)
    player.addEventListener('play', onPlay)
    player.addEventListener('pause', onPause)
    return () => {
      player.removeEventListener('frameupdate', onFrameUpdate)
      player.removeEventListener('play', onPlay)
      player.removeEventListener('pause', onPause)
    }
  }, [ref, onFrameChange, onPlayingChange])

  // `initiallyMuted` is only applied on mount; controlled toggling after mount
  // is driven imperatively through the ref.
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }
    if (muted === undefined) return
    const player = ref.current
    if (!player) return
    if (muted) player.mute()
    else player.unmute()
  }, [muted, ref])

  const isMuted = muted ?? internalMuted

  const handleTogglePlay = () => {
    const player = ref.current
    if (!player) return
    if (player.isPlaying()) player.pause()
    else player.play()
  }

  const handleSeek = (value: number) => {
    const player = ref.current
    if (!player) return
    player.seekTo(Math.max(0, Math.min(durationInFrames - 1, Math.round(value))))
  }

  const handleReplay = () => {
    const player = ref.current
    if (!player) return
    player.seekTo(0)
    player.play()
  }

  const handleToggleMute = () => {
    const nextMuted = !isMuted
    if (muted === undefined) setInternalMuted(nextMuted)
    const player = ref.current
    if (player) {
      if (nextMuted) player.mute()
      else player.unmute()
    }
    onMutedChange?.(nextMuted)
  }

  // `Player` infers loose component/inputProps types; the composition's props
  // are an interface (no implicit index signature), so both are widened here.
  const PreviewComposition = PersonalizationComposition as unknown as React.ComponentType<
    Record<string, unknown>
  >
  const playerInputProps = inputProps as unknown as Record<string, unknown>

  return (
    <div
      className={className}
      role="region"
      aria-label={ariaLabel}
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <div style={{ position: 'relative', flex: '1 1 auto', minHeight: 0 }}>
        <Player
          ref={ref}
          component={PreviewComposition}
          inputProps={playerInputProps}
          durationInFrames={durationInFrames}
          compositionWidth={compositionWidth}
          compositionHeight={compositionHeight}
          fps={fps}
          loop={loop}
          controls={false}
          clickToPlay
          numberOfSharedAudioTags={8}
          acknowledgeRemotionLicense
          autoPlay={autoPlay}
          style={{ width: '100%', height: '100%' }}
          initiallyMuted={muted ?? true}
        />
      </div>
      {hideTransport ? null : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            background: 'rgba(5, 7, 10, 0.9)',
            borderTop: '1px solid rgba(148, 163, 184, 0.25)',
          }}
        >
          <button
            type="button"
            onClick={handleTogglePlay}
            aria-label={playing ? 'Pause preview' : 'Play preview'}
            title={playing ? 'Pause' : 'Play'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 999,
              border: '1px solid rgba(148, 163, 184, 0.35)',
              background: 'rgba(15, 23, 42, 0.8)',
              color: '#e2e8f0',
              cursor: 'pointer',
            }}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <span
            style={{
              fontSize: 12,
              fontVariantNumeric: 'tabular-nums',
              color: '#cbd5e1',
              minWidth: 78,
              textAlign: 'center',
            }}
          >
            {formatTimecode(frame, fps)} / {formatTimecode(durationInFrames, fps)}
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(0, durationInFrames - 1)}
            value={Math.min(frame, Math.max(0, durationInFrames - 1))}
            onChange={(event) => handleSeek(Number(event.target.value))}
            aria-label="Seek preview"
            style={{ flex: '1 1 auto', minWidth: 80, accentColor: '#29d3f2' }}
          />
          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={isMuted ? 'Unmute preview' : 'Mute preview'}
            title={isMuted ? 'Unmute' : 'Mute'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 999,
              border: '1px solid rgba(148, 163, 184, 0.35)',
              background: 'rgba(15, 23, 42, 0.8)',
              color: '#e2e8f0',
              cursor: 'pointer',
            }}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button
            type="button"
            onClick={handleReplay}
            aria-label="Replay preview"
            title="Replay"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 999,
              border: '1px solid rgba(148, 163, 184, 0.35)',
              background: 'rgba(15, 23, 42, 0.8)',
              color: '#e2e8f0',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
