import { useCallback, useState } from 'react'
import { useDemoPersonalize } from '../DemoPersonalizeProvider'
import type { CaptionPosition, CaptionStyleId, PreviewCaptionCue, PreviewCaptions } from '../preview/types'
import { MAX_CAPTION_FILE_CHARS, parseCaptionFile } from './captionCues'

export interface Captions {
  /** Captions for THIS video, or null (captions written for another video are never shown over this one). */
  captions: PreviewCaptions | null
  /** A short message about the last import / change, or null. */
  note: string | null
  setEnabled: (enabled: boolean) => void
  setStyle: (style: CaptionStyleId) => void
  setPosition: (position: CaptionPosition) => void
  /** Replaces a line's text. Clearing it deletes the line. Word-by-word timing is dropped for an edited line. */
  editCue: (index: number, text: string) => void
  /** Adds a 2 s line after the last one (or at 0:00) for the person to type into. */
  addLine: () => void
  /** Replaces all lines with the ones in an .srt / .vtt file. */
  importFile: (file: Pick<File, 'name' | 'size'>, text: string) => void
  remove: () => void
}

/**
 * Burned-in captions, free and offline: lines come from a caption file or are typed in, and are stored in the preview
 * settings so they show in the live preview and in every export. They belong to the video they were made for.
 */
export function useCaptions(videoUrl: string | null): Captions {
  const { previewSettings, updatePreviewCaptions } = useDemoPersonalize()
  const [note, setNote] = useState<string | null>(null)
  const stored = previewSettings.captions
  const captions = stored && videoUrl && stored.forUrl === videoUrl ? stored : null

  const start = useCallback((cues: PreviewCaptionCue[]) => {
    if (!videoUrl) return
    const keep = captions
    updatePreviewCaptions({ enabled: true, forUrl: videoUrl, style: keep?.style ?? 'bold', position: keep?.position ?? 'bottom', cues })
  }, [videoUrl, captions, updatePreviewCaptions])

  const setEnabled = useCallback((enabled: boolean) => updatePreviewCaptions({ enabled }), [updatePreviewCaptions])
  const setStyle = useCallback((style: CaptionStyleId) => updatePreviewCaptions({ style }), [updatePreviewCaptions])
  const setPosition = useCallback((position: CaptionPosition) => updatePreviewCaptions({ position }), [updatePreviewCaptions])
  const editCue = useCallback((index: number, text: string) => {
    if (!captions) return
    const next = captions.cues.map((c, i) => {
      if (i !== index) return c
      const same = text.replace(/\s+/g, ' ').trim() === c.text
      const { words, ...rest } = c
      return same && words ? { ...rest, words } : { ...rest, text }
    })
    updatePreviewCaptions({ cues: next })
  }, [captions, updatePreviewCaptions])
  const addLine = useCallback(() => {
    const last = captions?.cues[captions.cues.length - 1]
    const startMs = last ? last.endMs : 0
    setNote(null)
    start([...(captions?.cues ?? []), { startMs, endMs: startMs + 2000, text: 'New line' }])
  }, [captions, start])
  const importFile = useCallback((file: Pick<File, 'name' | 'size'>, text: string) => {
    if (file.size > MAX_CAPTION_FILE_CHARS * 4) { setNote('That file is too big to be a caption file.'); return }
    const cues = parseCaptionFile(text)
    if (!cues.length) { setNote(`No captions were found in ${file.name || 'that file'}. Use an .srt or .vtt file.`); return }
    setNote(`Loaded ${cues.length} line${cues.length === 1 ? '' : 's'} from ${file.name || 'the file'}.`)
    start(cues)
  }, [start])
  const remove = useCallback(() => { updatePreviewCaptions(null); setNote(null) }, [updatePreviewCaptions])

  return { captions, note, setEnabled, setStyle, setPosition, editCue, addLine, importFile, remove }
}
