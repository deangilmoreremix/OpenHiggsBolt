import { useState } from 'react'
import { Send, ChevronDown, Video, Film, Sparkles, Check } from 'lucide-react'
import { useStoryboard } from './StoryboardContext'
import {
  buildShotPrompt,
  withCharacters,
  type CharacterLike,
} from './cameraTaxonomy'
import {
  writeHandoff,
  emitSendTo,
  TARGET_LABEL,
  type StoryboardStudioTarget,
  type HandoffShot,
} from '@/shared/crossStudio'
import { buttons, panels, semantic } from '@/shared/styles/designTokens'

const TARGET_ICON: Record<StoryboardStudioTarget, JSX.Element> = {
  video: <Video size={14} />,
  cinema: <Film size={14} />,
  'vfx-studio': <Sparkles size={14} />,
}

/**
 * Build a cross-studio hand-off payload from the current storyboard project and
 * ask the host shell to switch to the chosen target studio. (The storyboard
 * runs inside its own MemoryRouter, so we can't navigate the shell directly;
 * we emit a `storyboard:send-to` event the shell listens for.)
 */
function buildAndSend(opts: {
  target: StoryboardStudioTarget
  shots: ReturnType<typeof useStoryboard>['shots']
  characters: ReturnType<typeof useStoryboard>['characters']
  projectName: string
  aspectRatio: '16:9' | '9:16'
  episodeDuration: number
  videoUrl: string | null
}) {
  const { target, shots, characters, projectName, aspectRatio, episodeDuration, videoUrl } = opts

  const charById = new Map(characters.map((c) => [c.id, c]))

  const compiledShots: HandoffShot[] = shots.map((s) => {
    const chars = (s.characterIds || [])
      .map((id) => charById.get(id))
      .filter(Boolean) as CharacterLike[]
    return {
      scene: s.scene,
      prompt: withCharacters(buildShotPrompt(s.scene, s.camera), chars),
      duration: s.duration ?? 0,
      frameUrl: s.frameUrl,
      characterNames: chars.map((c) => c.name),
    }
  })

  const firstFrame = compiledShots.find((s) => s.frameUrl)?.frameUrl ?? null
  const referenceImage = characters.find((c) => c.referenceImageUrl)?.referenceImageUrl ?? null
  const combinedPrompt = compiledShots.map((s) => s.prompt).join('\n\n')

  writeHandoff({
    version: 1,
    target,
    from: 'storyboard',
    projectName,
    aspectRatio,
    episodeDuration,
    videoUrl,
    referenceImageUrl: referenceImage,
    characterNames: characters.map((c) => c.name),
    shots: compiledShots,
    combinedPrompt,
    firstFrameUrl: firstFrame,
    createdAt: new Date().toISOString(),
  })

  emitSendTo(target)
}

export default function SendToMenu() {
  const { shots, characters, projectName, aspectRatio, episodeDuration, result } = useStoryboard()
  const [open, setOpen] = useState(false)
  const [sentTo, setSentTo] = useState<StoryboardStudioTarget | null>(null)

  const disabled = shots.length === 0

  const targets: StoryboardStudioTarget[] = ['video', 'cinema', 'vfx-studio']

  const handleSend = (target: StoryboardStudioTarget) => {
    setOpen(false)
    buildAndSend({
      target,
      shots,
      characters,
      projectName,
      aspectRatio,
      episodeDuration,
      videoUrl: result?.url ?? null,
    })
    // Briefly confirm where we sent it (the shell will switch tabs).
    setSentTo(target)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs transition-all disabled:opacity-50"
        style={buttons.ghost}
        title="Send this storyboard to another video studio"
      >
        <Send size={14} /> Send to {open ? <ChevronDown size={12} /> : <ChevronDown size={12} className="opacity-60" />}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-52 rounded-xl p-2 z-30 shadow-xl"
          style={panels.card}
        >
          <p className="text-[11px] px-2 py-1" style={{ color: semantic.textMuted }}>
            Continue editing in:
          </p>
          {targets.map((t) => (
            <button
              key={t}
              onClick={() => handleSend(t)}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-all text-left"
              style={buttons.ghost}
            >
              {TARGET_ICON[t]}
              <span>{TARGET_LABEL[t]}</span>
            </button>
          ))}
          {sentTo && (
            <p className="text-[11px] px-2 pt-1 flex items-center gap-1" style={{ color: semantic.success }}>
              <Check size={12} /> Sent to {TARGET_LABEL[sentTo]}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
