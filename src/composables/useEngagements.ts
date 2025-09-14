import { ref } from 'vue'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import { withAuth } from '../amplifyClient'
import { normalizeError } from './useError'

const client = generateClient<Schema>()

export function useEngagements() {
  const engagements = ref<Schema['Engagement']['type'][]>([])
  const currentEngagement = ref<Schema['Engagement']['type'] | null>(null)
  const loading = ref(false)
  const error = ref<string>('')

  async function list(params: { organizationId?: string; phase?: string; status?: string } = {}) {
    loading.value = true
    error.value = ''
    try {
      // Basic list then filter client-side; could be replaced with predicate query when supported
      const res = await client.models.Engagement.list(withAuth({}))
      let data = res.data || []
      if (params.organizationId) data = data.filter(e => e.organizationId === params.organizationId)
      if (params.phase) data = data.filter(e => e.phase === params.phase)
      if (params.status) data = data.filter(e => e.status === params.status)
      engagements.value = data
    } catch (e:any) {
      error.value = normalizeError(e, 'Failed to load engagements').message
    } finally {
      loading.value = false
    }
  }

  async function get(id: string) {
    loading.value = true
    error.value = ''
    try {
      const res = await client.models.Engagement.get(withAuth({ id }))
      currentEngagement.value = res.data ?? null
      return currentEngagement.value
    } catch (e:any) {
      error.value = normalizeError(e,'Failed to load engagement').message
      return null
    } finally {
      loading.value = false
    }
  }

  async function create(input: Partial<Schema['Engagement']['type']>) {
    try {
      const res = await client.models.Engagement.create(withAuth({
        code: input.code!,
        title: input.title!,
        organizationId: input.organizationId!,
        phase: input.phase || 'PLANNING',
        status: input.status || 'ACTIVE'
      }))
      if (res.data) engagements.value.push(res.data)
      return res.data
    } catch (e:any) {
      error.value = normalizeError(e,'Failed to create engagement').message
      return null
    }
  }

  async function update(id: string, patch: Partial<Schema['Engagement']['type']>) {
    try {
      const res = await client.models.Engagement.update(withAuth({ id, ...patch }))
      if (res.data) {
        const idx = engagements.value.findIndex(e => e.id === id)
        if (idx >= 0) engagements.value[idx] = res.data
      }
      return res.data
    } catch (e:any) {
      error.value = normalizeError(e,'Failed to update engagement').message
      return null
    }
  }

  async function remove(id: string) {
    try {
      await client.models.Engagement.delete(withAuth({ id }))
      engagements.value = engagements.value.filter(e => e.id !== id)
    } catch (e:any) {
      error.value = normalizeError(e,'Failed to delete engagement').message
    }
  }

  return { engagements, currentEngagement, loading, error, list, get, create, update, remove }
}
