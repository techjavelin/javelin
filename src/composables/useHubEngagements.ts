import { ref } from 'vue'
import { generateClient } from 'aws-amplify/data'
import { withAuth } from '@/amplifyClient'
import type { Schema } from '../../amplify/data/resource'

// Lists engagements for a specific organization (required). Consumer must supply
// orgId explicitly; we do not infer to avoid accidental cross-org exposure.
export function useHubEngagements(){
  const client = generateClient<Schema>()
  const engagements = ref<Schema['Engagement']['type'][]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function listByOrg(orgId: string | null | undefined){
    if (!orgId) { engagements.value = []; return }
    loading.value = true
    error.value = null
    try {
  const { data } = await client.models.Engagement.list(withAuth({ filter: { organizationId: { eq: orgId } } }))
      engagements.value = (data || []).filter(e => !!e) as any
    } catch (e:any){ error.value = e.message || 'Failed to load engagements' }
    finally { loading.value = false }
  }

  function reset(){ engagements.value = [] }

  return { engagements, loading, error, listByOrg, reset }
}
export type UseHubEngagementsReturn = ReturnType<typeof useHubEngagements>
