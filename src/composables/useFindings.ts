import { ref } from 'vue'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import { useAuthorization } from './useAuthorization'

const client = generateClient<Schema>()

export function useFindings() {
  const findings = ref<Schema['VulnerabilityFinding']['type'][]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const { has } = useAuthorization()

  async function listByEngagement(engagementId: string) {
    loading.value = true; error.value = null
    try {
      const resp = await client.models.VulnerabilityFinding.list({ filter: { engagementId: { eq: engagementId } } })
      findings.value = resp.data || []
    } catch (e: any) {
      error.value = e.message || 'Failed to load findings'
    } finally { loading.value = false }
  }

  async function create(input: Omit<Schema['VulnerabilityFinding']['type'],'id'|'reportedAt'|'updatedAt'|'closedAt'> & { engagementId: string; applicationId: string; title: string; severity: any; status: any }) {
    if (!has('ENG.UPDATE_FINDING', { engagementId: input.engagementId })) throw new Error('Forbidden: ENG.UPDATE_FINDING required')
    loading.value = true; error.value = null
    try {
      const resp = await client.models.VulnerabilityFinding.create({ ...input })
      return resp.data || null
    } catch (e: any) {
      error.value = e.message || 'Failed to create finding'
      throw e
    } finally { loading.value = false }
  }

  async function update(id: string, engagementId: string, patch: Partial<Schema['VulnerabilityFinding']['type']>) {
    if (!has('ENG.UPDATE_FINDING', { engagementId })) throw new Error('Forbidden: ENG.UPDATE_FINDING required')
    loading.value = true; error.value = null
    try {
      const resp = await client.models.VulnerabilityFinding.update({ id, ...patch })
      return resp.data || null
    } catch (e: any) {
      error.value = e.message || 'Failed to update finding'
      throw e
    } finally { loading.value = false }
  }

  return { findings, loading, error, listByEngagement, create, update }
}
