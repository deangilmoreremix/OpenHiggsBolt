'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Film, FolderOpen, Play, Sparkles, Upload, Video } from 'lucide-react'
import { useDemoPersonalize } from '../DemoPersonalizeProvider'
import { GUIDED_DEMO_VIDEOS, demoDurationInFrames } from './curatedDemos'
import { C, badgeStyle, chipStyle, hintStyle, labelStyle, panelStyle, softPanelStyle, tileStyle } from './tokens'
import { TemplateBrowser } from './TemplateBrowser'
import type { SharedMediaEntry } from '../types'
import type { PreviewVideoRef } from '../preview/types'

function isVideoUrl(url: string | null | undefined): boolean {
  if (!url || url.startsWith('blob:')) return false
  return /\.(mp4|webm|mov|m4v|m3u8)(\?|$)/i.test(url) || url.includes('/video')
}

function savedVideoUrl(entry: SharedMediaEntry): string | null {
  const output = Array.isArray(entry.outputUrls) ? entry.outputUrls.find((url) => isVideoUrl(url)) : undefined
  if (output) return output
  if (isVideoUrl(entry.sourceMedia)) return entry.sourceMedia || null
  return null
}

/**
 * Simple Mode step 2 — choose the video to personalize.
 *
 * The video the customer opened with is preselected automatically, so arriving
 * here requires no action. The demo library, previously saved videos and a
 * browser-local upload are optional ways to change it. No paid call is made.
 */
