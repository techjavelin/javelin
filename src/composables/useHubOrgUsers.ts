import { ref } from 'vue'
import { generateClient } from 'aws-amplify/data'
import { withAuth } from '@/amplifyClient'
import type { Schema } from '../../amplify/data/resource'

export function useHubOrgUsers(){
  const client = generateClient<Schema>()
  const memberships = ref<Schema['OrganizationMembership']['type'][]>([])
  const loading = ref(false)
  const error = ref<string|null>(null)

  async function listByOrg(orgId: string | null | undefined){
    if (!orgId){ memberships.value=[]; return }
    loading.value=true; error.value=null
    try {
      const { data } = await client.models.OrganizationMembership.list(withAuth({ filter: { organizationId: { eq: orgId } } }))
      memberships.value = (data||[]).filter(Boolean) as any
    } catch (e:any){ error.value = e.message || 'Failed to load users' } finally { loading.value=false }
  }

  return { memberships, loading, error, listByOrg }
}
export type UseHubOrgUsersReturn = ReturnType<typeof useHubOrgUsers>
