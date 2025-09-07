import { ref } from 'vue'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'

const client = generateClient<Schema>()

export function usePulseInviteSubmission() {
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
