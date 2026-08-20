import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { CameraSpec } from './cameraTaxonomy'
import { DEFAULT_STORYBOARD_MODEL_ID } from './models'

export interface StoryboardShot {
  id: string
  scene: string
  duration: number
  camera?: CameraSpec
  /** Character ids referenced by this shot (see StoryboardContext.characters). */
  characterIds?: string[]
  /** Generated still-frame preview URL for this shot. */
  frameUrl?: string
}

export interface StoryboardCharacter {
  id: string
  name: string
  description?: string
  referenceImageUrl?: string
}

export interface StoryboardResult {
  requestId: string
  url: string | null
  status: string
}

/** A single, self-contained storyboard project. */
export interface StoryboardProject {
  id: string
  projectName: string
  shots: StoryboardShot[]
  characters: StoryboardCharacter[]
  aspectRatio: '16:9' | '9:16'
  episodeDuration: number
  model: string
  result: StoryboardResult | null
  createdAt: string
  updatedAt: string
}

export interface StoryboardExport {
  version: 2
  project: StoryboardProject
  exportedAt: string
}

export interface ProjectSummary {
  id: string
  projectName: string
  shotCount: number
  updatedAt: string
}

export interface StoryboardContextValue {
  // Current-project fields (what the composer/editor read & write)
  projectId: string
  projectName: string
  setProjectName: (v: string) => void
  shots: StoryboardShot[]
  addShot: (scene: string, duration: number, camera?: CameraSpec, characterIds?: string[]) => void
  updateShot: (id: string, patch: Partial<StoryboardShot>) => void
  removeShot: (id: string) => void
  moveShot: (fromIndex: number, toIndex: number) => void
  characters: StoryboardCharacter[]
  addCharacter: (c: Omit<StoryboardCharacter, 'id'>) => StoryboardCharacter
  updateCharacter: (id: string, patch: Partial<StoryboardCharacter>) => void
  removeCharacter: (id: string) => void
  aspectRatio: '16:9' | '9:16'
  setAspectRatio: (v: '16:9' | '9:16') => void
  episodeDuration: number
  setEpisodeDuration: (v: number) => void
  model: string
  setModel: (v: string) => void
  result: StoryboardResult | null
  setResult: (r: StoryboardResult | null) => void
  reset: () => void
  // Multi-project management
  projects: ProjectSummary[]
  createProject: (name?: string) => void
  switchProject: (id: string) => void
  deleteProject: (id: string) => void
  // Import / export
  exportProject: () => StoryboardExport
  importProject: (data: unknown) => boolean
}

const PROJECTS_KEY = 'storyboard_projects'
const ACTIVE_KEY = 'storyboard_active_project'
const LEGACY_KEY = 'storyboard_context'

const StoryboardContext = createContext<StoryboardContextValue | null>(null)

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function newProject(name = ''): StoryboardProject {
  const now = new Date().toISOString()
  return {
    id: uid('proj'),
    projectName: name,
    shots: [],
    characters: [],
    aspectRatio: '9:16',
    episodeDuration: 10,
    model: DEFAULT_STORYBOARD_MODEL_ID,
    result: null,
    createdAt: now,
    updatedAt: now,
  }
}

interface RawShot {
  id?: unknown
  scene?: unknown
  duration?: unknown
  camera?: CameraSpec
  characterIds?: unknown
  frameUrl?: unknown
}

interface RawCharacter {
  id?: unknown
  name?: unknown
  description?: unknown
  referenceImageUrl?: unknown
}

