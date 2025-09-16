import { describe, it, expect, vi } from 'vitest'
import { useEngagements } from '@/composables/useEngagements'
import { useEngagementParticipants } from '@/composables/useEngagementParticipants'

vi.mock('@/composables/useAuthorization', () => ({
  useAuthorization: () => ({ has: () => true, primeContext: () => Promise.resolve() })
}))
vi.mock('aws-amplify/data', () => {
  const mockEngagement = { id:'e1', title:'Old', code:'ENG-1', phase:'PLANNING', status:'ACTIVE' }
  return {
    generateClient: () => ({
      models: {
        Engagement: {
          update: async (input:any) => ({ data: { ...mockEngagement, ...input } }),
          get: async () => ({ data: mockEngagement }),
          list: async () => ({ data: [mockEngagement] })
        },
        EngagementRoleAssignment: {
          list: async () => ({ data: [] }),
          create: async (input:any) => ({ data: input }),
          delete: async () => ({})
        }
      }
    })
  }
})

import { nextTick } from 'vue'

describe('Engagement workflow composables', () => {
  it('updates engagement metadata', async () => {
    const eng = useEngagements()
    const updated = await eng.updateMeta('e1', { title:'New Title' })
    expect(updated?.title).toBe('New Title')
  })
  it('assigns and removes participants', async () => {
    const parts = useEngagementParticipants()
    await parts.list('e1')
    expect(parts.participants.value).toHaveLength(0)
    await parts.assign({ engagementId:'e1', userId:'u1', role:'ENG_COLLABORATOR', organizationId:'o1', applicationId:'a1' })
    expect(parts.participants.value.find(p=>p.userId==='u1')).toBeTruthy()
    await parts.remove('u1','e1')
    expect(parts.participants.value.find(p=>p.userId==='u1')).toBeFalsy()
  })
})
