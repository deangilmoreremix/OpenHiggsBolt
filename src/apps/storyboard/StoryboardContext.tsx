import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { DEFAULT_STORYBOARD_MODEL_ID } from './models'

export interface StoryboardContextValue {
  projectId: string | null
  characterIds: string[]
  episodeId: string | null
  projectName: string
  brief: string
  /** Selected image-generation model id used when rendering storyboard shot frames. */
  model: string
  setProject: (p: { projectId: string; projectName: string; brief: string }) => void
  addCharacter: (id: string) => void
  setEpisode: (id: string) => void
  setModel: (id: string) => void
  reset: () => void
}

const STORAGE_KEY = 'storyboard_context'

const StoryboardContext = createContext<StoryboardContextValue | null>(null)

export function StoryboardProvider({ children }: { children: ReactNode }) {
  const [projectId, setProjectId] = useState<string | null>(null)
  const [characterIds, setCharacterIds] = useState<string[]>([])
  const [episodeId, setEpisodeId] = useState<string | null>(null)
  const [projectName, setProjectName] = useState('')
  const [brief, setBrief] = useState('')
  const [model, setModelState] = useState<string>(DEFAULT_STORYBOARD_MODEL_ID)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        setProjectId(parsed.projectId ?? null)
        setCharacterIds(parsed.characterIds ?? [])
        setEpisodeId(parsed.episodeId ?? null)
        setProjectName(parsed.projectName ?? '')
        setBrief(parsed.brief ?? '')
        if (typeof parsed.model === 'string' && parsed.model) setModelState(parsed.model)
      }
    } catch {
      /* ignore */
    }
  }, [])

  const persist = (
    next: Partial<{
      projectId: string | null
      characterIds: string[]
      episodeId: string | null
      projectName: string
      brief: string
      model: string
    }>
  ) => {
    setProjectId((prev) => next.projectId ?? prev)
    setCharacterIds((prev) => next.characterIds ?? prev)
    setEpisodeId((prev) => next.episodeId ?? prev)
    setProjectName((prev) => next.projectName ?? prev)
    setBrief((prev) => next.brief ?? prev)
    setModelState((prev) => next.model ?? prev)
    try {
      const current = {
        projectId: next.projectId ?? projectId,
        characterIds: next.characterIds ?? characterIds,
        episodeId: next.episodeId ?? episodeId,
        projectName: next.projectName ?? projectName,
        brief: next.brief ?? brief,
        model: next.model ?? model,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
    } catch {
      /* ignore */
    }
  }

  const value: StoryboardContextValue = {
    projectId,
    characterIds,
    episodeId,
    projectName,
    brief,
    model,
    setProject: ({ projectId, projectName, brief }) =>
      persist({ projectId, projectName, brief }),
    addCharacter: (id) => persist({ characterIds: [...characterIds, id] }),
    setEpisode: (id) => persist({ episodeId: id }),
    setModel: (id) => persist({ model: id }),
    reset: () => {
      setProjectId(null)
      setCharacterIds([])
      setEpisodeId(null)
      setProjectName('')
      setBrief('')
      setModelState(DEFAULT_STORYBOARD_MODEL_ID)
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        /* ignore */
      }
    },
  }

  return <StoryboardContext.Provider value={value}>{children}</StoryboardContext.Provider>
}

export function useStoryboard(): StoryboardContextValue {
  const ctx = useContext(StoryboardContext)
  if (!ctx) throw new Error('useStoryboard must be used within StoryboardProvider')
  return ctx
}
