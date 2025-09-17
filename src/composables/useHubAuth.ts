import { computed } from 'vue'
import { useAuth } from './useAuth'

// Lightweight capability mapping for Hub roles -> capabilities
// Future: drive from backend / policy engine
const ROLE_CAPS: Record<string,string[]> = {
  'admin': ['HUB.VIEW_ORG_DASH','HUB.VIEW_ENGAGEMENT','HUB.VIEW_PUBLISHED_FINDINGS','HUB.VIEW_DRAFT_FINDINGS','HUB.DOWNLOAD_ARTIFACT','HUB.UPLOAD_ARTIFACT','HUB.MANAGE_ORG_USERS','HUB.REQUEST_SERVICE'],
  'client-hub-admin': ['HUB.VIEW_ORG_DASH','HUB.VIEW_ENGAGEMENT','HUB.VIEW_PUBLISHED_FINDINGS','HUB.DOWNLOAD_ARTIFACT','HUB.UPLOAD_ARTIFACT','HUB.MANAGE_ORG_USERS','HUB.REQUEST_SERVICE'],
  'client-hub-manager': ['HUB.VIEW_ORG_DASH','HUB.VIEW_ENGAGEMENT','HUB.VIEW_PUBLISHED_FINDINGS','HUB.DOWNLOAD_ARTIFACT','HUB.UPLOAD_ARTIFACT','HUB.REQUEST_SERVICE'],
  'client-hub-viewer': ['HUB.VIEW_ORG_DASH','HUB.VIEW_ENGAGEMENT','HUB.VIEW_PUBLISHED_FINDINGS']
}

export function useHubAuth(){
  const { userGroups, currentUser } = useAuth()
  const capabilities = computed(()=>{
    const caps = new Set<string>()
    userGroups.value.forEach(g => {
      const mapped = ROLE_CAPS[g]
      if (mapped) mapped.forEach(c=>caps.add(c))
      // admin override if group named 'admin'
      if (g==='admin') ROLE_CAPS['admin'].forEach(c=>caps.add(c))
    })
    return Array.from(caps)
  })
  function has(cap: string){ return capabilities.value.includes(cap) }
  return { capabilities, has, currentUser }
}
export type UseHubAuthReturn = ReturnType<typeof useHubAuth>
