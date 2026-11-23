import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { CameraSpec } from './cameraTaxonomy'
import { DEFAULT_STORYBOARD_MODEL_ID, isValidStoryboardModel } from './models'

export interface StoryboardCharacter {
  id?: string
  name: string
  description?: string
  referenceImageUrl?: string
}

export interface StoryboardShot {
  id?: string
  scene: string
  camera?: CameraSpec
  duration?: number
  frameUrl?: string
  characterIds?: string[]
}

/**
 * A saved project. The active project's live data sits in the provider's
 * top-level state; its entry here is refreshed whenever you switch away, so
 * every project keeps its own brief, scenes, characters and result.
 */
export interface StoryboardProject {
  id: string
  projectName: string
  brief?: string
  shotCount?: number
  characters?: StoryboardCharacter[]
  shots?: StoryboardShot[]
  aspectRatio?: '16:9' | '9:16'
  episodeDuration?: number
  result?: { url?: string } | null
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
  addShot: {
    (shot: StoryboardShot): void
    (scene: string, duration: number): void
  }
  updateShot: (id: string, updates: Partial<StoryboardShot>) => void
  removeShot: (id: string) => void
  moveShot: (fromIndex: number, toIndex: number) => void
  aspectRatio: '16:9' | '9:16'
  setAspectRatio: (ratio: '16:9' | '9:16') => void
  episodeDuration: number
  setEpisodeDuration: (duration: number) => void
  model: string
  setModel: (v: string) => void
  result: { url?: string } | null
  setResult: (result: { url?: string } | null) => void
  setProjectName: (v: string) => void
}

const STORAGE_KEY = 'storyboard_context'

