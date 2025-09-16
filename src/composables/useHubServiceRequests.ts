import { ref, computed } from 'vue'
import { generateClient } from 'aws-amplify/data'
import { withAuth } from '@/amplifyClient'
import type { Schema } from '../../amplify/data/resource'
import { useAuth } from '@/composables/useAuth'

export interface CreateServiceRequestInput { organizationId: string; title: string; details?: string; type: Schema['ServiceRequestType']['type']; priority?: number }

export function useHubServiceRequests(){
  const client = generateClient<Schema>()
  const { userEmail, userName, loadCurrentUser } = useAuth()
  loadCurrentUser?.().catch(()=>{})
  const requester = computed(()=> userEmail?.value || userName?.value || 'unknown-user')
  const requests = ref<Schema['ServiceRequest']['type'][]>([])
  const loading = ref(false)
  const error = ref<string|null>(null)
  const creating = ref(false)

  async function listByOrg(orgId: string | null | undefined){
    if (!orgId){ requests.value = []; return }
    loading.value = true; error.value = null
    try {
      const { data } = await client.models.ServiceRequest.list(withAuth({ filter: { organizationId: { eq: orgId } } }))
      requests.value = (data||[]).filter(Boolean) as any
    } catch (e:any){ error.value = e.message || 'Failed to load requests' }
    finally { loading.value = false }
  }

  async function create(input: CreateServiceRequestInput){
    creating.value = true
    try {
      const { data, errors } = await client.models.ServiceRequest.create(withAuth({
        organizationId: input.organizationId,
        requestedBy: requester.value,
        status: 'OPEN',
        title: input.title.trim(),
        details: input.details?.trim() || '',
        type: input.type,
        priority: input.priority
      }))
      if (errors?.length) throw new Error(errors.map(e=>e.message).join('; '))
      if (data) requests.value.unshift(data as any)
      return data
    } finally { creating.value = false }
  }

  async function updateStatus(id: string, status: Schema['ServiceRequestStatus']['type'], resolutionNotes?: string){
    try {
      const { data, errors } = await client.models.ServiceRequest.update(withAuth({ id, status, resolutionNotes }))
      if (errors?.length) throw new Error(errors.map(e=>e.message).join('; '))
  const idx = requests.value.findIndex((r:any)=>r.id===id)
      if (idx>=0 && data) requests.value[idx] = data as any
      return data
    } catch (e){ throw e }
  }

  function reset(){ requests.value = [] }

  return { requests, loading, error, listByOrg, reset, create, creating, updateStatus }
}
export type UseHubServiceRequestsReturn = ReturnType<typeof useHubServiceRequests>
