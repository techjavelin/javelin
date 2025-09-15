import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Schema } from '../amplify/data/resource'

// Declare mocks BEFORE importing the composable so module factory sees them
const listMock = vi.fn()
const createMock = vi.fn()
const updateMock = vi.fn()
const deleteMock = vi.fn()

vi.mock('aws-amplify/data', () => ({
  generateClient: () => ({
    models: {
      Application: {
        list: listMock,
        create: createMock,
        update: updateMock,
        delete: deleteMock,
        get: vi.fn()
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

vi.mock('@/composables/useApplicationService', () => ({
  useApplicationService: () => ({
    updateApplication: vi.fn().mockResolvedValue({ data: { id: 'id1', name: 'Changed' } }),
    deleteApplication: vi.fn().mockResolvedValue({ data: { id: 'id1' } })
  })
}))

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({ currentUser: { value: { username: 't' } }, loadCurrentUser: vi.fn() })
}))

describe('useApplications composable', () => {
  beforeEach(()=>{
    listMock.mockReset().mockResolvedValue({ data: [], nextToken: undefined })
  createMock.mockReset().mockResolvedValue({ data: { id: 'id1', name: 'App1', organizationId: 'org1', applicationTypeKey: 'web_app', userTypeKeys: ['customer'] } as Schema['Application']['type'] })
  })

  it('creates application when capability present', async () => {
    const { useApplications } = await import('@/composables/useApplications')
    const { create, applications } = useApplications()
  await create({ organizationId: 'org1', name: 'App1', applicationTypeKey: 'web_app', userTypeKeys: ['customer'] })
    expect(applications.value.length).toBe(1)
  })

  it('lists applications', async () => {
  listMock.mockResolvedValueOnce({ data: [{ id: 'a', name: 'A', organizationId: 'org1', applicationTypeKey: 'web_app', userTypeKeys: ['customer'] }], nextToken: undefined })
    const { useApplications } = await import('@/composables/useApplications')
    const { list, applications } = useApplications()
    await list({ organizationId: 'org1' })
    expect(applications.value[0].id).toBe('a')
  })
})
