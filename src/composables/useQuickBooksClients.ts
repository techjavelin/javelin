import { ref } from 'vue'
import { buildAdminApiPath } from '@/utils/apiBase'
import { buildAuthHeaders } from '@/utils/authHeaders'

export interface QuickBooksClientMatch {
  id: string
  name: string
  companyName?: string
  email?: string
}

export function useQuickBooksClients(){
  const loading = ref(false)
  const error = ref<string|null>(null)
  const results = ref<QuickBooksClientMatch[]>([])
  const lastQuery = ref('')
  const controller = ref<AbortController | null>(null)

  async function search(query: string, opts?: { defaultName?: string }){
    const q = query.trim()
    lastQuery.value = q
    if(!q){ results.value = []; return }
    loading.value = true
    error.value = null
    controller.value?.abort()
    const ac = new AbortController()
    controller.value = ac
    try {
      // Placeholder: expecting an admin API endpoint /quickbooks/clients?query=...
      const url = buildAdminApiPath(`/quickbooks/clients?query=${encodeURIComponent(q)}`)
      const headers = await buildAuthHeaders({ 'Accept':'application/json' })
      const resp = await fetch(url, { headers, signal: ac.signal })
      if(!resp.ok) throw new Error(`QuickBooks search failed (${resp.status})`)
      let data: any = []
      try { data = await resp.json() } catch {}
      // Normalize expected shape
      results.value = (Array.isArray(data) ? data : []).map((c:any) => ({
        id: c.id || c.Id || c.ID || c.value || c.CustomerRef || 'unknown',
        name: c.displayName || c.DisplayName || c.name || c.CompanyName || 'Unnamed',
        companyName: c.CompanyName || c.companyName || c.displayName,
        email: c.PrimaryEmailAddr?.Address || c.email
      }))
    } catch (e:any){
      if (e.name === 'AbortError') return
      error.value = e.message || 'Search failed'
    } finally {
      if(controller.value === ac) controller.value = null
      loading.value = false
    }
  }

  return { loading, error, results, search, lastQuery }
}
