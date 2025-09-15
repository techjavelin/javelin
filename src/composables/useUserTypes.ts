import { ref } from 'vue'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import { withUserAuth } from '../amplifyClient'
import { normalizeError } from './useError'

const client = generateClient<Schema>()

export function useUserTypes(){
  const types = ref<Schema['UserType']['type'][]>([])
  const loading = ref(false)
  const error = ref('')

  async function list(){
    loading.value = true; error.value=''
    try {
      const res = await client.models.UserType.list(withUserAuth({}))
      types.value = res.data || []
    } catch(e:any){
      error.value = normalizeError(e,'Failed to load user types').message
    } finally { loading.value = false }
  }

  async function create(input: Partial<Schema['UserType']['type']>){
    try {
      if(!input.key || !input.label) throw new Error('Key and label are required')
      const res = await client.models.UserType.create(withUserAuth({ key: input.key, label: input.label, description: input.description, rank: input.rank, active: input.active ?? true }))
      if(res.data) types.value.push(res.data)
      return res.data
    } catch(e:any){
      error.value = normalizeError(e,'Failed to create user type').message
      return null
    }
  }

  async function update(id: string, patch: Partial<Schema['UserType']['type']>){
    try {
      const res = await client.models.UserType.update(withUserAuth({ id, ...patch }))
      if(res.data){
        const idx = types.value.findIndex(t=>t.id===id)
        if(idx>=0) types.value[idx] = res.data
      }
      return res.data
    } catch(e:any){
      error.value = normalizeError(e,'Failed to update user type').message
      return null
    }
  }

  async function remove(id: string){
    try {
      await client.models.UserType.delete(withUserAuth({ id }))
      types.value = types.value.filter(t=>t.id!==id)
    } catch(e:any){
      error.value = normalizeError(e,'Failed to delete user type').message
    }
  }

  return { types, loading, error, list, create, update, remove }
}
