import { ref } from 'vue'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '@/../amplify/data/resource'
import { useAuthorization } from './useAuthorization'

const client = generateClient<Schema>()

export function useArtifacts() {
  const artifacts = ref<Schema['ArtifactLink']['type'][]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const { has } = useAuthorization()

  async function listByEngagement(engagementId: string, params: { status?: string; limit?: number; nextToken?: string } = {}) {
    loading.value = true; error.value = null
    try {
      const filter: any = { engagementId: { eq: engagementId } }
      if (params.status) filter.status = { eq: params.status }
      const resp = await client.models.ArtifactLink.list({ filter, limit: params.limit, nextToken: params.nextToken })
      artifacts.value = resp.data || []
      return { nextToken: resp.nextToken }
    } catch (e: any) {
      error.value = e.message || 'Failed to load artifacts'
      return { nextToken: undefined }
    } finally { loading.value = false }
  }

  async function create(input: Omit<Schema['ArtifactLink']['type'],'id'|'createdAt'|'updatedAt'> & { engagementId: string; organizationId: string; provider: any; externalId: string; name: string }) {
    if (!has('ENG.MANAGE', { engagementId: input.engagementId })) throw new Error('Forbidden: ENG.MANAGE required')
    loading.value = true; error.value = null
    try {
      const resp = await client.models.ArtifactLink.create({ ...input })
      return resp.data || null
    } catch (e: any) {
      error.value = e.message || 'Failed to create artifact'
      throw e
    } finally { loading.value = false }
  }

  async function update(id: string, engagementId: string, patch: Partial<Schema['ArtifactLink']['type']>) {
    if (!has('ENG.MANAGE', { engagementId })) throw new Error('Forbidden: ENG.MANAGE required')
    loading.value = true; error.value = null
    try {
      const resp = await client.models.ArtifactLink.update({ id, ...patch })
      return resp.data || null
    } catch (e: any) {
      error.value = e.message || 'Failed to update artifact'
      throw e
    } finally { loading.value = false }
  }

  // Backward-compatible generic list alias expected by dashboard pages
  async function list(params: { engagementId?: string; provider?: string; limit?: number; nextToken?: string } = {}) {
    if (params.engagementId) return listByEngagement(params.engagementId, params)
    loading.value = true; error.value = null
    try {
      const filter: any = {}
      if (params.provider) filter.provider = { eq: params.provider }
      const resp = await client.models.ArtifactLink.list({ filter: Object.keys(filter).length ? filter : undefined, limit: params.limit, nextToken: params.nextToken })
      artifacts.value = resp.data || []
      return { nextToken: resp.nextToken }
    } catch (e: any) {
      error.value = e.message || 'Failed to load artifacts'
      return { nextToken: undefined }
    } finally { loading.value = false }
  }

  return { artifacts, loading, error, listByEngagement, list, create, update }
}
