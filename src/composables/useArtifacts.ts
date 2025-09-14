import { ref } from 'vue'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import { withAuth } from '../amplifyClient'
import { normalizeError } from './useError'

const client = generateClient<Schema>()

export function useArtifacts() {
  const artifacts = ref<Schema['ArtifactLink']['type'][]>([])
  const loading = ref(false)
  const error = ref('')

  async function list(params: { engagementId?: string; provider?: string } = {}) {
    loading.value = true
    error.value = ''
    try {
      const res = await client.models.ArtifactLink.list(withAuth({}))
      let data = res.data || []
      if (params.engagementId) data = data.filter(a => a.engagementId === params.engagementId)
      if (params.provider) data = data.filter(a => a.provider === params.provider)
      artifacts.value = data
    } catch (e) {
      error.value = normalizeError(e,'Failed to load artifacts').message
    } finally {
      loading.value = false
    }
  }

  async function create(input: Partial<Schema['ArtifactLink']['type']>) {
    try {
      const res = await client.models.ArtifactLink.create(withAuth({
        provider: input.provider!,
        externalId: input.externalId || `ext_${Math.random().toString(36).slice(2,10)}`,
        name: input.name || 'Untitled Artifact',
        description: input.description,
        documentType: input.documentType,
        status: input.status,
        engagementId: input.engagementId,
        organizationId: input.organizationId,
        metadata: input.metadata || {}
      }))
      if (res.data) artifacts.value.push(res.data)
      return res.data
    } catch (e) {
      error.value = normalizeError(e,'Failed to create artifact').message
      return null
    }
  }

  async function update(id: string, patch: Partial<Schema['ArtifactLink']['type']>) {
    try {
      const res = await client.models.ArtifactLink.update(withAuth({ id, ...patch }))
      if (res.data) {
        const idx = artifacts.value.findIndex(a => a.id === id)
        if (idx >= 0) artifacts.value[idx] = res.data
      }
      return res.data
    } catch (e) {
      error.value = normalizeError(e,'Failed to update artifact').message
      return null
    }
  }

  async function remove(id: string) {
    try {
      await client.models.ArtifactLink.delete(withAuth({ id }))
      artifacts.value = artifacts.value.filter(a => a.id !== id)
    } catch (e) {
      error.value = normalizeError(e,'Failed to delete artifact').message
    }
  }

  return { artifacts, loading, error, list, create, update, remove }
}