export function StepChooseVideo(): React.JSX.Element {
  const ctx = useDemoPersonalize()
  const { source, previewVideo, setPreviewVideo, previewSettings, updatePreviewComposition, sharedMediaEntries = [] } = ctx
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadNote, setUploadNote] = useState(false)
  const [hoveredDemoKey, setHoveredDemoKey] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'source' | 'demos' | 'motion' | 'upload'>('source')

  const fps = previewSettings?.fps || 30

  // Auto-select the launch video. Guarded by the source URL so it runs once
  // per source: the customer never has to click anything to continue, and
  // switching sources (or reopening the modal) reselects that new video.
  const autoSelectedSourceRef = useRef<string | null>(null)
  useEffect(() => {
    const url = source?.sourceMedia
    if (!url) return
    if (previewVideo?.url) return
    if (autoSelectedSourceRef.current === url) return
    autoSelectedSourceRef.current = url
    setPreviewVideo({
      url,
      poster: source.poster || null,
      title: source.title || 'Your video',
      kind: 'source',
    })
  }, [source?.sourceMedia, source?.poster, source?.title, previewVideo?.url, setPreviewVideo])

  const savedVideos = sharedMediaEntries
    .map((entry) => ({ entry, url: savedVideoUrl(entry) }))
    .filter((item): item is { entry: SharedMediaEntry; url: string } => Boolean(item.url))
    .slice(0, 8)

  const pick = (video: PreviewVideoRef) => setPreviewVideo(video)

  const pickDemo = (demo: (typeof GUIDED_DEMO_VIDEOS)[number]) => {
    // A demo without a playable videoSrc must not be selected and must never
    // silently substitute another demo. Show an unavailable state instead.
    if (!demo.videoSrc) {
      return
    }
    pick({ url: demo.videoSrc, poster: demo.posterSrc || null, title: demo.title, kind: 'demo', demoId: String(demo.id) })
    updatePreviewComposition({ durationInFrames: demoDurationInFrames(demo, fps) })
  }

  const handleUpload = (file: File | undefined) => {
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    pick({ url: objectUrl, poster: null, title: file.name, kind: 'uploaded' })
    setUploadNote(true)
  }

  const selectedUrl = previewVideo?.url || source?.sourceMedia || null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.text }}>Choose a video to personalize</h2>
        <p style={{ margin: '4px 0 0', color: C.muted, fontSize: 12, lineHeight: 1.55 }}>
          Pick the video you opened, an AI demo, a Motion Studio recipe, or upload your own — your business
          details and edits stay either way.
        </p>
      </div>

      {/* ── Source / Demos / Motion Studio / Upload tabs ─────────────────── */}
      <div
        role="tablist"
        aria-label="Step 2 video source"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
      >
        <TabButton
          label="Your video"
          icon={Video}
          active={activeTab === 'source'}
          onClick={() => setActiveTab('source')}
        />
        <TabButton
          label="AI Demos"
          icon={Film}
          active={activeTab === 'demos'}
          onClick={() => setActiveTab('demos')}
        />
        <TabButton
          label="Motion Studio"
          icon={Sparkles}
          active={activeTab === 'motion'}
          onClick={() => setActiveTab('motion')}
        />
        <TabButton
          label="Upload"
          icon={Upload}
          active={activeTab === 'upload'}
          onClick={() => setActiveTab('upload')}
        />
      </div>

      {/* ── Current video (preselected automatically) ───────────────────── */}
      {activeTab === 'source' && source?.sourceMedia && (
        <div style={panelStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <Video size={15} color={C.cyan} />
            <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: C.text }}>
              Your video
            </h3>
            {selectedUrl === source.sourceMedia && <span style={badgeStyle('green')}>Selected — nothing to do</span>}
          </div>
          <button
            type="button"
            onClick={() => pick({ url: source.sourceMedia as string, poster: source.poster || null, title: source.title, kind: 'source' })}
            style={tileStyle(selectedUrl === source.sourceMedia)}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {source.poster && (
                <img
                  src={source.poster}
                  alt=""
                  style={{ width: 128, borderRadius: 8, border: `1px solid ${C.border}`, display: 'block' }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>{source.title}</div>
                {source.durationLabel && <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{source.durationLabel}</div>}
                <div style={{ marginTop: 8 }}>
                  {selectedUrl === source.sourceMedia ? (
                    <span style={badgeStyle('green')}>
                      <Check size={10} /> Selected
                    </span>
                  ) : (
                    <span style={badgeStyle()}>Use this video</span>
                  )}
                </div>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* ── Demo library (optional) ─────────────────────────────────────── */}
      {activeTab === 'demos' && (
      <div style={panelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <Film size={15} color={C.cyan} />
          <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: C.text }}>
            Choose a different video (optional)
          </h3>
        </div>
        {GUIDED_DEMO_VIDEOS.length === 0 && (
          <p style={hintStyle}>No demo videos available right now.</p>
        )}
        {GUIDED_DEMO_VIDEOS.length > 0 && (
          <>
            <p style={{ ...hintStyle, marginTop: 0, marginBottom: 10 }}>
              SmartVideo GO AI sample videos you can brand instead of your own.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4" style={{ gap: 10 }}>
              {GUIDED_DEMO_VIDEOS.map((demo) => {
                // Selection is matched on the video URL, never on the demo id:
                // the minimax and seedance libraries reuse the same numeric ids,
                // so an id match would light up (and mount a second player for)
                // a different demo.
                const active = selectedUrl === demo.videoSrc
                return (
                  // A <div role="button"> rather than a real <button>: the card
                  // contains a native <video controls> and a play overlay
                  // <button>, and a button inside a button is invalid HTML that
                  // React reports as a hydration error.
                  <div
                    key={`${demo.id}-${demo.slug}`}
                    role="button"
                    tabIndex={0}
                    aria-pressed={active}
                    aria-label={`Select ${demo.title}`}
                    data-testid={`demo-card-${demo.id}-${demo.slug}`}
                    onClick={() => pickDemo(demo)}
                    onKeyDown={(event) => {
                      // Only react to keys pressed on the CARD itself. A key
                      // pressed inside the nested `<video controls>` (Space
                      // toggles playback, arrows seek) must reach the media
                      // element — swallowing it here would break the native
                      // player controls.
                      if (event.target !== event.currentTarget) return
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        pickDemo(demo)
                      }
                    }}
                    style={{
                      ...tileStyle(active),
                      // The selected card is the player, so it takes the whole
                      // width of the grid and moves to the top — the customer
                      // sees the demo playing without scrolling.
                      ...(active ? { gridColumn: '1 / -1', order: -1 } : {}),
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      {/* The selected card IS the player: a real, muted, looping
                          <video> replaces the still thumbnail so the demo is
                          visibly moving without any extra click. Unselected
                          cards keep the poster as their thumbnail. Exactly one
                          of the two is ever mounted. */}
                      {active ? (
                        <DemoCardPlayer key={`demo-player-${demo.id}-${demo.slug}`} demo={demo} />
                      ) : (
                        <img
                          src={demo.posterSrc}
                          alt=""
                          loading="lazy"
                          style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 8, display: 'block', background: '#000' }}
                        />
                      )}
                      {/* Play overlay — makes the card clearly a playable video, not a static image.
                          On the selected card it shrinks to a corner badge so it never
                          covers the native video controls. */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); pickDemo(demo) }}
                        onMouseEnter={() => setHoveredDemoKey(`${demo.id}-${demo.slug}`)}
                        onMouseLeave={() => setHoveredDemoKey(null)}
                        aria-label={`Play ${demo.title}`}
                        style={{
                          position: 'absolute',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          cursor: 'pointer',
                          opacity: active || hoveredDemoKey === `${demo.id}-${demo.slug}` ? 1 : 0,
                          transition: 'opacity .15s ease',
                          ...(active
                            ? { top: 6, left: 6, width: 28, height: 28, borderRadius: 999, background: 'rgba(0,0,0,.6)', border: '1px solid rgba(255,255,255,.25)' }
                            : { inset: 0, borderRadius: 8, background: 'rgba(0,0,0,.35)', border: 'none' }),
                        }}
                      >
                        <Play size={active ? 13 : 26} color="#fff" />
                      </button>
                      {active && (
                        <span style={{ ...badgeStyle('green'), position: 'absolute', top: 6, right: 6 }}>
                          <Check size={10} /> Selected
                        </span>
                      )}
                      {/* The "VIDEO" chip sits bottom-left, where the native
                          control bar's play button lives — it is hidden on the
                          selected card so the two never overlap. */}
                      {!active && (
                        <span style={{ position: 'absolute', bottom: 6, left: 6, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#fff', background: 'rgba(0,0,0,.55)', padding: '2px 6px', borderRadius: 4 }}>VIDEO</span>
                      )}
                    </div>
                    <div style={{ color: C.text, fontSize: 12, fontWeight: 700, marginTop: 8, lineHeight: 1.35 }}>{demo.title}</div>
                    {demo.durationLabel && <div style={{ color: C.muted2, fontSize: 10, marginTop: 2 }}>{demo.durationLabel}</div>}
                  </div>
                )
              })}
            </div>

            {/* ── Now playing ────────────────────────────────────────────────
                The selected card already renders the real, playing video, so
                this is a caption only — a second <video> here would only
                duplicate the player (and make two elements load the same
                clip). */}
            {previewVideo?.kind === 'demo' && previewVideo.url && (
              <p style={{ ...hintStyle, marginTop: 10, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Video size={12} color={C.cyan} />
                Playing the real demo video source ({previewVideo.poster ? 'poster shown before play' : 'no poster available'}).
              </p>
            )}
          </>
        )}
      </div>
      )}

      {/* ── Motion Studio (full library: 124 cards / 150 shots / 10 categories) ── */}
      {activeTab === 'motion' && (
        <TemplateBrowser />
      )}

      {/* ── Saved / previously generated videos ─────────────────────────── */}
      {activeTab === 'source' && savedVideos.length > 0 && (
        <div style={panelStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <FolderOpen size={15} color={C.cyan} />
            <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: C.text }}>
              Your saved videos
            </h3>
            <span style={{ marginLeft: 'auto', color: C.muted2, fontSize: 10 }}>Optional</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4" style={{ gap: 10 }}>
            {savedVideos.map(({ entry, url }) => {
              const active = selectedUrl === url
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => pick({ url, poster: null, title: entry.sourceDemoSlug || 'Saved video', kind: 'saved' })}
                  style={tileStyle(active)}
                >
                  <div style={{ width: '100%', aspectRatio: '16 / 9', borderRadius: 8, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Video size={22} color={C.muted} />
                  </div>
                  <div style={{ color: C.text, fontSize: 12, fontWeight: 700, marginTop: 8 }}>{entry.sourceDemoSlug || 'Saved video'}</div>
                  <div style={{ color: C.muted2, fontSize: 10, marginTop: 2 }}>From {entry.originStudio || 'your library'}</div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Upload (optional) ───────────────────────────────────────────── */}
      {activeTab === 'upload' && (
      <div style={panelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Upload size={15} color={C.cyan} />
          <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: C.text }}>
            Upload your own video (optional)
          </h3>
        </div>
        <p style={{ ...hintStyle, marginTop: 0, marginBottom: 8 }}>
          Only needed if you would rather brand a video from your computer instead.
        </p>
        <label style={{ ...labelStyle, marginBottom: 6 }} htmlFor="guided-video-upload">Video file</label>
        <input
          id="guided-video-upload"
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={(event) => handleUpload(event.target.files?.[0])}
          style={{ ...softPanelStyle, width: '100%', color: C.text, fontSize: 12 }}
        />
        {uploadNote && (
          <p style={hintStyle}>Uploaded videos stay in this browser preview — nothing is uploaded to a server.</p>
        )}
      </div>
      )}
    </div>
  )
}

/**
 * Inline player for the demo card that is currently selected.
 *
 * The card is the player: the poster thumbnail is replaced by a real, muted,
 * looping <video> so the customer immediately sees the demo moving. The
 * player is mounted inside the card of the *selected* demo only, so React
 * unmounts the previous player (and stops the previous clip) the moment the
 * selection changes.
 */
function DemoCardPlayer({
  demo,
}: {
  demo: (typeof GUIDED_DEMO_VIDEOS)[number]
}): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    // `muted` already allows autoplay in every modern browser; this explicit
    // call is the fallback for the cases where the browser still refuses
    // (reduced data mode, backgrounded tab on first paint).
    const attempt = el.play()
    if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {})
  }, [demo.videoSrc])

  return (
    <video
      ref={videoRef}
      data-testid="demo-player"
      src={demo.videoSrc}
      poster={demo.posterSrc}
      muted
      playsInline
      loop
      autoPlay
      controls
      // Clicking the native controls must not re-trigger the card selection.
      onClick={(event) => event.stopPropagation()}
      style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'contain', maxHeight: 340, borderRadius: 8, display: 'block', background: '#000' }}
    />
  )
}

/**
 * Tab button used by Step 2's source picker. Renders an icon + label and
 * applies the active/cyan accent when `active` is true.
 */
function TabButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  icon: React.ComponentType<{ size?: number; color?: string }>
  active: boolean
  onClick: () => void
}): React.JSX.Element {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={chipStyle(active)}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <Icon size={12} color={active ? C.cyan : C.muted} />
        {label}
      </span>
    </button>
  )
}