const generateId = () => Math.random().toString(36).slice(2, 9)

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
  const [episodeDuration, setEpisodeDuration] = useState(10)
  const [model, setModel] = useState<string>(DEFAULT_STORYBOARD_MODEL_ID)
  const [result, setResult] = useState<{ url?: string } | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        setProjectId(parsed.projectId ?? null)
        setCharacterIds(parsed.characterIds ?? [])
        setEpisodeId(parsed.episodeId ?? null)
        setProjectName(parsed.projectName ?? '')
        setBrief((prev) => parsed.brief || prev)
        setCharacters(parsed.characters ?? [])
        setProjects(parsed.projects ?? [])
        setShots(parsed.shots ?? [])
        setAspectRatio(parsed.aspectRatio ?? '16:9')
        setEpisodeDuration(parsed.episodeDuration ?? 10)
        setResult(parsed.result ?? null)
        if (isValidStoryboardModel(parsed.model)) setModel(parsed.model)
        // Older saves had no project list (or an active id outside it): adopt
        // the loaded state as a project so the switcher always has a current entry.
        const saved: StoryboardProject[] = Array.isArray(parsed.projects) ? parsed.projects : []
        if (!parsed.projectId || !saved.some((p) => p.id === parsed.projectId)) {
          const id = parsed.projectId || generateId()
          setProjectId(id)
          setProjects([...saved, { id, projectName: parsed.projectName || `Project ${saved.length + 1}` }])
        }
      } else {
        const id = generateId()
        setProjectId(id)
        setProjects([{ id, projectName: 'Project 1' }])
      }
    } catch {
      /* ignore */
    }
    setHydrated(true)
  }, [])

  // Write-through to localStorage once the stored state has been loaded, so the
  // initial empty render can't clobber a saved project.
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          projectId,
          characterIds,
          episodeId,
          projectName,
          brief,
          characters,
          projects,
          shots,
          aspectRatio,
          episodeDuration,
          model,
          result,
        })
      )
    } catch {
      /* ignore */
    }
  }, [hydrated, projectId, characterIds, episodeId, projectName, brief, characters, projects, shots, aspectRatio, episodeDuration, model, result])

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
      model: string
      result: { url?: string } | null
    }>
  ) => {
    if ('projectId' in next) setProjectId(next.projectId ?? null)
    if (next.characterIds) setCharacterIds(next.characterIds)
    if ('episodeId' in next) setEpisodeId(next.episodeId ?? null)
    if (next.projectName !== undefined) setProjectName(next.projectName)
    if (next.brief !== undefined) setBrief(next.brief)
    if (next.characters) setCharacters(next.characters)
    if (next.projects) setProjects(next.projects)
    if (next.shots) setShots(next.shots)
    if (next.aspectRatio) setAspectRatio(next.aspectRatio)
    if (next.episodeDuration !== undefined) setEpisodeDuration(next.episodeDuration)
    if (next.model) setModel(next.model)
    if ('result' in next) setResult(next.result ?? null)
  }

  const snapshotCurrent = (): StoryboardProject | null =>
    projectId
      ? {
          id: projectId,
          projectName: projectName || 'Untitled',
          brief,
          characters,
          shots,
          shotCount: shots.length,
          aspectRatio,
          episodeDuration,
          result,
        }
      : null

  const loadProject = (p: StoryboardProject) => {
    setProjectId(p.id)
    setProjectName(p.projectName ?? '')
    setBrief(p.brief ?? '')
    setCharacters(p.characters ?? [])
    setShots(p.shots ?? [])
    setAspectRatio(p.aspectRatio ?? '16:9')
    setEpisodeDuration(p.episodeDuration ?? 10)
    setResult(p.result ?? null)
  }

  /** The project list with the active project's entry refreshed from live state. */
  const projectsWithCurrent = (): StoryboardProject[] => {
    const current = snapshotCurrent()
    if (!current) return projects
    return projects.some((p) => p.id === current.id)
      ? projects.map((p) => (p.id === current.id ? current : p))
      : [...projects, current]
  }

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
      setEpisodeDuration(10)
      setModel(DEFAULT_STORYBOARD_MODEL_ID)
      setResult(null)
    },
    characters,
    // Collection updates are functional so several calls in one tick all land.
    addCharacterObject: (character) =>
      setCharacters((prev) => [...prev, { ...character, id: generateId() }]),
    updateCharacter: (id, updates) =>
      setCharacters((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c))),
    removeCharacter: (id) =>
      setCharacters((prev) => prev.filter((c) => c.id !== id)),
    projects,
    createProject: () => {
      const saved = projectsWithCurrent()
      const newProject: StoryboardProject = {
        id: generateId(),
        projectName: `Project ${saved.length + 1}`,
        shotCount: 0,
      }
      setProjects([...saved, newProject])
      loadProject(newProject)
    },
    switchProject: (id) => {
      if (id === projectId) return
      const saved = projectsWithCurrent()
      const target = saved.find((p) => p.id === id)
      if (!target) return
      setProjects(saved)
      loadProject(target)
    },
    deleteProject: (id) => {
      const remaining = projectsWithCurrent().filter((p) => p.id !== id)
      if (remaining.length === 0) {
        const fresh: StoryboardProject = { id: generateId(), projectName: 'Project 1', shotCount: 0 }
        setProjects([fresh])
        loadProject(fresh)
        return
      }
      setProjects(remaining)
      if (id === projectId) loadProject(remaining[0])
    },
    shots,
    addShot: (sceneOrShot, duration?, camera?, characterIds?) => {
      const shot: StoryboardShot =
        typeof sceneOrShot === 'object' && sceneOrShot !== null && 'scene' in sceneOrShot
          ? { ...sceneOrShot, id: generateId() }
          : {
              id: generateId(),
              scene: sceneOrShot,
              duration: duration ?? 1,
              ...(camera ? { camera } : {}),
              ...(characterIds ? { characterIds } : {}),
            }
      setShots((prev) => [...prev, shot])
    },
    updateShot: (id, updates) =>
      setShots((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s))),
    removeShot: (id) =>
      setShots((prev) => prev.filter((s) => s.id !== id)),
    moveShot: (fromIndex, toIndex) =>
      setShots((prev) => {
        const next = [...prev]
        const [moved] = next.splice(fromIndex, 1)
        next.splice(toIndex, 0, moved)
        return next
      }),
    aspectRatio,
    setAspectRatio: (ratio) => persist({ aspectRatio: ratio }),
    episodeDuration,
    setEpisodeDuration: (duration) => persist({ episodeDuration: duration }),
    model,
    setModel: (v) => persist({ model: v }),
    result,
    setResult: (next) => persist({ result: next }),
    setProjectName: (v) => persist({ projectName: v }),
  }

  return <StoryboardContext.Provider value={value}>{children}</StoryboardContext.Provider>
}

export function useStoryboard(): StoryboardContextValue {
  const ctx = useContext(StoryboardContext)
  if (!ctx) throw new Error('useStoryboard must be used within StoryboardProvider')
  return ctx
}
