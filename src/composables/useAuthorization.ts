import { ref, computed } from 'vue'
import { generateClient } from 'aws-amplify/data'
import { withAuth } from '../amplifyClient'
import type { Schema } from '../../amplify/data/resource'
import { useAuth } from './useAuth'

// Capability keys used across UI to gate actions
export type Capability =
  | 'ORG.MANAGE'
  | 'ORG.ADD_MEMBER'
  | 'ORG.ADD_ADMIN'
  | 'APP.MANAGE'
  | 'APP.CREATE_ENGAGEMENT'
  | 'APP.ADD_ADMIN'
  | 'APP.ASSIGN_ROLES'
  | 'APP.COMMENT_FINDING'
  | 'ENG.MANAGE'
  | 'ENG.UPDATE_FINDING'
  | 'ENG.COMMENT_FINDING'
  | 'ENG.VIEW'

interface RoleContextInput {
  organizationId?: string
  applicationId?: string
  engagementId?: string
}

interface CachedAssignments {
  org: Map<string, Set<string>>              // orgId -> roles user holds in that org
  app: Map<string, Set<string>>              // appId -> roles user holds in that app
  eng: Map<string, Set<string>>              // engagementId -> roles user holds in that engagement
  loadedOrgs: Set<string>
  loadedApps: Set<string>
  loadedEngs: Set<string>
  appToOrg: Map<string, string>              // applicationId -> organizationId (for hierarchical inheritance)
  engToApp: Map<string, string>              // engagementId -> applicationId
  engToOrg: Map<string, string>              // engagementId -> organizationId (shortcut)
}

// Role → capabilities mapping (additive; higher scope may imply lower)
const ROLE_CAPS: Record<string, Capability[]> = {
  ORG_ADMIN: ['ORG.MANAGE','ORG.ADD_MEMBER','ORG.ADD_ADMIN','APP.MANAGE','APP.CREATE_ENGAGEMENT','APP.ADD_ADMIN','APP.ASSIGN_ROLES','ENG.MANAGE'],
  ORG_MEMBER: [],
  APP_ADMIN: ['APP.MANAGE','APP.CREATE_ENGAGEMENT','APP.ADD_ADMIN','APP.ASSIGN_ROLES','ENG.MANAGE'],
  APP_CONTRIBUTOR: ['APP.COMMENT_FINDING','ENG.COMMENT_FINDING'],
  APP_READ_ONLY: [],
  ENG_PENTESTER: ['ENG.MANAGE','ENG.UPDATE_FINDING','ENG.COMMENT_FINDING'],
  ENG_CLIENT_ADMIN: ['ENG.MANAGE','ENG.COMMENT_FINDING'],
  ENG_COLLABORATOR: ['ENG.COMMENT_FINDING'],
  ENG_READ_ONLY: ['ENG.VIEW']
}

const client = generateClient<Schema>()

const cache: CachedAssignments = {
  org: new Map(),
  app: new Map(),
  eng: new Map(),
  loadedOrgs: new Set(),
  loadedApps: new Set(),
  loadedEngs: new Set(),
  appToOrg: new Map(),
  engToApp: new Map(),
  engToOrg: new Map()
}

// Test/support utility: clear all cached role data (not used in production flow, but
// exported for deterministic unit testing of capability resolution logic.)
export function resetAuthorizationCache() {
  cache.org.clear()
  cache.app.clear()
  cache.eng.clear()
  cache.loadedOrgs.clear()
  cache.loadedApps.clear()
  cache.loadedEngs.clear()
  cache.appToOrg.clear()
  cache.engToApp.clear()
  cache.engToOrg.clear()
}

const loading = ref(false)
const error = ref<string | null>(null)

