import { ref } from 'vue'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import { withAuth, withUserAuth } from '../amplifyClient'
import { normalizeError } from './useError'
import { useAuthorization } from './useAuthorization'
import { useApplicationService } from './useApplicationService'

const client = generateClient<Schema>()

export function useApplications() {
  const applications = ref<Schema['Application']['type'][]>([])
  const loading = ref(false)
  const error = ref('')
  const { has, primeContext } = useAuthorization()
  const service = useApplicationService()

  async function list(params: { organizationId?: string; applicationTypeKey?: string; limit?: number; nextToken?: string } = {}) {
    loading.value = true
    error.value = ''
    try {
      const filter: any = {}
      if (params.organizationId) filter.organizationId = { eq: params.organizationId }
      if (params.applicationTypeKey) filter.applicationTypeKey = { eq: params.applicationTypeKey }
  // Use explicit userPool auth for Application list because model authorization
  // requires either admin group or authenticated user; project default auth is apiKey.
  const res = await client.models.Application.list(withUserAuth({ filter: Object.keys(filter).length ? filter : undefined, limit: params.limit, nextToken: params.nextToken }))
      applications.value = res.data || []
      return { nextToken: res.nextToken }
    } catch (e) {
      error.value = normalizeError(e,'Failed to load applications').message
      return { nextToken: undefined }
    } finally {
      loading.value = false
    }
  }

  function canManageOrg(organizationId: string){
    return has('APP.MANAGE', { organizationId })
  }

  async function create(input: { organizationId: string; name: string; applicationTypeKey: string; userTypeKeys?: string[]; description?: string; repoUrl?: string; prodUrl?: string; dataSensitivity?: string }) {
    loading.value = true; error.value = ''
    try {
      await primeContext({ organizationId: input.organizationId })
      if(!has('APP.MANAGE', { organizationId: input.organizationId })) throw new Error('Forbidden: APP.MANAGE required')
  // Application model requires admin group for create; pass authMode as options, not inside input.
  // Previously we embedded authMode in the input object via withUserAuth({...input}) which caused
  // GraphQL error: field 'authMode' not defined on CreateApplicationInput.
  const resp = await client.models.Application.create({ ...input }, withUserAuth())
      if(resp.data) applications.value.push(resp.data)
      return resp.data || null
    } catch (e){
      error.value = normalizeError(e,'Failed to create application').message
      return null
    } finally { loading.value = false }
  }

  async function update(id: string, patch: Partial<Pick<Schema['Application']['type'],'description'|'repoUrl'|'prodUrl'|'tags'|'dataSensitivity'|'applicationTypeKey'|'userTypeKeys'>>) {
    loading.value = true; error.value = ''
    try {
      const updated = await service.updateApplication({ id, ...patch })
      if(updated.data){
        const idx = applications.value.findIndex(a=>a.id===id)
        if(idx>=0) applications.value[idx] = updated.data
        return updated.data
      }
      return null
    } catch (e){
      error.value = normalizeError(e,'Failed to update application').message
      throw e
    } finally { loading.value = false }
  }

  async function remove(id: string) {
    loading.value = true; error.value = ''
    try {
      await service.deleteApplication(id)
      const idx = applications.value.findIndex(a=>a.id===id)
      if(idx>=0) applications.value.splice(idx,1)
      return true
    } catch (e){
      error.value = normalizeError(e,'Failed to delete application').message
      return false
    } finally { loading.value = false }
  }

  return { applications, loading, error, list, create, update, remove, canManageOrg }
}
