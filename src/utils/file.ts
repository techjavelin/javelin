// Shared file / download utilities
// Provides human readable file size formatting and a safe browser download trigger.

export function humanFileSize(bytes?: number | null, opts?: { decimals?: number }): string {
  if (bytes == null || isNaN(bytes as any)) return '-'
  if (bytes < 0) return '-'
  const units = ['B','KB','MB','GB','TB','PB'] as const
  if (bytes === 0) return '0 B'
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const value = bytes / Math.pow(1024, i)
  const decimals = opts?.decimals ?? (value < 10 && i > 0 ? 1 : 0)
  return `${value.toFixed(decimals)} ${units[i]}`
}

export function triggerBrowserDownload(source: Blob | string | { href: string }, filename = 'download'): void {
  try {
    const url = typeof source === 'string'
      ? source
      : (source instanceof Blob ? URL.createObjectURL(source) : source.href)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    if (source instanceof Blob) setTimeout(() => URL.revokeObjectURL(url), 4000)
  } catch (e) {
    console.error('triggerBrowserDownload failed', e)
  }
}
