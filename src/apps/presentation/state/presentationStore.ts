import { create } from 'zustand'
import type { Slide } from '@/apps/presentation/lib/parser'
import {
  type ThemeName,
  defaultThemeId,
} from '@/apps/presentation/lib/themes'

export interface PresentationMetadata {
  id: string
  title: string
  theme: ThemeName
  language: string
  model: string
  slides: Slide[]
  createdAt: string
  updatedAt: string
}

export interface GenerationOptions {
  prompt: string
  title: string
  language: string
  model: string
  numSlides: number
}

interface PresentationState {
  // Current presentation
  id: string | null
  title: string
  slides: Slide[]
  theme: ThemeName
  language: string
  model: string
  outline: string[]

  // UI / generation
  isGeneratingOutline: boolean
  isGeneratingSlides: boolean
  isSaving: boolean
  lastSavedAt: Date | null
  error: string | null

  // Derived
  hasSlides: () => boolean

  // Actions
  setTitle: (title: string) => void
  setSlides: (slides: Slide[] | ((slides: Slide[]) => Slide[])) => void
  updateSlide: (id: string, updates: Partial<Slide>) => void
  addSlide: (afterId?: string) => void
  removeSlide: (id: string) => void
  reorderSlides: (fromIndex: number, toIndex: number) => void
  setTheme: (theme: ThemeName) => void
  setLanguage: (language: string) => void
  setModel: (model: string) => void
  setOutline: (outline: string[]) => void
  loadPresentation: (presentation: PresentationMetadata) => void
  resetPresentation: () => void
  setGeneratingOutline: (isGenerating: boolean) => void
  setGeneratingSlides: (isGenerating: boolean) => void
  setSaving: (isSaving: boolean) => void
  setLastSavedAt: (date: Date | null) => void
  setError: (error: string | null) => void
  resetGenerationFlags: () => void
  setSlideImageUrl: (slideId: string, url: string) => void
}

const createBlankSlide = (): Slide => ({
  id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
  title: 'New Slide',
  bullets: ['Add your first bullet point'],
})

const initialState = {
  id: null as string | null,
  title: '',
  slides: [] as Slide[],
  theme: defaultThemeId,
  language: 'en-US',
  model: 'gpt-4o-mini',
  outline: [] as string[],
  isGeneratingOutline: false,
  isGeneratingSlides: false,
  isSaving: false,
  lastSavedAt: null as Date | null,
  error: null as string | null,
}

export const usePresentationStore = create<PresentationState>((set, get) => ({
  ...initialState,

  hasSlides: () => get().slides.length > 0,

  setTitle: (title) => set({ title }),

  setSlides: (slides) =>
    set((state) => ({
      slides: typeof slides === 'function' ? slides(state.slides) : slides,
    })),

  updateSlide: (id, updates) =>
    set((state) => ({
      slides: state.slides.map((slide) =>
        slide.id === id ? { ...slide, ...updates } : slide,
      ),
    })),

  addSlide: (afterId) =>
    set((state) => {
      const newSlide = createBlankSlide()
      if (!afterId) {
        return { slides: [...state.slides, newSlide] }
      }
      const index = state.slides.findIndex((s) => s.id === afterId)
      if (index === -1) {
        return { slides: [...state.slides, newSlide] }
      }
      const next = [...state.slides]
      next.splice(index + 1, 0, newSlide)
      return { slides: next }
    }),

  removeSlide: (id) =>
    set((state) => ({
      slides: state.slides.filter((slide) => slide.id !== id),
    })),

  reorderSlides: (fromIndex, toIndex) =>
    set((state) => {
      if (
        fromIndex < 0 ||
        fromIndex >= state.slides.length ||
        toIndex < 0 ||
        toIndex >= state.slides.length
      ) {
        return state
      }
      const next = [...state.slides]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return { slides: next }
    }),

  setTheme: (theme) => set({ theme }),
  setLanguage: (language) => set({ language }),
  setModel: (model) => set({ model }),
  setOutline: (outline) => set({ outline }),

  loadPresentation: (presentation) =>
    set({
      id: presentation.id,
      title: presentation.title,
      slides: presentation.slides,
      theme: presentation.theme,
      language: presentation.language,
      model: presentation.model,
      outline: [],
      isGeneratingOutline: false,
      isGeneratingSlides: false,
      error: null,
    }),

  resetPresentation: () => set({ ...initialState }),

  setGeneratingOutline: (isGeneratingOutline) => set({ isGeneratingOutline }),
  setGeneratingSlides: (isGeneratingSlides) => set({ isGeneratingSlides }),
  setSaving: (isSaving) => set({ isSaving }),
  setLastSavedAt: (lastSavedAt) => set({ lastSavedAt }),
  setError: (error) => set({ error }),
  resetGenerationFlags: () =>
    set({
      isGeneratingOutline: false,
      isGeneratingSlides: false,
      error: null,
    }),

  setSlideImageUrl: (slideId, url) =>
    set((state) => ({
      slides: state.slides.map((slide) =>
        slide.id === slideId ? { ...slide, imageUrl: url } : slide,
      ),
    })),
}))
