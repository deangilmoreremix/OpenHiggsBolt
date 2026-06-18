import { supabase } from '@/shared/api/supabase'
import { uid } from '@/shared/utils/uid'
import type { PresentationMetadata } from '@/apps/presentation/state/presentationStore'

const STORAGE_KEY = 'openhiggsbolt-presentations'

function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  return Boolean(url && key && !url.includes('placeholder') && !key.includes('placeholder'))
}

function toDbRow(presentation: PresentationMetadata): Record<string, unknown> {
  return {
    id: presentation.id,
    title: presentation.title,
    slides: presentation.slides,
    theme: presentation.theme,
    language: presentation.language,
    model: presentation.model,
    created_at: presentation.createdAt,
    updated_at: presentation.updatedAt,
  }
}

function fromDbRow(row: Record<string, unknown>): PresentationMetadata {
  return {
    id: String(row.id),
    title: String(row.title ?? 'Untitled'),
    slides: Array.isArray(row.slides) ? (row.slides as PresentationMetadata['slides']) : [],
    theme: String(row.theme ?? 'mystique') as PresentationMetadata['theme'],
    language: String(row.language ?? 'en-US'),
    model: String(row.model ?? 'gpt-4o-mini'),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  }
}

function readLocalPresentations(): PresentationMetadata[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.map(fromDbRow) : []
  } catch {
    return []
  }
}

function writeLocalPresentations(presentations: PresentationMetadata[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presentations.map(toDbRow)))
  } catch {
    // ignore storage errors
  }
}

export interface PresentationsListResponse {
  items: PresentationMetadata[]
}

export async function fetchPresentations(): Promise<PresentationsListResponse> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('presentations')
      .select('id, title, slides, theme, language, model, created_at, updated_at')
      .order('updated_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return { items: (data ?? []).map((row) => fromDbRow(row as Record<string, unknown>)) }
  }

  return { items: readLocalPresentations() }
}

export async function fetchPresentation(id: string): Promise<PresentationMetadata | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('presentations')
      .select('id, title, slides, theme, language, model, created_at, updated_at')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return fromDbRow(data as Record<string, unknown>)
  }

  return readLocalPresentations().find((p) => p.id === id) ?? null
}

export function createPresentationDraft(title: string): PresentationMetadata {
  const id = uid()
  const now = new Date().toISOString()
  return {
    id,
    title: title.trim() || 'Untitled Presentation',
    slides: [],
    theme: 'mystique',
    language: 'en-US',
    model: 'gpt-4o-mini',
    createdAt: now,
    updatedAt: now,
  }
}

export async function savePresentation(
  presentation: PresentationMetadata,
): Promise<PresentationMetadata> {
  const now = new Date().toISOString()
  const toSave: PresentationMetadata = {
    ...presentation,
    updatedAt: now,
  }

  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('presentations')
      .upsert(toDbRow(toSave), { onConflict: 'id' })

    if (error) {
      throw new Error(error.message)
    }

    return toSave
  }

  const all = readLocalPresentations()
  const index = all.findIndex((p) => p.id === toSave.id)
  if (index >= 0) {
    all[index] = toSave
  } else {
    all.unshift(toSave)
  }
  writeLocalPresentations(all)
  return toSave
}

export async function deletePresentation(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('presentations').delete().eq('id', id)
    if (error) {
      throw new Error(error.message)
    }
    return
  }

  const all = readLocalPresentations().filter((p) => p.id !== id)
  writeLocalPresentations(all)
}

export async function duplicatePresentation(
  presentation: PresentationMetadata,
): Promise<PresentationMetadata> {
  const newId = uid()
  const now = new Date().toISOString()
  const copy: PresentationMetadata = {
    ...presentation,
    id: newId,
    title: `${presentation.title} (Copy)`,
    createdAt: now,
    updatedAt: now,
  }
  return savePresentation(copy)
}
