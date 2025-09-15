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

  async function list(params: { organizationId?: string; kind?: string; limit?: number; nextToken?: string } = {}) {
    loading.value = true
    error.value = ''
    try {
      const filter: any = {}
      if (params.organizationId) filter.organizationId = { eq: params.organizationId }
      if (params.kind) filter.kind = { eq: params.kind }
      const res = await client.models.Application.list(withAuth({ filter: Object.keys(filter).length ? filter : undefined, limit: params.limit, nextToken: params.nextToken }))
      applications.value = res.data || []
      return { nextToken: res.nextToken }
    } catch (e) {
      error.value = normalizeError(e,'Failed to load applications').message
      return { nextToken: undefined }
    } finally {
      loading.value = false
    }
  }

  return { applications, loading, error, list }
}
