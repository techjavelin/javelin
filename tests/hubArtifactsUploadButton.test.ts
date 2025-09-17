import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import HubArtifacts from '@/pages/hub/HubArtifacts.vue'

vi.mock('@/composables/useHubArtifacts', () => ({
  useHubArtifacts: () => ({ artifacts: { value: [] }, loading: { value: false }, error: { value: null }, listByOrg: vi.fn() })
}))

const makeAuthMock = (caps: string[]) => ({ has: (c: string) => caps.includes(c) })

vi.mock('@/composables/useAuthorization', () => ({ useAuthorization: () => makeAuthMock([]) }))
vi.mock('@/composables/useCurrentOrg', () => ({ useCurrentOrg: () => ({ currentOrgId: { value: 'org1' }, organizations: [], orgsLoading: { value: false }, setCurrentOrg: vi.fn() }) }))

// We'll dynamically override returned caps per test by reassigning module export
let currentCaps: string[] = []
vi.mock('@/composables/useHubAuth', () => ({ useHubAuth: () => ({ has: (c:string)=> currentCaps.includes(c) }) }))

// Utility to mount with changing capability set
function mountWithCaps(caps: string[]) {
  currentCaps = caps
  return mount(HubArtifacts)
}

describe('HubArtifacts upload button gating', () => {
  it('shows upload button when HUB.UPLOAD_ARTIFACT present', () => {
    const w = mountWithCaps(['HUB.UPLOAD_ARTIFACT'])
    expect(w.find('button.mini-btn').text()).toMatch(/Upload/i)
  })
  it('hides upload button without capability', () => {
    const w = mountWithCaps([])
    const btns = w.findAll('button.mini-btn')
    expect(btns.find(b=>/Upload/i.test(b.text()))).toBeUndefined()
  })
})
