import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthorization, resetAuthorizationCache } from '@/composables/useAuthorization'

// Advanced scenarios:
//  - Admin group shortcut
//  - Mixed roles across org/app/eng producing aggregated capabilities
//  - Caching: primeContext called twice does not re-fetch
//  - Error path: list throws -> error ref populated

const orgId = 'orgX'
const appId = 'appX'
const engId = 'engX'

let orgRoles: string[] = []
let appRoles: string[] = []
let engRoles: string[] = []
let listCallCounts = { org: 0, app: 0, eng: 0 }
let forceError: { org?: boolean; app?: boolean; eng?: boolean } = {}
let userGroupsRef: string[] = []

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    userGroups: { get value() { return userGroupsRef }, set value(v: string[]) { userGroupsRef = v } },
    currentUser: { value: { signInDetails: { loginId: 'user-adv' } } },
    loadCurrentUser: vi.fn().mockResolvedValue(undefined)
  })
}))

vi.mock('aws-amplify/data', () => ({
  generateClient: () => ({
    models: {
      OrganizationMembership: {
        list: vi.fn().mockImplementation(async () => {
          listCallCounts.org++
          if (forceError.org) throw new Error('org list failed')
          return { data: orgRoles.map(r => ({ role: r, organizationId: orgId, userId: 'user-adv' })) }
        })
      },
      ApplicationRoleAssignment: {
        list: vi.fn().mockImplementation(async () => {
          listCallCounts.app++
          if (forceError.app) throw new Error('app list failed')
          return { data: appRoles.map(r => ({ role: r, applicationId: appId, organizationId: orgId, userId: 'user-adv' })) }
        })
      },
      EngagementRoleAssignment: {
        list: vi.fn().mockImplementation(async () => {
          listCallCounts.eng++
          if (forceError.eng) throw new Error('eng list failed')
          return { data: engRoles.map(r => ({ role: r, engagementId: engId, applicationId: appId, organizationId: orgId, userId: 'user-adv' })) }
        })
      }
    }
  })
}))

describe('useAuthorization advanced scenarios', () => {
  beforeEach(() => {
    resetAuthorizationCache()
    orgRoles = []
    appRoles = []
    engRoles = []
    listCallCounts = { org: 0, app: 0, eng: 0 }
    forceError = {}
    userGroupsRef = []
  })

  it('grants everything for admin group without priming', () => {
    userGroupsRef = ['admin']
    const { has } = useAuthorization()
    expect(has('ORG.MANAGE')).toBe(true)
    expect(has('ENG.UPDATE_FINDING')).toBe(true)
  })

  it('aggregates mixed roles across scopes', async () => {
    orgRoles = ['ORG_ADMIN']
    appRoles = ['APP_CONTRIBUTOR'] // adds comment finding caps
    engRoles = ['ENG_READ_ONLY']   // adds ENG.VIEW
    const { has, primeContext } = useAuthorization()
    await primeContext({ organizationId: orgId, applicationId: appId, engagementId: engId })
    expect(has('APP.MANAGE', { applicationId: appId })).toBe(true) // from ORG_ADMIN inheritance
    expect(has('APP.COMMENT_FINDING', { applicationId: appId })).toBe(true) // from APP_CONTRIBUTOR
    expect(has('ENG.VIEW', { engagementId: engId })).toBe(true) // from ENG_READ_ONLY
    expect(has('ENG.MANAGE', { engagementId: engId })).toBe(true) // from ORG_ADMIN inheritance via org->app->eng
  })

  it('does not re-fetch on second primeContext for same IDs (caching)', async () => {
    orgRoles = ['ORG_MEMBER']
    const { primeContext } = useAuthorization()
    await primeContext({ organizationId: orgId })
    await primeContext({ organizationId: orgId })
    expect(listCallCounts.org).toBe(1)
  })

  it('records error when backend list fails', async () => {
    forceError.app = true
    const { primeContext, error } = useAuthorization()
    await primeContext({ applicationId: appId })
    expect(error.value).toContain('app list failed')
  })
})
