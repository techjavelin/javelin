export interface ResizeOptions { maxSize?: number; mimeType?: string; quality?: number }

// Resize an image file to a square bounding box preserving aspect ratio (default 256px)
export async function downscaleImage(file: File, options: ResizeOptions = {}): Promise<{ dataUrl: string; width: number; height: number }> {
  const maxSize = options.maxSize ?? 256
  const mimeType = options.mimeType || 'image/webp'
  const quality = options.quality ?? 0.85

  const imageBitmap = await createImageBitmap(file)
  let { width, height } = imageBitmap
  if (width <= maxSize && height <= maxSize) {
    // No resize needed; still convert to requested format via canvas for consistency
    return await bitmapToDataUrl(imageBitmap, width, height, mimeType, quality)
  }
  const scale = Math.min(maxSize / width, maxSize / height)
  const targetW = Math.round(width * scale)
  const targetH = Math.round(height * scale)
  return await bitmapToDataUrl(imageBitmap, targetW, targetH, mimeType, quality)
}

async function bitmapToDataUrl(bitmap: ImageBitmap, w: number, h: number, mime: string, quality: number) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, w, h)
  const dataUrl = canvas.toDataURL(mime, quality)
  return { dataUrl, width: w, height: h }
}
