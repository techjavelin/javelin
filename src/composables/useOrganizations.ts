import { ref } from 'vue'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'

const client = generateClient<Schema>()

export function useOrganizations() {
  const organizations = ref<Schema['Organization']['type'][]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchOrganizations() {
    loading.value = true
    error.value = null
    try {
      const result = await client.models.Organization.list()
      organizations.value = result.data || []
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch organizations.'
    } finally {
      loading.value = false
    }
  }

  return {
    organizations,
    loading,
    error,
    fetchOrganizations
  }
}
