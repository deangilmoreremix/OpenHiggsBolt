export const UPLOAD_LIMITS = {
  image: 10 * 1024 * 1024,
  video: 50 * 1024 * 1024,
  audio: 10 * 1024 * 1024,
} as const;

export const UPLOAD_MIME_TYPES = {
  image: new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  video: new Set(['video/mp4', 'video/webm']),
  audio: new Set(['audio/mpeg', 'audio/wav', 'audio/webm']),
} as const;

export function getUploadLimit(file: File): number {
  if (file.type.startsWith('video/')) return UPLOAD_LIMITS.video;
  if (file.type.startsWith('audio/')) return UPLOAD_LIMITS.audio;
  return UPLOAD_LIMITS.image;
}

export function isAllowedUploadMimeType(file: File): boolean {
  if (file.type.startsWith('image/')) return UPLOAD_MIME_TYPES.image.has(file.type);
  if (file.type.startsWith('video/')) return UPLOAD_MIME_TYPES.video.has(file.type);
  if (file.type.startsWith('audio/')) return UPLOAD_MIME_TYPES.audio.has(file.type);
  return false;
}

export function normalizeImageMimeType(mime: string): string {
  return mime === 'image/jpg' ? 'image/jpeg' : mime;
}

export function getUploadAcceptAttribute(fileType?: 'image' | 'video' | 'audio'): string {
  if (fileType === 'video') return 'video/*';
  if (fileType === 'audio') return 'audio/*';
  return 'image/*';
}
