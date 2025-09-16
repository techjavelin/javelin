import { ref } from 'vue'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import { withUserAuth } from '../amplifyClient'
import { normalizeError } from './useError'

// ApplicationType model does not expose public/apiKey write; ensure userPool auth explicitly.

const client = generateClient<Schema>()

export function useApplicationTypes(){
  const types = ref<Schema['ApplicationType']['type'][]>([])
  const loading = ref(false)
  const error = ref('')

  async function list(){
    loading.value = true; error.value=''
    try {
      const res = await client.models.ApplicationType.list(withUserAuth({}))
      types.value = res.data || []
    } catch(e:any){
      error.value = normalizeError(e,'Failed to load application types').message
    } finally { loading.value = false }
  }

  async function create(input: Partial<Schema['ApplicationType']['type']>){
    try {
      if(!input.key || !input.label) throw new Error('Key and label are required')
  const res = await client.models.ApplicationType.create({ key: input.key, label: input.label, description: input.description, rank: input.rank, active: input.active ?? true }, withUserAuth())
      if(res.data) types.value.push(res.data)
      return res.data
    } catch(e:any){
      error.value = normalizeError(e,'Failed to create application type').message
      return null
    }
  }

  async function update(id: string, patch: Partial<Schema['ApplicationType']['type']>){
    try {
  const res = await client.models.ApplicationType.update({ id, ...patch }, withUserAuth())
      if(res.data){
        const idx = types.value.findIndex(t=>t.id===id)
        if(idx>=0) types.value[idx] = res.data
      }
      return res.data
    } catch(e:any){
      error.value = normalizeError(e,'Failed to update application type').message
      return null
    }
  }

  async function remove(id: string){
    try {
  await client.models.ApplicationType.delete({ id }, withUserAuth())
      types.value = types.value.filter(t=>t.id!==id)
    } catch(e:any){
      error.value = normalizeError(e,'Failed to delete application type').message
    }
  }

  return { types, loading, error, list, create, update, remove }
}
