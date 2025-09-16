import { ref } from 'vue'
import { generateClient } from 'aws-amplify/data'
import { withAuth } from '@/amplifyClient'
import type { Schema } from '../../amplify/data/resource'

export function usePublishedFindings(){
  const client = generateClient<Schema>()
  const findings = ref<Schema['VulnerabilityFinding']['type'][]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function listByEngagement(engagementId: string){
    loading.value = true
    error.value = null
    try {
  const { data } = await client.models.VulnerabilityFinding.list(withAuth({ filter: { engagementId: { eq: engagementId }, publicationStatus: { eq: 'PUBLISHED' } } }))
      findings.value = (data || []).filter(f => !!f) as any
    } catch (e:any){ error.value = e.message || 'Failed to load findings' }
    finally { loading.value = false }
  }

  return { findings, loading, error, listByEngagement }
}
export type UsePublishedFindingsReturn = ReturnType<typeof usePublishedFindings>