interface RawProject {
  id?: unknown
  projectName?: unknown
  shots?: unknown
  characters?: unknown
  aspectRatio?: unknown
  episodeDuration?: unknown
  model?: unknown
  result?: unknown
  createdAt?: unknown
  updatedAt?: unknown
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

function normalizeProject(raw: RawProject): StoryboardProject {
  const base = newProject(asString(raw.projectName))
  const rawShots = Array.isArray(raw.shots) ? (raw.shots as RawShot[]) : []
  const rawChars = Array.isArray(raw.characters) ? (raw.characters as RawCharacter[]) : []
  return {
    ...base,
    id: asString(raw.id) || base.id,
    projectName: asString(raw.projectName),
    shots: rawShots
      .filter((s) => typeof s.scene === 'string')
      .map((s) => ({
        id: asString(s.id) || uid('shot'),
        scene: String(s.scene),
        duration: Number(s.duration) || 1,
        ...(s.camera ? { camera: s.camera } : {}),
        ...(Array.isArray(s.characterIds) ? { characterIds: asStringArray(s.characterIds) } : {}),
        ...(typeof s.frameUrl === 'string' ? { frameUrl: s.frameUrl } : {}),
      })),
    characters: rawChars
      .filter((c) => typeof c.name === 'string')
      .map((c) => ({
        id: asString(c.id) || uid('char'),
        name: String(c.name),
        ...(typeof c.description === 'string' ? { description: c.description } : {}),
        ...(typeof c.referenceImageUrl === 'string' ? { referenceImageUrl: c.referenceImageUrl } : {}),
      })),
    aspectRatio: raw.aspectRatio === '16:9' ? '16:9' : '9:16',
    episodeDuration: [10, 15, 25].includes(Number(raw.episodeDuration)) ? Number(raw.episodeDuration) : 10,
    model: typeof raw.model === 'string' && raw.model ? raw.model : DEFAULT_STORYBOARD_MODEL_ID,
    result: (raw.result as StoryboardResult | null) ?? null,
    createdAt: asString(raw.createdAt) || base.createdAt,
    updatedAt: asString(raw.updatedAt) || base.updatedAt,
  }
}

function loadProjects(): StoryboardProject[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(normalizeProject)
    }
    // One-time migration from the legacy single-project key.
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy) {
      const migrated = normalizeProject(JSON.parse(legacy))
      return [migrated]
    }
  } catch {
    /* ignore */
  }
  return [newProject()]
}

