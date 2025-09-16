import { ref } from 'vue'
import { generateClient } from 'aws-amplify/data'
import { withAuth } from '../amplifyClient'
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
  const resp = await client.models.VulnerabilityFinding.list(withAuth({ filter: { engagementId: { eq: engagementId } } }))
      findings.value = resp.data || []
    } catch (e: any) {
      error.value = e.message || 'Failed to load findings'
    } finally { loading.value = false }
  }

  async function create(input: Omit<Schema['VulnerabilityFinding']['type'],'id'|'reportedAt'|'updatedAt'|'closedAt'> & { engagementId: string; applicationId: string; title: string; severity: any; status: any; publicationStatus?: any }) {
    if (!has('ENG.UPDATE_FINDING', { engagementId: input.engagementId })) throw new Error('Forbidden: ENG.UPDATE_FINDING required')
    error.value = null
    const tempId = `temp-${Date.now()}`
    const draft: any = { id: tempId, reportedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), closedAt: null, ...input, publicationStatus: input.publicationStatus || 'DRAFT' }
    findings.value = [draft, ...findings.value]
    try {
      const { publicationStatus, ...rest } = (input as any)
      const resp = await client.models.VulnerabilityFinding.create({ ...rest, publicationStatus: publicationStatus || 'DRAFT' })
      if (resp.data) {
        // replace temp with real
        const idx = findings.value.findIndex(f => f.id === tempId)
        if (idx >= 0) findings.value[idx] = resp.data as any
      }
      return resp.data || draft
    } catch (e: any) {
      // rollback
      findings.value = findings.value.filter(f => f.id !== tempId)
      error.value = e.message || 'Failed to create finding'
      throw e
    }
  }

  async function update(id: string, engagementId: string, patch: Partial<Schema['VulnerabilityFinding']['type']>) {
    if (!has('ENG.UPDATE_FINDING', { engagementId })) throw new Error('Forbidden: ENG.UPDATE_FINDING required')
    error.value = null
    const idx = findings.value.findIndex(f => f.id === id)
    const prev = idx >= 0 ? { ...findings.value[idx] } : null
    if (idx >= 0) findings.value[idx] = { ...findings.value[idx], ...patch, updatedAt: new Date().toISOString() } as any
    try {
      const resp = await client.models.VulnerabilityFinding.update({ id, ...patch })
      if (resp.data && idx >= 0) findings.value[idx] = resp.data as any
      return resp.data || null
    } catch (e: any) {
      if (prev && idx >= 0) findings.value[idx] = prev
      error.value = e.message || 'Failed to update finding'
      throw e
    }
  }

  return { findings, loading, error, listByEngagement, create, update }
}
