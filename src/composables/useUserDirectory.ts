import { ref } from 'vue'
import { userManagementService, type User, getUserEmail } from '../services/userManagementService'

// Lightweight directory for mapping Cognito usernames -> emails (or display identifiers)
// Avoids repeated list calls; simple in-memory cache for session lifecycle.
const loaded = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const users = ref<User[]>([])
const emailById = ref<Record<string,string>>({})

async function load(force = false){
  if(loading.value) return
  if(loaded.value && !force) return
  loading.value = true
  error.value = null
  try {
    const { users: list } = await userManagementService.listUsers(1000)
    users.value = list
    const map: Record<string,string> = {}
    for(const u of list){
      map[u.username] = getUserEmail(u) || u.username
    }
    emailById.value = map
    loaded.value = true
  } catch(e:any){
    error.value = e.message || 'Failed to load users'
  } finally {
    loading.value = false
  }
}

function lookup(id: string | null | undefined): string {
  if(!id) return ''
  return emailById.value[id] || id
}

export function useUserDirectory(){
  return { load, lookup, users, emailById, loaded, loading, error }
}
