/**
 * Supabase-backed persistence for personalization project state.
 *
 * Uses a debounced save so we do not write to the database on every
 * keystroke. Local state remains the source of truth during editing;
 * Supabase is the durable backing store.
 */

/**
 * Strip session-scoped blob URLs from a project state before it is serialized
 * to durable storage (Supabase or localStorage).
 *
 * `URL.createObjectURL` produces object URLs that are valid only for the
 * current browser tab session. If persisted, a page reload yields a dead link
 * that cannot be loaded. We therefore replace every blob URL with `null` so the
 * restore path falls back to source defaults instead of embedding a dead link.
 */
export function stripSessionScopedUrls(state: PersonalizationProjectState): PersonalizationProjectState {
  const isBlobUrl = (url: string | null | undefined): boolean =>
    typeof url === 'string' && url.startsWith('blob:')

  return {
    ...state,
    outputUrls: Array.isArray(state.outputUrls)
      ? state.outputUrls.filter((u) => typeof u === 'string' && !u.startsWith('blob:'))
      : [],
    previewVideo:
      state.previewVideo && typeof state.previewVideo === 'object' && 'url' in state.previewVideo
        ? isBlobUrl((state.previewVideo as PreviewVideoRef).url)
          ? null
          : (state.previewVideo as PreviewVideoRef)
        : null,
     previewSettings: state.previewSettings
       ? {
           ...state.previewSettings,
           layers: Array.isArray(state.previewSettings.layers)
             ? state.previewSettings.layers.map((layer) => ({
                 ...layer,
                 imageUrl: isBlobUrl(layer.imageUrl) ? undefined : layer.imageUrl,
               }))
             : state.previewSettings.layers,
           audio:
             state.previewSettings.audio &&
             typeof state.previewSettings.audio === 'object' &&
             typeof state.previewSettings.audio.url === 'string' &&
             isBlobUrl(state.previewSettings.audio.url)
               ? null
               : state.previewSettings.audio,
         }
       : state.previewSettings,
  }
}

import type { ClientProfile, AssetLibrary, PersonalizationSource, GenerationOptions, GenerationState, PromptState, OutputType, VideoPersonalizationMode, ImagePersonalizationMode, PersonalizationViewMode } from './types'
import type { PersonalizationPreviewSettings, PreviewVideoRef } from './preview/types'

export interface PersonalizationProjectState {
  id?: string
  originStudio?: string
  sourceType: string
  sourceDemoId?: string | null
  sourceDemoSlug?: string | null
  viralRecordId?: string | null
  sourceMedia?: string | null
  sourceUrl?: string | null
  personalizationMode?: string | null
  model?: string | null
  originalPrompt: string
  personalizedPrompt: string
  identityAssetIds: string[]
  logoAssetIds: string[]
  productAssetIds: string[]
  brandReferenceAssetIds: string[]
  firstFrameAssetId?: string | null
  lastFrameAssetId?: string | null
  ctaAssetId?: string | null
  outputUrls: string[]
  outputType: OutputType
  clientId?: string | null
  status?: string
  ctaHeadline?: string | null
  callToAction?: string | null
  generationSettings?: Record<string, unknown>
  aiAssistState?: Record<string, unknown>
  // Guided Simple Mode + free Remotion preview (optional so projects saved
  // before the preview existed restore with defaults instead of failing).
  previewSettings?: PersonalizationPreviewSettings | null
  previewVideo?: PreviewVideoRef | null
  guidedStep?: number
  viewMode?: PersonalizationViewMode
}

const API_ROUTE = '/api/personalization/project'

export interface ProjectPersistenceOptions {
  /** Delay in ms before persisting after last change (default: 1500) */
  debounceMs?: number
}

export interface LoadProjectOptions {
  /** Specific project ID to load (skips source lookup) */
  projectId?: string
  /** Source demo ID to find most recent project for */
  sourceId?: string
}

export interface LoadProjectResult {
  ok: boolean
  data?: PersonalizationProjectState
  error?: string
}

