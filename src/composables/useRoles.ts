import { computed } from 'vue'
import { useAuth } from './useAuth'

// Centralized role utilities so router & components share logic
export function useRoles() {
  const { userGroups, currentUser } = useAuth()

  const roles = computed(() => userGroups.value)
  const isAdmin = computed(() => roles.value.includes('admin'))
  const isPentester = computed(() => roles.value.includes('pentester') || isAdmin.value)

  function hasRole(role: string) {
    return roles.value.includes(role)
  }

  return { roles, isAdmin, isPentester, hasRole, currentUser }
}
