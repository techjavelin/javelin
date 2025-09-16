import { ref } from 'vue'
import { generateClient } from 'aws-amplify/data'
import { withAuth } from '@/amplifyClient'
import type { Schema } from '../../amplify/data/resource'

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

  async function create(input: Omit<Schema['ArtifactLink']['type'],'id'|'createdAt'|'updatedAt'|'lastSyncAt'> & { organizationId:string; engagementId?:string }){
    loading.value=true; error.value=null
    try {
      const resp = await client.models.ArtifactLink.create(withAuth({ ...input }))
      if (resp.data) artifacts.value = [resp.data as any, ...artifacts.value]
      return resp.data || null
    } catch (e:any){ error.value = e.message || 'Failed to create artifact'; throw e } finally { loading.value=false }
  }

  async function remove(id: string){
    loading.value=true; error.value=null
    try {
      await client.models.ArtifactLink.delete({ id } as any)
      artifacts.value = artifacts.value.filter(a => (a as any).id !== id)
    } catch (e:any){ error.value = e.message || 'Failed to delete artifact'; throw e } finally { loading.value=false }
  }

  function reset(){ artifacts.value = [] }

  return { artifacts, loading, error, listByOrg, listByEngagement, create, remove, reset }
}
export type UseHubArtifactsReturn = ReturnType<typeof useHubArtifacts>
