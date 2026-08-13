'use client';

export interface Asset {
  id?: string;
  type: 'video' | 'image';
  url: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  prompt?: string;
  script?: string;
  studio?: string;
  aspectRatio?: string;
}

export interface ThumbnailState {
  templateId?: string;
  values?: Record<string, any>;
  references?: string[];
  imageUrl?: string;
  responseId?: string;
  aspectRatio?: string;
}

export interface CopyState {
  master: string
  platforms: Record<
    string,
    { caption?: string; title?: string; description?: string }
  >
  responseId?: string
  variants: Array<{ id: string; label: string; text: string }>
  selectedVariantId?: string
  headline?: string
  subheadline?: string
  subject?: string
  visualIdea?: string
  title?: string
  description?: string
  tags?: string
  caption?: string
  tiktokTitle?: string
}

export type WriteCopyState = CopyState

export interface ThumbnailState {
  templateId?: string
  values?: Record<string, any>
  references?: string[]
  imageUrl?: string
  responseId?: string
  aspectRatio?: string
}

export interface Destination {
  id: string
  platform: 'youtube' | 'instagram' | 'tiktok' | 'facebook' | 'linkedin' | 'pinterest' | 'threads' | 'x'
  accountId?: string
  accountName?: string
  accountImage?: string
  enabled: boolean
  settings?: Record<string, any>
}

export type PublishStatus = 'queued' | 'uploading' | 'processing' | 'published' | 'failed'

export interface PublishResult {
  platform: string
  status: PublishStatus
  url?: string
  error?: string
  accountId?: string
  requestId?: string
  output?: any
  link?: string | null
}

export interface WriteStepProps {
  asset: Asset
  copy: CopyState
  onUpdateCopy: (copy: CopyState) => void
}

export interface ThumbnailStepProps {
  asset: Asset
  thumbnail: ThumbnailState
  onUpdateThumbnail: (t: ThumbnailState) => void
  copy: CopyState
}

export interface DestinationsStepProps {
  asset: Asset
  copy: CopyState
  destinations: Destination[]
  onChange: (destinations: Destination[]) => void
  publishResults: PublishResult[]
  onPublish: (destinations: Destination[]) => void
  onUpdatePublishResults: (results: PublishResult[]) => void
  publishing: boolean
  apiKey: string
  mediaType: 'video' | 'image'
}

export interface ReviewPublishStepProps {
  asset: Asset
  copy: CopyState
  thumbnail: ThumbnailState
  destinations: Destination[]
  publishResults: PublishResult[]
  onConfirm: () => void
  onBack: () => void
  publishing: boolean
}

export const STEPS = [
  { id: 'write', label: 'Write' },
  { id: 'thumbnail', label: 'Thumbnail' },
  { id: 'destinations', label: 'Destinations' },
  { id: 'review', label: 'Review & Publish' },
] as const;

export type StepId = (typeof STEPS)[number]['id'];
