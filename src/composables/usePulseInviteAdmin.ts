import { ref } from 'vue'
import type { Schema } from '../../amplify/data/resource'
import { getClient, withUserAuth } from '../amplifyClient'
import { useApi } from './useApi'

export function usePulseInviteAdmin() {
  const client = getClient()
  const submissions = ref<Schema['PulseInviteSubmission']['type'][]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const { withErrorToast } = useApi()

  async function fetchSubmissions() {
    loading.value = true; error.value = null
    try {
  const result = await withErrorToast('Load Submissions', () => client.models.PulseInviteSubmission.list(withUserAuth()))
      submissions.value = (result as any).data || []
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch submissions.'
    } finally { loading.value = false }
  }

  async function markInvited(id: string) {
  await withErrorToast('Mark Invited', () => client.models.PulseInviteSubmission.update({ id, status: 'invited', updatedAt: new Date().toISOString() }, withUserAuth()))
  }

  return { submissions, loading, error, fetchSubmissions, markInvited }
}
