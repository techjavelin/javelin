import { ref } from 'vue'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import { useAuthorization } from './useAuthorization'

const client = generateClient<Schema>()

type ParticipantAssignment = Schema['EngagementRoleAssignment']['type']

export function useEngagementParticipants() {
  const participants = ref<ParticipantAssignment[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const { has } = useAuthorization()

  async function list(engagementId: string) {
    loading.value = true; error.value = null
    try {
      const res = await client.models.EngagementRoleAssignment.list()
      participants.value = (res.data || []).filter(r => r.engagementId === engagementId)
    } catch (e: any) {
      error.value = e.message || 'Failed to load participants'
    } finally { loading.value = false }
  }

  async function assign(input: { engagementId: string; userId: string; role: ParticipantAssignment['role']; organizationId: string; applicationId: string }) {
    if (!has('ENG.MANAGE', { engagementId: input.engagementId })) throw new Error('Forbidden: ENG.MANAGE required')
    loading.value = true; error.value = null
    try {
      const res = await client.models.EngagementRoleAssignment.create({ ...input })
      if (res.data) participants.value.push(res.data)
      return res.data || null
    } catch (e: any) {
      error.value = e.message || 'Failed to assign participant'
      throw e
    } finally { loading.value = false }
  }

  async function remove(userId: string, engagementId: string) {
    if (!has('ENG.MANAGE', { engagementId })) throw new Error('Forbidden: ENG.MANAGE required')
    loading.value = true; error.value = null
    try {
      // Composite identifier (engagementId,userId). The generated client uses the same shape as create keys.
      await client.models.EngagementRoleAssignment.delete({ engagementId, userId })
      participants.value = participants.value.filter(p => !(p.engagementId === engagementId && p.userId === userId))
    } catch (e: any) {
      error.value = e.message || 'Failed to remove participant'
      throw e
    } finally { loading.value = false }
  }

  return { participants, loading, error, list, assign, remove }
}
