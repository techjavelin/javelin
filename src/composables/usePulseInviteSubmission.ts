import { ref } from 'vue'
import type { Schema } from '../../amplify/data/resource'
import { getClient } from '../amplifyClient'

export function usePulseInviteSubmission() {
  const client = getClient()
  const loading = ref(false)
  const error = ref<string | null>(null)
  const success = ref(false)

  async function submitInvite({ email, organizationName, industry, reason }: {
    email: string
    organizationName: string
    industry: string
    reason: string
  }) {
    loading.value = true
    error.value = null
    success.value = false
    try {
      await client.models.PulseInviteSubmission.create({
        email,
        organizationName,
        industry,
        reason,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      success.value = true
    } catch (e: any) {
      error.value = e.message || 'Failed to submit invite request.'
    } finally {
      loading.value = false
    }
  }

  return { submitInvite, loading, error, success }
}
