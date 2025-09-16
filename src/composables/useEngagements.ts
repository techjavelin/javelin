import { ref } from 'vue'
import { generateClient } from 'aws-amplify/data'
import { withAuth, withUserAuth } from '../amplifyClient'
import type { Schema } from '@/../amplify/data/resource'
import { useAuthorization } from './useAuthorization'

const client = generateClient<Schema>()

export interface UseEngagementsApi {
  // Canonical new API
  items: ReturnType<typeof ref<Schema['Engagement']['type'][]>>
  loading: ReturnType<typeof ref<boolean>>
  error: ReturnType<typeof ref<string | null>>
  list: (params?: { organizationId?: string; phase?: string; status?: string; limit?: number; nextToken?: string }) => Promise<{ nextToken?: string | null }>
  get: (id: string) => Promise<Schema['Engagement']['type'] | null>
  updateState: (id: string, data: Partial<Pick<Schema['Engagement']['type'],'phase'|'status'>>) => Promise<Schema['Engagement']['type'] | null>
  updateMeta: (id: string, data: Partial<Pick<Schema['Engagement']['type'],'title'|'code'|'startDate'|'endDate'|'actualStart'|'actualEnd'|'contacts'>>) => Promise<Schema['Engagement']['type'] | null>
  updateDetails: (id: string, data: Partial<Pick<Schema['Engagement']['type'],'executiveSummary'|'scopeNotes'|'constraints'|'exceptions'>>) => Promise<Schema['Engagement']['type'] | null>
  primeContext: (ctx: any) => Promise<void>
  // Backward-compat (legacy pages expect these)
  engagements: ReturnType<typeof ref<Schema['Engagement']['type'][]>>
  create: (input: Partial<Schema['Engagement']['type']>) => Promise<Schema['Engagement']['type'] | null>
}

export function useEngagements(): UseEngagementsApi {
  const items = ref<Schema['Engagement']['type'][]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const { has, primeContext } = useAuthorization()

  async function list(params: { organizationId?: string; phase?: string; status?: string; limit?: number; nextToken?: string } = {}) {
    loading.value = true; error.value = null
    try {
      const filter: any = {}
      if (params.organizationId) filter.organizationId = { eq: params.organizationId }
      if (params.phase) filter.phase = { eq: params.phase }
      if (params.status) filter.status = { eq: params.status }
  const resp = await client.models.Engagement.list(withAuth({ filter: Object.keys(filter).length ? filter : undefined, limit: params.limit, nextToken: params.nextToken }))
      items.value = resp.data || []
      return { nextToken: resp.nextToken }
    } catch (e: any) {
      error.value = e.message || 'Failed to list engagements'
      return { nextToken: undefined }
    } finally { loading.value = false }
  }

  async function get(id: string) {
    loading.value = true; error.value = null
    try {
  // Bypass deep conditional type instantiation: cast models to any
  const anyClient: any = client
  const resp = await (anyClient.models.Engagement.get({ id }, withAuth()))
  return resp?.data || null
    } catch (e: any) {
      error.value = e.message || 'Failed to load engagement'
      return null
    } finally { loading.value = false }
  }

  async function updateState(id: string, data: Partial<Pick<Schema['Engagement']['type'],'phase'|'status'>>) {
    if (!has('ENG.MANAGE', { engagementId: id })) throw new Error('Forbidden: ENG.MANAGE required')
    loading.value = true; error.value = null
    try {
  const resp = await client.models.Engagement.update({ id, ...data }, withUserAuth())
      return resp.data || null
    } catch (e: any) {
      error.value = e.message || 'Failed to update engagement'
      throw e
    } finally { loading.value = false }
  }

  async function updateMeta(id: string, data: Partial<Pick<Schema['Engagement']['type'],'title'|'code'|'startDate'|'endDate'|'actualStart'|'actualEnd'|'contacts'>>) {
    if (!has('ENG.MANAGE', { engagementId: id })) throw new Error('Forbidden: ENG.MANAGE required')
    loading.value = true; error.value = null
    try {
      const resp = await client.models.Engagement.update({ id, ...data }, withUserAuth())
      const updated = resp.data || null
      if (updated) {
        const idx = items.value.findIndex(e => e.id === id)
        if (idx >= 0) items.value[idx] = { ...items.value[idx], ...updated }
      }
      return updated
    } catch (e: any) {
      error.value = e.message || 'Failed to update engagement metadata'
      throw e
    } finally { loading.value = false }
  }

  async function updateDetails(id: string, data: Partial<Pick<Schema['Engagement']['type'],'executiveSummary'|'scopeNotes'|'constraints'|'exceptions'>>) {
    if (!has('ENG.MANAGE', { engagementId: id })) throw new Error('Forbidden: ENG.MANAGE required')
    loading.value = true; error.value = null
    try {
      const resp = await client.models.Engagement.update({ id, ...data }, withUserAuth())
      // sync local cache item if present
      const updated = resp.data || null
      if (updated) {
        const idx = items.value.findIndex(e => e.id === id)
        if (idx >= 0) items.value[idx] = { ...items.value[idx], ...updated }
      }
      return updated
    } catch (e: any) {
      error.value = e.message || 'Failed to update engagement details'
      throw e
    } finally { loading.value = false }
  }

  // Backward-compatible create (minimal) with capability check. Extend later for applications linking etc.
  async function create(input: Partial<Schema['Engagement']['type']>) {
    loading.value = true; error.value = null
    try {
      if (!has('ENG.MANAGE', { organizationId: (input as any).organizationId })) throw new Error('Forbidden: ENG.MANAGE required')
      const base: any = {
        title: input.title || 'Untitled Engagement',
        code: input.code || `ENG-${Date.now()}`,
        organizationId: (input as any).organizationId,
        phase: (input as any).phase || 'PLANNING',
        status: (input as any).status || 'ACTIVE'
      }
  const resp = await client.models.Engagement.create(base, withUserAuth())
      if (resp.data) items.value.push(resp.data)
      return resp.data || null
    } catch (e: any) {
      error.value = e.message || 'Failed to create engagement'
      return null
    } finally { loading.value = false }
  }

  // Expose legacy alias 'engagements'
  const engagements = items

  return { items, engagements, loading, error, list, get, updateState, updateMeta, updateDetails, primeContext, create }
}
