import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface StoryboardCharacter {
  id?: string
  name: string
  description?: string
  referenceImageUrl?: string
}

export interface StoryboardShot {
  id?: string
  scene: string
  camera?: Record<string, unknown>
  duration?: number
  frameUrl?: string
  characterIds?: string[]
}

export interface StoryboardProject {
  id: string
  projectName: string
  shotCount?: number
  characters?: StoryboardCharacter[]
  shots?: StoryboardShot[]
  aspectRatio?: '16:9' | '9:16'
  episodeDuration?: number
}

export interface StoryboardExport {
  project: {
    projectName: string
    shots: StoryboardShot[]
    characters: StoryboardCharacter[]
    aspectRatio: '16:9' | '9:16'
    episodeDuration: number
  }
}

export interface StoryboardContextValue {
  projectId: string | null
  characterIds: string[]
  episodeId: string | null
  projectName: string
  brief: string
  setBrief: (brief: string) => void
  setProject: (p: { projectId: string; projectName: string; brief: string }) => void
  addCharacter: (id: string) => void
  setEpisode: (id: string) => void
  reset: () => void
  characters: StoryboardCharacter[]
  addCharacterObject: (character: Omit<StoryboardCharacter, 'id'>) => void
  updateCharacter: (id: string, updates: Partial<StoryboardCharacter>) => void
  removeCharacter: (id: string) => void
  projects: StoryboardProject[]
  createProject: () => void
  switchProject: (id: string) => void
  deleteProject: (id: string) => void
  shots: StoryboardShot[]
  addShot: (shot: StoryboardShot) => void
  updateShot: (id: string, updates: Partial<StoryboardShot>) => void
  removeShot: (id: string) => void
  aspectRatio: '16:9' | '9:16'
  setAspectRatio: (ratio: '16:9' | '9:16') => void
  episodeDuration: number
  setEpisodeDuration: (duration: number) => void
  result: { url?: string } | null
  setResult: (result: { url?: string } | null) => void
}

const STORAGE_KEY = 'storyboard_context'

const StoryboardContext = createContext<StoryboardContextValue | null>(null)

export function StoryboardProvider({ children }: { children: ReactNode }) {
  const [projectId, setProjectId] = useState<string | null>(null)
  const [characterIds, setCharacterIds] = useState<string[]>([])
  const [episodeId, setEpisodeId] = useState<string | null>(null)
  const [projectName, setProjectName] = useState('')
  const [brief, setBrief] = useState('')
  const [characters, setCharacters] = useState<StoryboardCharacter[]>([])
  const [projects, setProjects] = useState<StoryboardProject[]>([])
  const [shots, setShots] = useState<StoryboardShot[]>([])
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9')
  const [episodeDuration, setEpisodeDuration] = useState(60)
  const [result, setResult] = useState<{ url?: string } | null>(null)

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
        setCharacters(parsed.characters ?? [])
        setProjects(parsed.projects ?? [])
        setShots(parsed.shots ?? [])
        setAspectRatio(parsed.aspectRatio ?? '16:9')
        setEpisodeDuration(parsed.episodeDuration ?? 60)
        setResult(parsed.result ?? null)
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
      characters: StoryboardCharacter[]
      projects: StoryboardProject[]
      shots: StoryboardShot[]
      aspectRatio: '16:9' | '9:16'
      episodeDuration: number
      result: { url?: string } | null
    }>
  ) => {
    setProjectId((prev) => next.projectId ?? prev)
    setCharacterIds((prev) => next.characterIds ?? prev)
    setEpisodeId((prev) => next.episodeId ?? prev)
    setProjectName((prev) => next.projectName ?? prev)
    setBrief((prev) => next.brief ?? prev)
    setCharacters((prev) => next.characters ?? prev)
    setProjects((prev) => next.projects ?? prev)
    setShots((prev) => next.shots ?? prev)
    setAspectRatio((prev) => next.aspectRatio ?? prev)
    setEpisodeDuration((prev) => next.episodeDuration ?? prev)
    setResult((prev) => next.result ?? prev)
    try {
      const current = {
        projectId: next.projectId ?? projectId,
        characterIds: next.characterIds ?? characterIds,
        episodeId: next.episodeId ?? episodeId,
        projectName: next.projectName ?? projectName,
        brief: next.brief ?? brief,
        characters: next.characters ?? characters,
        projects: next.projects ?? projects,
        shots: next.shots ?? shots,
        aspectRatio: next.aspectRatio ?? aspectRatio,
        episodeDuration: next.episodeDuration ?? episodeDuration,
        result: next.result ?? result,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
    } catch {
      /* ignore */
    }
  }

  const generateId = () => Math.random().toString(36).slice(2, 9)

  const value: StoryboardContextValue = {
    projectId,
    characterIds,
    episodeId,
    projectName,
    brief,
    setBrief,
    setProject: ({ projectId, projectName, brief }) =>
      persist({ projectId, projectName, brief }),
    addCharacter: (id) => persist({ characterIds: [...characterIds, id] }),
    setEpisode: (id) => persist({ episodeId: id }),
    reset: () => {
      setProjectId(null)
      setCharacterIds([])
      setEpisodeId(null)
      setProjectName('')
      setBrief('')
      setCharacters([])
      setProjects([])
      setShots([])
      setAspectRatio('16:9')
      setEpisodeDuration(60)
      setResult(null)
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        /* ignore */
      }
    },
    characters,
    addCharacterObject: (character) =>
      persist({ characters: [...characters, { ...character, id: generateId() }] }),
    updateCharacter: (id, updates) =>
      persist({ characters: characters.map((c) => (c.id === id ? { ...c, ...updates } : c)) }),
    removeCharacter: (id) =>
      persist({ characters: characters.filter((c) => c.id !== id) }),
    projects,
    createProject: () => {
      const newProject: StoryboardProject = {
        id: generateId(),
        projectName: `Project ${projects.length + 1}`,
        shotCount: 0,
      }
      persist({ projects: [...projects, newProject], projectId: newProject.id })
    },
    switchProject: (id) => persist({ projectId: id }),
    deleteProject: (id) => {
      const filtered = projects.filter((p) => p.id !== id)
      persist({
        projects: filtered,
        projectId: filtered.length > 0 ? filtered[0].id : null,
      })
    },
    shots,
    addShot: (shot) =>
      persist({ shots: [...shots, { ...shot, id: generateId() }] }),
    updateShot: (id, updates) =>
      persist({ shots: shots.map((s) => (s.id === id ? { ...s, ...updates } : s)) }),
    removeShot: (id) =>
      persist({ shots: shots.filter((s) => s.id !== id) }),
    aspectRatio,
    setAspectRatio: (ratio) => persist({ aspectRatio: ratio }),
    episodeDuration,
    setEpisodeDuration: (duration) => persist({ episodeDuration: duration }),
    result,
    setResult: (next) => persist({ result: next }),
  }

  return <StoryboardContext.Provider value={value}>{children}</StoryboardContext.Provider>
}

export function useStoryboard(): StoryboardContextValue {
  const ctx = useContext(StoryboardContext)
  if (!ctx) throw new Error('useStoryboard must be used within StoryboardProvider')
  return ctx
}
