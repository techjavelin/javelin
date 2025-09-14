import { ref } from 'vue'
import { getClient, withUserAuth } from '../amplifyClient'
import type { Schema } from '../../amplify/data/resource'
import { useApi } from './useApi'

export function useEntitlementCatalog() {
  const client = getClient()
  const { withErrorToast } = useApi()
  const products = ref<Schema['Product']['type'][]>([])
  const serviceLevels = ref<Schema['ServiceLevel']['type'][]>([])
  const features = ref<Schema['Feature']['type'][]>([])
  const plans = ref<Schema['EntitlementPlan']['type'][]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(force = false) {
    if (loading.value) return
    if (!force && products.value.length && serviceLevels.value.length && features.value.length && plans.value.length) return
    loading.value = true
    error.value = null
    try {
      const [prodRes, slRes, featRes, planRes] = await Promise.all([
        withErrorToast('Load Products', () => client.models.Product.list(withUserAuth({ limit: 100 }))),
        withErrorToast('Load Service Levels', () => client.models.ServiceLevel.list(withUserAuth({ limit: 100 }))),
        withErrorToast('Load Features', () => client.models.Feature.list(withUserAuth({ limit: 500 }))),
        withErrorToast('Load Plans', () => client.models.EntitlementPlan.list(withUserAuth({ limit: 200 })))
      ])
      products.value = (prodRes as any).data || []
      serviceLevels.value = (slRes as any).data || []
      features.value = (featRes as any).data || []
      plans.value = (planRes as any).data || []
    } catch (e: any) {
      error.value = e.message || 'Failed loading entitlement catalog'
    } finally {
      loading.value = false
    }
  }

  return { products, serviceLevels, features, plans, loading, error, load }
}