export function useAuthorization() {
  const { userGroups, loadCurrentUser, currentUser } = useAuth()

  async function ensureUser() {
    if (!currentUser.value) {
      try { await loadCurrentUser() } catch { /* ignore */ }
    }
  }

  async function loadOrganizationRoles(organizationId: string, userId: string) {
    if (cache.loadedOrgs.has(organizationId)) return
    loading.value = true
    try {
  const resp = await client.models.OrganizationMembership.list(withAuth({ filter: { organizationId: { eq: organizationId }, userId: { eq: userId } } }))
      const set = new Set<string>()
      resp.data?.forEach(m => { if (m.role) set.add(m.role) })
      cache.org.set(organizationId, set)
      cache.loadedOrgs.add(organizationId)
    } catch (e: any) {
      error.value = e.message || 'Failed loading org roles'
    } finally { loading.value = false }
  }

  async function loadApplicationRoles(applicationId: string, userId: string) {
    if (cache.loadedApps.has(applicationId)) return
    loading.value = true
    try {
  const resp = await client.models.ApplicationRoleAssignment.list(withAuth({ filter: { applicationId: { eq: applicationId }, userId: { eq: userId } } }))
      const set = new Set<string>()
      resp.data?.forEach(r => { if (r.role) set.add(r.role) })
      cache.app.set(applicationId, set)
      // derive org mapping from first item if present
      const orgId = resp.data?.[0]?.organizationId
      if (orgId) cache.appToOrg.set(applicationId, orgId)
      cache.loadedApps.add(applicationId)
    } catch (e: any) {
      error.value = e.message || 'Failed loading application roles'
    } finally { loading.value = false }
  }

  async function loadEngagementRoles(engagementId: string, userId: string) {
    if (cache.loadedEngs.has(engagementId)) return
    loading.value = true
    try {
  const resp = await client.models.EngagementRoleAssignment.list(withAuth({ filter: { engagementId: { eq: engagementId }, userId: { eq: userId } } }))
      const set = new Set<string>()
      resp.data?.forEach(r => { if (r.role) set.add(r.role) })
      cache.eng.set(engagementId, set)
      const appId = resp.data?.[0]?.applicationId
      const orgId = resp.data?.[0]?.organizationId
      if (appId) cache.engToApp.set(engagementId, appId)
      if (orgId) cache.engToOrg.set(engagementId, orgId)
      cache.loadedEngs.add(engagementId)
    } catch (e: any) {
      error.value = e.message || 'Failed loading engagement roles'
    } finally { loading.value = false }
  }

  function collectRolesForContext(ctx?: { organizationId?: string; applicationId?: string; engagementId?: string }): Set<string> {
    const result = new Set<string>()
    if (!ctx) return result
    const { organizationId, applicationId, engagementId } = ctx
    if (organizationId) {
      const set = cache.org.get(organizationId)
      set?.forEach(r => result.add(r))
    }
    if (applicationId) {
      const set = cache.app.get(applicationId)
      set?.forEach(r => result.add(r))
      // inherit org roles for app context
      const orgId = cache.appToOrg.get(applicationId)
      if (orgId) cache.org.get(orgId)?.forEach(r => result.add(r))
    }
    if (engagementId) {
      const set = cache.eng.get(engagementId)
      set?.forEach(r => result.add(r))
      const appId = cache.engToApp.get(engagementId)
      if (appId) cache.app.get(appId)?.forEach(r => result.add(r))
      const orgId = cache.engToOrg.get(engagementId) || (appId ? cache.appToOrg.get(appId) : undefined)
      if (orgId) cache.org.get(orgId)?.forEach(r => result.add(r))
    }
    return result
  }

  function effectiveCapabilities(roleNames: Iterable<string>): Set<Capability> {
    const caps = new Set<Capability>()
    for (const r of roleNames) {
      const arr = ROLE_CAPS[r]
      if (arr) arr.forEach(c => caps.add(c))
    }
    if (userGroups.value.includes('admin')) {
      Object.values(ROLE_CAPS).flat().forEach(c => caps.add(c))
    }
    return caps
  }

  function has(cap: Capability, ctx?: { organizationId?: string; applicationId?: string; engagementId?: string }) {
    if (userGroups.value.includes('admin')) return true
    const roles = collectRolesForContext(ctx)
    return effectiveCapabilities(roles).has(cap)
  }

  async function primeContext(ctx: RoleContextInput) {
    await ensureUser()
    const userId = (currentUser.value as any)?.signInDetails?.loginId || (currentUser.value as any)?.userId || ''
    if (!userId) return
    const tasks: Promise<any>[] = []
    if (ctx.organizationId) tasks.push(loadOrganizationRoles(ctx.organizationId, userId))
    if (ctx.applicationId) tasks.push(loadApplicationRoles(ctx.applicationId, userId))
    if (ctx.engagementId) tasks.push(loadEngagementRoles(ctx.engagementId, userId))
    await Promise.all(tasks)
  }

  return {
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    has,
    primeContext,
    ROLE_CAPS
  }
}

export type UseAuthorizationReturn = ReturnType<typeof useAuthorization>