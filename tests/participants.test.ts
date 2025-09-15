import { describe, it, expect, vi, beforeEach } from 'vitest'

// Use vi.hoisted so these mocks are available to the hoisted vi.mock factory (avoids TDZ ReferenceError)
const { hasMock, listMock, createMock, deleteMock } = vi.hoisted(() => ({
  hasMock: vi.fn(),
  listMock: vi.fn(),
  createMock: vi.fn(),
  deleteMock: vi.fn()
}))

vi.mock('@/composables/useAuthorization', () => ({
  useAuthorization: () => ({ has: hasMock })
}))

vi.mock('aws-amplify/data', () => ({
  generateClient: () => ({
    models: {
      EngagementRoleAssignment: {
        list: listMock,
        create: createMock,
        delete: deleteMock
      }
    }
  })
}))

import { useEngagementParticipants } from '@/composables/useEngagementParticipants'

describe('useEngagementParticipants', () => {
  beforeEach(() => {
    hasMock.mockReset()
    listMock.mockReset()
    createMock.mockReset()
    deleteMock.mockReset()
  })

  it('lists participants', async () => {
    listMock.mockResolvedValue({ data: [{ engagementId: 'e1', userId: 'u1', role: 'ENG_PENTESTER', organizationId: 'o1', applicationId: 'app' }] })
    const { list, participants } = useEngagementParticipants()
    await list('e1')
    expect(participants.value.length).toBe(1)
  })

  it('enforces ENG.MANAGE on assign', async () => {
    hasMock.mockReturnValue(false)
    const { assign } = useEngagementParticipants()
    await expect(assign({ engagementId: 'e1', userId: 'u2', role: 'ENG_PENTESTER', organizationId: 'o1', applicationId: 'app' } as any)).rejects.toThrow('Forbidden')
  })

  it('assigns when allowed', async () => {
    hasMock.mockReturnValue(true)
    createMock.mockResolvedValue({ data: { engagementId: 'e1', userId: 'u2', role: 'ENG_PENTESTER', organizationId: 'o1', applicationId: 'app' } })
    const { assign, participants } = useEngagementParticipants()
    await assign({ engagementId: 'e1', userId: 'u2', role: 'ENG_PENTESTER', organizationId: 'o1', applicationId: 'app' } as any)
  expect(participants.value.find((p: any) => p.userId === 'u2')).toBeTruthy()
  })

  it('removes when allowed', async () => {
    hasMock.mockReturnValue(true)
    listMock.mockResolvedValue({ data: [{ engagementId: 'e1', userId: 'u1', role: 'ENG_PENTESTER', organizationId: 'o1', applicationId: 'app' }] })
    deleteMock.mockResolvedValue({})
    const { list, remove, participants } = useEngagementParticipants()
    await list('e1')
    await remove('u1','e1')
    expect(participants.value.length).toBe(0)
  })
})
