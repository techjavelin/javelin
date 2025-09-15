import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useApplicationService } from '@/composables/useApplicationService'

// Mock amplify client & composables
vi.mock('aws-amplify/data', () => ({
  generateClient: () => ({
    models: {
      Application: {
        get: vi.fn().mockResolvedValue({ data: { id: 'app1', organizationId: 'org1' } }),
        update: vi.fn().mockResolvedValue({ data: { id: 'app1', name: 'Updated' } }),
        delete: vi.fn().mockResolvedValue({ data: { id: 'app1' } })
      }
    }
  })
}))

vi.mock('@/composables/useAuthorization', () => ({
  useAuthorization: () => ({
    has: (cap: string) => cap === 'APP.MANAGE',
    primeContext: vi.fn().mockResolvedValue(undefined)
  })
}))

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    currentUser: { value: { username: 'tester' } },
    loadCurrentUser: vi.fn().mockResolvedValue(undefined)
  })
}))

describe('useApplicationService', () => {
  let service: ReturnType<typeof useApplicationService>
  beforeEach(() => {
    service = useApplicationService()
  })

  it('updates application with capability', async () => {
    const res = await service.updateApplication({ id: 'app1', name: 'Updated' })
    expect(res.data?.name).toBe('Updated')
  })

  it('deletes application with capability', async () => {
    const res = await service.deleteApplication('app1')
    expect(res.data?.id).toBe('app1')
  })
})
