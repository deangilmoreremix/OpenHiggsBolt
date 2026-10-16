// Limits and allowlists mirror the MuAPI File Upload API contract
// (https://muapi.ai/docs/file-upload):
//   Images  10MB  .jpg .png .webp
//   Videos  50MB  .mp4 .mov
//   Others  10MB  .zip .pdf .json
// Audio is treated as an "others" 10MB category.
export const UPLOAD_LIMITS = {
  image: 10 * 1024 * 1024,
  video: 50 * 1024 * 1024,
  audio: 10 * 1024 * 1024,
  other: 10 * 1024 * 1024,
} as const;

export const UPLOAD_MIME_TYPES = {
  image: new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  // .mov (video/quicktime) is documented by the spec and is the most common
  // iPhone-recorded format, so it must not be rejected.
  video: new Set(['video/mp4', 'video/webm', 'video/quicktime']),
  audio: new Set(['audio/mpeg', 'audio/wav', 'audio/webm']),
  // Documented "Others" category.
  other: new Set(['application/zip', 'application/pdf', 'application/json']),
} as const;

export function getUploadLimit(file: File): number {
  if (file.type.startsWith('video/')) return UPLOAD_LIMITS.video;
  if (file.type.startsWith('audio/')) return UPLOAD_LIMITS.audio;
  return UPLOAD_LIMITS.other;
}

export function normalizeImageMimeType(mime: string): string {
  return mime === 'image/jpg' ? 'image/jpeg' : mime;
}

export type UploadCategory = 'image' | 'video' | 'audio' | 'other'

/**
 * Whether a file's MIME type is allowed.
 *
 * With no `category`, returns true for anything the MuAPI spec supports
 * (images, videos, audio, and the documented ".zip .pdf .json" others).
 *
 * Pass a `category` to restrict a media-specific caller: `uploadImage()`
 * for example accepts images only and must keep rejecting a PDF even
 * though MuAPI would accept it, so its own contract stays intact.
 */
export function isAllowedUploadMimeType(file: File, category?: UploadCategory): boolean {
  const type = file.type

  if (category === 'image') {
    return UPLOAD_MIME_TYPES.image.has(type) || UPLOAD_MIME_TYPES.image.has(normalizeImageMimeType(type))
  }
  if (category === 'video') return UPLOAD_MIME_TYPES.video.has(type)
  if (category === 'audio') return UPLOAD_MIME_TYPES.audio.has(type)
  if (category === 'other') return UPLOAD_MIME_TYPES.other.has(type)

  return (
    UPLOAD_MIME_TYPES.image.has(type) ||
    UPLOAD_MIME_TYPES.image.has(normalizeImageMimeType(type)) ||
    UPLOAD_MIME_TYPES.video.has(type) ||
    UPLOAD_MIME_TYPES.audio.has(type) ||
    UPLOAD_MIME_TYPES.other.has(type)
  )
}

export function getUploadAcceptAttribute(fileType?: 'image' | 'video' | 'audio'): string {
  if (fileType === 'video') return 'video/*';
  if (fileType === 'audio') return 'audio/*';
  return 'image/*';
}
