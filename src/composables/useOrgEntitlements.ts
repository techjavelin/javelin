import { ref } from 'vue'
import { getClient, withUserAuth } from '../amplifyClient'
import type { Schema } from '../../amplify/data/resource'
import { useApi } from './useApi'

export interface UpdateEntitlementInput {
  organizationId: string
  entitlementPlanId: string
  addFeatures?: string[]
  removeFeatures?: string[]
}

export function useOrgEntitlements() {
  const client = getClient()
  const { withErrorToast } = useApi()
  const current = ref<Schema['OrganizationEntitlement']['type'] | null>(null)
  const loading = ref(false)
  const updating = ref(false)
  const error = ref<string | null>(null)

  async function load(organizationId: string, force = false) {
    if (!organizationId) return
    if (loading.value) return
    if (!force && current.value?.organizationId === organizationId) return
    loading.value = true
    error.value = null
    try {
      const res = await withErrorToast('Load Org Entitlement', () => client.models.OrganizationEntitlement.list({
        filter: { organizationId: { eq: organizationId }, status: { eq: 'ACTIVE' } },
        limit: 1,
  ...withUserAuth()
      }))
      current.value = (res as any).data?.[0] || null
    } catch (e: any) {
      error.value = e.message || 'Failed loading organization entitlement'
    } finally {
      loading.value = false
    }
  }

  async function switchPlan(input: { organizationId: string; entitlementPlanId: string }) {
    if (updating.value) return
    updating.value = true
    error.value = null
    try {
      // For now create a new ACTIVE record and (optionally) mark old as EXPIRED (not implemented yet)
      const created = await withErrorToast('Switch Plan', () => client.models.OrganizationEntitlement.create({
        organizationId: input.organizationId,
        entitlementPlanId: input.entitlementPlanId,
        status: 'ACTIVE',
        effectiveFrom: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
  }, withUserAuth()))
      current.value = (created as any).data || current.value
    } catch (e: any) {
      error.value = e.message || 'Failed switching plan'
    } finally {
      updating.value = false
    }
  }

  async function applyOverrides(input: { organizationId: string; add?: string[]; remove?: string[] }) {
    if (!current.value || current.value.organizationId !== input.organizationId) return
    if (updating.value) return
    updating.value = true
    error.value = null
    try {
      const mergedAdd = Array.from(new Set([...(current.value.overrides_addFeatures || []), ...(input.add || [])]))
      const mergedRemove = Array.from(new Set([...(current.value.overrides_removeFeatures || []), ...(input.remove || [])]))
      const updated = await withErrorToast('Update Overrides', () => client.models.OrganizationEntitlement.update({
        id: current.value!.id,
        overrides_addFeatures: mergedAdd,
        overrides_removeFeatures: mergedRemove,
        updatedAt: new Date().toISOString()
  }, withUserAuth()))
      current.value = (updated as any).data || current.value
    } catch (e: any) {
      error.value = e.message || 'Failed updating overrides'
    } finally {
      updating.value = false
    }
  }

  return { current, loading, updating, error, load, switchPlan, applyOverrides }
}
