import { ref, watch, computed } from 'vue'
import { useOrganizations } from './useOrganizations'

/**
 * Provides a reactive current organization context for Hub pages and other
 * client-facing areas. Persists selection to localStorage so a user returning
 * to the app keeps their previously selected org. Falls back to the first
 * available organization when none selected.
 */
export function useCurrentOrg() {
  const { organizations, fetchOrganizations, loading: orgsLoading, error: orgsError } = useOrganizations()

  const STORAGE_KEY = 'currentOrgId'
  const currentOrgId = ref<string | null>(null)

  // Initialize from storage
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) currentOrgId.value = stored
  } catch {}

  // Ensure organizations loaded (lazy trigger)
  if (!organizations.value.length && !orgsLoading.value) {
    fetchOrganizations().catch(()=>{})
  }

  // Auto-select first org if none chosen yet
  watch(organizations, (list) => {
    if (!currentOrgId.value && list.length > 0) {
      setCurrentOrg(list[0].id)
    }
  }, { immediate: true })

  const currentOrg = computed(() => organizations.value.find(o => o.id === currentOrgId.value) || null)

  function setCurrentOrg(id: string | null) {
    currentOrgId.value = id
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id)
      else localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }

  return { currentOrgId, currentOrg, setCurrentOrg, organizations, orgsLoading, orgsError }
}

export type UseCurrentOrgReturn = ReturnType<typeof useCurrentOrg>
