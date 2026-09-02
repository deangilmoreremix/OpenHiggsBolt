"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { CameraSpec } from './cameraTaxonomy'
import { DEFAULT_STORYBOARD_MODEL_ID } from './models'

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
  setModel: (id: string) => void
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
    if (!active || !loaded.some((p) => p.id === active)) active = loaded[0].id
    setActiveId(active)
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
    setModel: (id) => persist({ model: id }),
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
