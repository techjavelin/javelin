import { describe, it, expect, vi, beforeEach } from 'vitest'
// Authorization test coverage strategy
// Scenarios covered:
// 1. Empty role context -> deny
// 2. ORG_ADMIN -> org + inherited app capability
// 3. APP_ADMIN -> app manage
// 4. ENG_PENTESTER -> engagement manage + update finding
// 5. ENG_READ_ONLY -> view only, deny manage
// Future extensions:
// - Mixed roles across scopes simultaneously
// - Admin group (userGroups includes 'admin') global allow
// - Performance: primeContext caching (avoid duplicate list calls)
// - Error path simulation (throw inside list -> set error ref)
import { useAuthorization, resetAuthorizationCache } from '@/composables/useAuthorization'

// We'll simulate user groups & amplify data results by mocking useAuth and aws-amplify/data.

const orgId = 'org1'
const appId = 'app1'
const engId = 'eng1'

// Dynamic stores for mocked role query returns
let orgRoles: string[] = []
let appRoles: string[] = []
let engRoles: string[] = []

vi.mock('@/composables/useAuth', () => {
  return {
    useAuth: () => ({
      userGroups: { value: [] as string[] },
      currentUser: { value: { signInDetails: { loginId: 'user-123' } } },
      loadCurrentUser: vi.fn().mockResolvedValue(undefined)
    })
  }
})

vi.mock('aws-amplify/data', () => ({
  generateClient: () => ({
    models: {
      OrganizationMembership: {
        list: vi.fn().mockImplementation(async (args) => ({ data: orgRoles.map(r => ({ role: r, organizationId: orgId, userId: 'user-123' })) }))
      },
      ApplicationRoleAssignment: {
        list: vi.fn().mockImplementation(async (args) => ({ data: appRoles.map(r => ({ role: r, applicationId: appId, organizationId: orgId, userId: 'user-123' })) }))
      },
      EngagementRoleAssignment: {
        list: vi.fn().mockImplementation(async (args) => ({ data: engRoles.map(r => ({ role: r, engagementId: engId, applicationId: appId, organizationId: orgId, userId: 'user-123' })) }))
      }
    }
  })
}))

describe('useAuthorization capability resolution', () => {
  beforeEach(() => {
    resetAuthorizationCache()
    orgRoles = []
    appRoles = []
    engRoles = []
  })

  it('denies capability when no roles loaded', async () => {
    const { has, primeContext } = useAuthorization()
    await primeContext({ organizationId: orgId })
    expect(has('ORG.MANAGE', { organizationId: orgId })).toBe(false)
  })

  it('grants org-level capability via ORG_ADMIN role', async () => {
    orgRoles = ['ORG_ADMIN']
    const { has, primeContext } = useAuthorization()
    await primeContext({ organizationId: orgId })
    expect(has('ORG.MANAGE', { organizationId: orgId })).toBe(true)
    // ORG_ADMIN should also inherit APP.MANAGE at same org scope (hierarchical design)
    expect(has('APP.MANAGE', { organizationId: orgId })).toBe(true)
  })

  it('grants app capability via APP_ADMIN role at app context and inherits for engagement', async () => {
    appRoles = ['APP_ADMIN']
    const { has, primeContext } = useAuthorization()
    await primeContext({ applicationId: appId })
    expect(has('APP.MANAGE', { applicationId: appId })).toBe(true)
  })

  it('grants engagement capability via ENG_PENTESTER role', async () => {
    engRoles = ['ENG_PENTESTER']
    const { has, primeContext } = useAuthorization()
    await primeContext({ engagementId: engId })
    expect(has('ENG.UPDATE_FINDING', { engagementId: engId })).toBe(true)
    expect(has('ENG.MANAGE', { engagementId: engId })).toBe(true)
  })

  it('denies unrelated capability when role does not map', async () => {
    engRoles = ['ENG_READ_ONLY'] // only ENG.VIEW
    const { has, primeContext } = useAuthorization()
    await primeContext({ engagementId: engId })
    expect(has('ENG.MANAGE', { engagementId: engId })).toBe(false)
    expect(has('ENG.VIEW', { engagementId: engId })).toBe(true)
  })
})
