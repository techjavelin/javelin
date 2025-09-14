import { ref } from 'vue'
import type { Schema } from '../../amplify/data/resource'
import { getClient } from '../amplifyClient'

export function usePulseInviteAdmin() {
  const client = getClient()
  const submissions = ref<Schema['PulseInviteSubmission']['type'][]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSubmissions() {
    loading.value = true
    error.value = null
    try {
      const result = await client.models.PulseInviteSubmission.list()
      submissions.value = result.data || []
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch submissions.'
    } finally {
      loading.value = false
    }
  }

  async function markInvited(id: string) {
    // Set status to 'invited'
    await client.models.PulseInviteSubmission.update({ id, status: 'invited', updatedAt: new Date().toISOString() })
  }

  return { submissions, loading, error, fetchSubmissions, markInvited }
}
