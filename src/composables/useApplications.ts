import { ref } from 'vue'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import { withAuth } from '../amplifyClient'
import { normalizeError } from './useError'

const client = generateClient<Schema>()

export function useApplications() {
  const applications = ref<Schema['Application']['type'][]>([])
  const loading = ref(false)
  const error = ref('')

  async function list(params: { organizationId?: string } = {}) {
    loading.value = true
    error.value = ''
    try {
      const res = await client.models.Application.list(withAuth({}))
      let data = res.data || []
      if (params.organizationId) data = data.filter(a => a.organizationId === params.organizationId)
      applications.value = data
    } catch (e) {
      error.value = normalizeError(e,'Failed to load applications').message
    } finally {
      loading.value = false
    }
  }

  return { applications, loading, error, list }
}
