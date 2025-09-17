import { describe, it, expect, vi } from 'vitest'
import { useHubAuth } from '@/composables/useHubAuth'

// We'll mock useAuth to supply different user group arrays.
vi.mock('@/composables/useAuth', () => {
  return {
    useAuth: () => ({
      userGroups: { value: mockGroups },
      currentUser: { value: { id: 'u1' } }
    })
  }
})

let mockGroups: string[] = []

describe('hub auth capabilities', () => {
  it('admin includes upload capability', () => {
    mockGroups = ['admin']
    const { capabilities, has } = useHubAuth()
    expect(has('HUB.UPLOAD_ARTIFACT')).toBe(true)
    expect(capabilities.value).toContain('HUB.UPLOAD_ARTIFACT')
  })
  it('client-hub-manager includes upload capability', () => {
    mockGroups = ['client-hub-manager']
    const { has } = useHubAuth()
    expect(has('HUB.UPLOAD_ARTIFACT')).toBe(true)
  })
  it('viewer does not include upload capability', () => {
    mockGroups = ['client-hub-viewer']
    const { has } = useHubAuth()
    expect(has('HUB.UPLOAD_ARTIFACT')).toBe(false)
  })
})
