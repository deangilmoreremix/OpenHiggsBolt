import { create } from 'zustand'

export interface Video {
  id: string
  tenant_id: string
  name: string
  description?: string
  type: 'generation' | 'upload' | 'clone' | 'campaign'
  prompt?: string
  source_video_url?: string
  generated_url?: string
  thumbnail_url?: string
  duration?: number
  status: 'processing' | 'completed' | 'failed'
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface VideoListResponse {
  videos: Video[]
  total: number
  page: number
  limit: number
  total_pages: number
}

interface VidecoState {
  videos: Video[]
  total: number
  page: number
  totalPages: number
  loading: boolean
  filterType: string | null
  filterStatus: string | null
  currentVideo: Video | null
  generating: boolean
  generationProgress: string

  setVideos: (response: VideoListResponse) => void
  addVideo: (video: Video) => void
  updateVideo: (id: string, updates: Partial<Video>) => void
  removeVideo: (id: string) => void
  setLoading: (loading: boolean) => void
  setFilterType: (type: string | null) => void
  setFilterStatus: (status: string | null) => void
  setCurrentVideo: (video: Video | null) => void
  setGenerating: (generating: boolean) => void
  setGenerationProgress: (progress: string) => void
  nextPage: () => void
  resetPage: () => void
}

export const useVidecoStore = create<VidecoState>((set) => ({
  videos: [],
  total: 0,
  page: 1,
  totalPages: 1,
  loading: false,
  filterType: null,
  filterStatus: null,
  currentVideo: null,
  generating: false,
  generationProgress: '',

  setVideos: (response) =>
    set({
      videos: response.videos,
      total: response.total,
      page: response.page,
      totalPages: response.total_pages,
    }),

  addVideo: (video) =>
    set((state) => ({
      videos: [video, ...state.videos],
      total: state.total + 1,
    })),

  updateVideo: (id, updates) =>
    set((state) => ({
      videos: state.videos.map((v) =>
        v.id === id ? { ...v, ...updates } : v
      ),
    })),

  removeVideo: (id) =>
    set((state) => ({
      videos: state.videos.filter((v) => v.id !== id),
      total: state.total - 1,
    })),

  setLoading: (loading) => set({ loading }),
  setFilterType: (filterType) => set({ filterType, page: 1 }),
  setFilterStatus: (filterStatus) => set({ filterStatus, page: 1 }),
  setCurrentVideo: (currentVideo) => set({ currentVideo }),
  setGenerating: (generating) => set({ generating }),
  setGenerationProgress: (generationProgress) => set({ generationProgress }),
  nextPage: () => set((state) => ({ page: state.page + 1 })),
  resetPage: () => set({ page: 1 }),
}))