export function StoryboardProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<StoryboardProject[]>([newProject()])
  const [activeId, setActiveId] = useState<string>('')

  // Hydrate once on mount.
  useEffect(() => {
    const loaded = loadProjects()
    setProjects(loaded)
    let active = ''
    try {
      active = localStorage.getItem(ACTIVE_KEY) || ''
    } catch {
      /* ignore */
    }
    if (!active || !loaded.some((p) => p.id === active)) active = loaded[0].id
    setActiveId(active)
  }, [])

  const persistProjects = (next: StoryboardProject[], nextActive?: string) => {
    try {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(next))
      if (nextActive) localStorage.setItem(ACTIVE_KEY, nextActive)
    } catch {
      /* ignore */
    }
  }

  const current = projects.find((p) => p.id === activeId) || projects[0]

  // Patch the current project and persist.
  const patchCurrent = (patch: Partial<StoryboardProject>) => {
    const next = projects.map((p) =>
      p.id === current.id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p
    )
    setProjects(next)
    persistProjects(next)
  }

  // ── Shots ────────────────────────────────────────────────────────────────
  const addShot = (scene: string, duration: number, camera?: CameraSpec, characterIds?: string[]) => {
    const shot: StoryboardShot = {
      id: uid('shot'),
      scene,
      duration,
      ...(camera ? { camera } : {}),
      ...(characterIds && characterIds.length ? { characterIds } : {}),
    }
    patchCurrent({ shots: [...current.shots, shot] })
  }

  const updateShot = (id: string, patch: Partial<StoryboardShot>) => {
    patchCurrent({ shots: current.shots.map((s) => (s.id === id ? { ...s, ...patch } : s)) })
  }

  const removeShot = (id: string) => {
    patchCurrent({ shots: current.shots.filter((s) => s.id !== id) })
  }

  const moveShot = (fromIndex: number, toIndex: number) => {
    const shots = current.shots
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= shots.length ||
      toIndex >= shots.length
    ) {
      return
    }
    const next = [...shots]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    patchCurrent({ shots: next })
  }

  // ── Characters ───────────────────────────────────────────────────────────
  const addCharacter = (c: Omit<StoryboardCharacter, 'id'>): StoryboardCharacter => {
    const character: StoryboardCharacter = { id: uid('char'), ...c }
    patchCurrent({ characters: [...current.characters, character] })
    return character
  }

  const updateCharacter = (id: string, patch: Partial<StoryboardCharacter>) => {
    patchCurrent({ characters: current.characters.map((c) => (c.id === id ? { ...c, ...patch } : c)) })
  }

  const removeCharacter = (id: string) => {
    patchCurrent({
      characters: current.characters.filter((c) => c.id !== id),
      shots: current.shots.map((s) =>
        s.characterIds ? { ...s, characterIds: s.characterIds.filter((cid) => cid !== id) } : s
      ),
    })
  }

  // ── Project management ─────────────────────────────────────────────────────
  const createProject = (name = '') => {
    const proj = newProject(name)
    const next = [...projects, proj]
    setProjects(next)
    setActiveId(proj.id)
    persistProjects(next, proj.id)
  }

  const switchProject = (id: string) => {
    if (!projects.some((p) => p.id === id)) return
    setActiveId(id)
    try {
      localStorage.setItem(ACTIVE_KEY, id)
    } catch {
      /* ignore */
    }
  }

  const deleteProject = (id: string) => {
    let next = projects.filter((p) => p.id !== id)
    if (next.length === 0) next = [newProject()]
    setProjects(next)
    let nextActive = activeId
    if (id === activeId) nextActive = next[0].id
    setActiveId(nextActive)
    persistProjects(next, nextActive)
  }

  // ── Import / export ────────────────────────────────────────────────────────
  const exportProject = (): StoryboardExport => ({
    version: 2,
    project: current,
    exportedAt: new Date().toISOString(),
  })

  const importProject = (data: unknown): boolean => {
    try {
      if (!data || typeof data !== 'object') return false
      // Accept both v2 ({ project }) and v1/legacy (flat) shapes.
      const record = data as Record<string, unknown>
      const source = (record.project as RawProject) ?? (data as RawProject)
      const imported = normalizeProject(source)
      imported.id = uid('proj') // avoid clashing with existing ids
      imported.updatedAt = new Date().toISOString()
      const next = [...projects, imported]
      setProjects(next)
      setActiveId(imported.id)
      persistProjects(next, imported.id)
      return true
    } catch {
      return false
    }
  }

  const projectSummaries: ProjectSummary[] = projects.map((p) => ({
    id: p.id,
    projectName: p.projectName,
    shotCount: p.shots.length,
    updatedAt: p.updatedAt,
  }))

  const value: StoryboardContextValue = {
    projectId: current.id,
    projectName: current.projectName,
    setProjectName: (v) => patchCurrent({ projectName: v }),
    shots: current.shots,
    addShot,
    updateShot,
    removeShot,
    moveShot,
    characters: current.characters,
    addCharacter,
    updateCharacter,
    removeCharacter,
    aspectRatio: current.aspectRatio,
    setAspectRatio: (v) => patchCurrent({ aspectRatio: v }),
    episodeDuration: current.episodeDuration,
    setEpisodeDuration: (v) => patchCurrent({ episodeDuration: v }),
    model: current.model,
    setModel: (v) => patchCurrent({ model: v }),
    result: current.result,
    setResult: (r) => patchCurrent({ result: r }),
    reset: () =>
      patchCurrent({
        projectName: '',
        shots: [],
        characters: [],
        aspectRatio: '9:16',
        episodeDuration: 10,
        model: DEFAULT_STORYBOARD_MODEL_ID,
        result: null,
      }),
    projects: projectSummaries,
    createProject,
    switchProject,
    deleteProject,
    exportProject,
    importProject,
  }

  return <StoryboardContext.Provider value={value}>{children}</StoryboardContext.Provider>
}

export function useStoryboard(): StoryboardContextValue {
  const ctx = useContext(StoryboardContext)
  if (!ctx) throw new Error('useStoryboard must be used within StoryboardProvider')
  return ctx
}
