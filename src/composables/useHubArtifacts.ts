import { ref } from 'vue'
import { generateClient } from 'aws-amplify/data'
import { withAuth } from '@/amplifyClient'
import type { Schema } from '../../amplify/data/resource'
import { remove as removeObject } from 'aws-amplify/storage'

export function useHubArtifacts(){
  const client = generateClient<Schema>()
  const artifacts = ref<Schema['ArtifactLink']['type'][]>([])
  const loading = ref(false)
  const error = ref<string|null>(null)

  async function listByOrg(orgId: string | null | undefined){
    if (!orgId){ artifacts.value=[]; return }
    loading.value=true; error.value=null
    try {
      const { data } = await client.models.ArtifactLink.list(withAuth({ filter: { organizationId: { eq: orgId } } }))
      artifacts.value = (data||[]).filter(Boolean) as any
    } catch (e:any){ error.value = e.message || 'Failed to load artifacts' } finally { loading.value=false }
  }

  async function listByEngagement(engagementId: string){
    loading.value=true; error.value=null
    try {
      const { data } = await client.models.ArtifactLink.list(withAuth({ filter: { engagementId: { eq: engagementId } } }))
      artifacts.value = (data||[]).filter(Boolean) as any
    } catch (e:any){ error.value = e.message || 'Failed to load artifacts' } finally { loading.value=false }
  }

  async function remove(id: string){
    loading.value=true; error.value=null
    try {
      // Fetch first to get storageKey
      const current = artifacts.value.find(a => (a as any).id === id) as any
  if (current?.storageKey) { try { await removeObject({ key: current.storageKey }) } catch {/* ignore */} }
      await client.models.ArtifactLink.delete({ id } as any)
      artifacts.value = artifacts.value.filter(a => (a as any).id !== id)
    } catch (e:any){ error.value = e.message || 'Failed to delete artifact'; throw e } finally { loading.value=false }
  }

  function reset(){ artifacts.value = [] }

  return { artifacts, loading, error, listByOrg, listByEngagement, remove, reset }
}
export type UseHubArtifactsReturn = ReturnType<typeof useHubArtifacts>
