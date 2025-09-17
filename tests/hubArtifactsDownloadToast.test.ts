import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import HubArtifacts from '@/pages/hub/HubArtifacts.vue'

const mockGetUrl = vi.fn(async () => ({ url: new URL('https://example.com/file.pdf') }))
vi.mock('aws-amplify/storage', () => ({ getUrl: mockGetUrl }))

let currentCaps: string[] = []
vi.mock('@/composables/useHubAuth', () => ({ useHubAuth: () => ({ has: (c:string)=> currentCaps.includes(c) }) }))

vi.mock('@/composables/useAuthorization', () => ({ useAuthorization: () => ({ has: ()=>true }) }))
vi.mock('@/composables/useCurrentOrg', () => ({ useCurrentOrg: () => ({ currentOrgId: { value: 'org1' }, organizations: [], orgsLoading: { value: false }, setCurrentOrg: vi.fn() }) }))

const addToast = vi.fn()
vi.mock('@/composables/useToasts', () => ({ useToasts: () => ({ add: addToast }) }))

vi.mock('@/composables/useHubArtifacts', () => ({
  useHubArtifacts: () => ({
    artifacts: { value: [ { id:'a1', name:'Doc1', size: 1500, storageKey: 'k1', contentType:'application/pdf' } ] },
    loading: { value: false },
    error: { value: null },
    listByOrg: vi.fn()
  })
}))

// Patch triggerBrowserDownload so we don't actually navigate
vi.mock('@/utils/file', () => ({ humanFileSize: (n:number)=>`${n} B`, triggerBrowserDownload: vi.fn() }))

function mountWithCaps(caps: string[]) { currentCaps = caps; return mount(HubArtifacts) }

describe('HubArtifacts download toast', () => {
  it('adds toast after download click', async () => {
    const w = mountWithCaps(['HUB.UPLOAD_ARTIFACT'])
    const btn = w.find('button.dl')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')
    expect(mockGetUrl).toHaveBeenCalled()
    expect(addToast).toHaveBeenCalled()
    expect(addToast.mock.calls.find(c=>/Downloading/i.test(c[0].message))).toBeTruthy()
  })
})
