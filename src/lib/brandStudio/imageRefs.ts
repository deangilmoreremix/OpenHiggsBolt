// MuAPI's image-edit models only accept raster references. An SVG / ICO / GIF logo makes the whole job fail
// with "The file format is not supported".
const UNSUPPORTED = /\.(svg|ico|gif|avif|bmp|tiff?)(?:[?#]|$)/i

export function isUsableImageRef(url: unknown): url is string {
  if (typeof url !== 'string' || !url) return false
  if (url.startsWith('data:')) return /^data:image\/(png|jpe?g|webp)/i.test(url)
  if (!/^https?:\/\//i.test(url)) return false
  return !UNSUPPORTED.test(url)
}

export const usableImageRefs = (urls: unknown[] | undefined): string[] => (urls || []).filter(isUsableImageRef)
