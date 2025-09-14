import { ref } from 'vue'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import { withAuth } from '../amplifyClient'
import { normalizeError } from './useError'

const client = generateClient<Schema>()

export function useEngagementApplications() {
  const links = ref<Schema['ApplicationEngagement']['type'][]>([])
  const loading = ref(false)
  const error = ref('')

  async function listByEngagement(engagementId: string) {
    loading.value = true
    error.value = ''
    try {
      const res = await client.models.ApplicationEngagement.list(withAuth({}))
      links.value = (res.data || []).filter(l => l.engagementId === engagementId)
    } catch (e) {
      error.value = normalizeError(e,'Failed to load application links').message
    } finally { loading.value = false }
  }

  async function attach(engagementId: string, applicationIds: string[], organizationId: string) {
    for (const appId of applicationIds) {
      try {
        await client.models.ApplicationEngagement.create(withAuth({ applicationId: appId, engagementId, organizationId }))
      } catch (e) {
        error.value = normalizeError(e,'Failed to link application').message
      }
    }
    await listByEngagement(engagementId)
  }

  async function detach(linkId: string) {
    try {
      await client.models.ApplicationEngagement.delete(withAuth({ id: linkId }))
      links.value = links.value.filter(l => l.id !== linkId)
    } catch (e) {
      error.value = normalizeError(e,'Failed to unlink application').message
    }
  }

  return { links, loading, error, listByEngagement, attach, detach }
}
