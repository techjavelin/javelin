import amplifyOutputs from '../../amplify_outputs.json'

let cachedBase: string | null = null

export function getAdminApiBase(): string {
  if (cachedBase) return cachedBase
  // 1. Explicit env override wins
  const envRaw = import.meta.env.VITE_ADMIN_API_BASE as string | undefined
  let candidate = envRaw && envRaw.trim()
  // 2. Fallback: derive from amplify outputs custom API ("Sigint API" or first custom entry)
  if (!candidate) {
    try {
      const customApis = (amplifyOutputs as any)?.custom?.API || {}
      const sigint = customApis['Sigint API']
      if (sigint?.endpoint) candidate = sigint.endpoint
      else {
        // pick first endpoint if present
        const firstKey = Object.keys(customApis)[0]
        if (firstKey && customApis[firstKey]?.endpoint) candidate = customApis[firstKey].endpoint
      }
    } catch {}
  }
  if (!candidate) {
    cachedBase = ''
    return ''
  }
  // normalize: remove trailing slash
  cachedBase = candidate.replace(/\/$/, '')
  return cachedBase
}

export function buildAdminApiPath(path: string): string {
  const base = getAdminApiBase()
  if (!base) {
    // Intentionally return a sentinel path but also surface a console warning once per session (best-effort)
    if (typeof window !== 'undefined' && !(window as any).__ADMIN_API_BASE_WARNED__) {
      // eslint-disable-next-line no-console
      console.warn('[AdminAPI] VITE_ADMIN_API_BASE not set. Create .env.local with VITE_ADMIN_API_BASE=<invokeUrl> and restart dev server.')
      ;(window as any).__ADMIN_API_BASE_WARNED__ = true
    }
    return '/admin-api-misconfigured'
  }
  if (!path.startsWith('/')) path = '/' + path
  return base + path
}