export function createProjectPersistence(opts: ProjectPersistenceOptions = {}) {
  const debounceMs = opts.debounceMs ?? 1500
  let timer: ReturnType<typeof setTimeout> | null = null
  let pendingState: PersonalizationProjectState | null = null

  function flush(state: PersonalizationProjectState): void {
    pendingState = null
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    save(state).catch(() => {
      /* best-effort; do not throw */
    })
  }

  function save(state: PersonalizationProjectState): Promise<{ ok: boolean; error?: string }> {
    const sanitized = stripSessionScopedUrls(state)
    // Route the fetch through a promise step so a synchronous throw (e.g. fetch
    // missing after environment teardown) or a non-thenable return (e.g. a mock
    // returning undefined) becomes an ordinary rejected-promise flow handled by
    // the terminal `.catch` below instead of an uncaught exception inside the
    // debounce timer callback.
    return Promise.resolve()
      .then(() =>
        fetch(API_ROUTE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entry: sanitized }),
          credentials: 'same-origin',
        })
      )
      .then(async (res) => {
        if (!res) return { ok: false, error: 'No response from server' }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          return { ok: false, error: data?.error || `HTTP ${res.status}` }
        }
        return { ok: true }
      })
      .catch((error) => {
        return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' }
      })
  }

  return {
    /** Schedule a debounced persist of the given project state */
    persist(state: PersonalizationProjectState): void {
      pendingState = state
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        if (pendingState) flush(pendingState)
      }, debounceMs)
    },

    /** Immediately persist without waiting for debounce */
    flush(state: PersonalizationProjectState): void {
      flush(state)
    },

    /** Cancel any pending debounced persist */
    cancel(): void {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      pendingState = null
    },
  }
}

/**
 * Load a previously-saved Personalization project from Supabase.
 *
 * Pass `projectId` to load a specific project, or `sourceId` to find the
 * most-recently-updated project for that source demo. Returns null when no
 * saved project exists (fresh session / never saved).
 */
export async function loadProject(opts: LoadProjectOptions = {}): Promise<LoadProjectResult> {
  const { projectId, sourceId } = opts

  const url = new URL('/api/personalization/project', typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
  if (projectId) {
    url.searchParams.set('id', projectId)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30_000)

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      credentials: 'same-origin',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      if (res.status === 404) return { ok: true, data: undefined }
      const data = await res.json().catch(() => ({}))
      return { ok: false, error: data?.error || `HTTP ${res.status}` }
    }

    const payload = await res.json().catch(() => ({}))
    const rawEntry = (payload as { data?: PersonalizationProjectState | PersonalizationProjectState[] })?.data

    // When projectId is given the API returns a single object; otherwise an array
    const entry: PersonalizationProjectState | undefined = Array.isArray(rawEntry) ? rawEntry[0] : rawEntry

    if (!entry) return { ok: true, data: undefined }

    // When sourceId is given, confirm we got a project for the right source
    if (sourceId && entry.sourceDemoId !== sourceId) return { ok: true, data: undefined }

    return { ok: true, data: entry }
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      return { ok: false, error: 'Request timed out' }
    }
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ── Convenience aliases expected by DemoPersonalizeProvider ───────────────────

export type SavedProject = PersonalizationProjectState

export async function saveProject(state: PersonalizationProjectState): Promise<{ ok: boolean; error?: string }> {
  const sanitized = stripSessionScopedUrls(state)
  // Same hardening as `save` above: a synchronous throw or non-thenable return
  // from fetch becomes a handled `{ ok: false, error }` result rather than an
  // uncaught exception.
  return Promise.resolve()
    .then(() =>
      fetch(API_ROUTE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry: sanitized }),
        credentials: 'same-origin',
      })
    )
    .then(async (res) => {
      if (!res) return { ok: false, error: 'No response from server' }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        return { ok: false, error: data?.error || `HTTP ${res.status}` }
      }
      return { ok: true }
    })
    .catch((error) => {
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' }
    })
}

export async function listProjects(): Promise<PersonalizationProjectState[]> {
  const url = new URL('/api/personalization/project', typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
  const res = await fetch(url.toString(), {
    method: 'GET',
    credentials: 'same-origin',
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.error || `HTTP ${res.status}`)
  }
  const payload = await res.json().catch(() => ({}))
  const rawEntry = (payload as { data?: PersonalizationProjectState | PersonalizationProjectState[] })?.data
  return Array.isArray(rawEntry) ? rawEntry : rawEntry ? [rawEntry] : []
}

export async function deleteProject(projectId: string): Promise<{ ok: boolean; error?: string }> {
  const url = new URL('/api/personalization/project', typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
  url.searchParams.set('id', projectId)
  const res = await fetch(url.toString(), {
    method: 'DELETE',
    credentials: 'same-origin',
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    return { ok: false, error: data?.error || `HTTP ${res.status}` }
  }
  return { ok: true }
}
