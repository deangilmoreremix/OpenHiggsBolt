'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Film, FolderOpen, Upload, Video } from 'lucide-react'
import { useDemoPersonalize } from '../DemoPersonalizeProvider'
import { GUIDED_DEMO_VIDEOS, demoDurationInFrames } from './curatedDemos'
import { C, badgeStyle, hintStyle, labelStyle, panelStyle, softPanelStyle, tileStyle } from './tokens'
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
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.text }}>Your video is ready</h2>
        <p style={{ margin: '4px 0 0', color: C.muted, fontSize: 12, lineHeight: 1.55 }}>
          We selected the video you opened for you. Keep it, or pick a different one below — your business details and
          edits stay either way.
        </p>
      </div>

      {/* ── Current video (preselected automatically) ───────────────────── */}
      {source?.sourceMedia && (
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
                const active = previewVideo?.demoId === String(demo.id) || selectedUrl === demo.videoSrc
                return (
                  <button key={`${demo.id}-${demo.slug}`} type="button" onClick={() => pickDemo(demo)} style={tileStyle(active)}>
                    <div style={{ position: 'relative' }}>
                      <img
                        src={demo.posterSrc}
                        alt=""
                        loading="lazy"
                        style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 8, display: 'block', background: '#000' }}
                      />
                      {active && (
                        <span style={{ ...badgeStyle('green'), position: 'absolute', top: 6, right: 6 }}>
                          <Check size={10} /> Selected
                        </span>
                      )}
                    </div>
                    <div style={{ color: C.text, fontSize: 12, fontWeight: 700, marginTop: 8, lineHeight: 1.35 }}>{demo.title}</div>
                    {demo.durationLabel && <div style={{ color: C.muted2, fontSize: 10, marginTop: 2 }}>{demo.durationLabel}</div>}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Saved / previously generated videos ─────────────────────────── */}
      {savedVideos.length > 0 && (
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
    </div>
  )
}
