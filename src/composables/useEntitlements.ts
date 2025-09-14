import { ref, computed } from 'vue'
import { fetchAuthSession } from 'aws-amplify/auth'

interface EntitlementState {
  features: Set<string>
  serviceLevel?: string
  version?: string
  organizationId?: string
  planId?: string
  loaded: boolean
  loading: boolean
  error?: string
}

const state: EntitlementState = {
  features: new Set(),
  loaded: false,
  loading: false
}

const featuresRef = ref(state.features)
const loadingRef = ref(state.loading)
const loadedRef = ref(state.loaded)
const serviceLevelRef = ref<string | undefined>(state.serviceLevel)
const versionRef = ref<string | undefined>(state.version)
const orgRef = ref<string | undefined>(state.organizationId)
const planRef = ref<string | undefined>(state.planId)
const errorRef = ref<string | undefined>(state.error)

export function useEntitlements() {
  async function load(force = false) {
    if (loadingRef.value) return
    if (!force && loadedRef.value) return
    loadingRef.value = true
    errorRef.value = undefined
    try {
      const session = await fetchAuthSession()
      const idToken = (session.tokens as any)?.idToken
      const claims = idToken?.payload || {}
      const featureCsv = claims['ent_f'] as string | undefined
      const serviceLevel = claims['ent_sl'] as string | undefined
      const version = claims['ent_v'] as string | undefined
      const orgId = claims['ent_org'] as string | undefined
      const planId = claims['ent_plan'] as string | undefined
      const newSet = new Set<string>()
      if (featureCsv) {
        featureCsv.split(',').map(s => s.trim()).filter(Boolean).forEach(f => newSet.add(f))
      }
      featuresRef.value = newSet
      serviceLevelRef.value = serviceLevel
      versionRef.value = version
      orgRef.value = orgId
      planRef.value = planId
      loadedRef.value = true
    } catch (err: any) {
      errorRef.value = err.message || 'Failed to load entitlements'
    } finally {
      loadingRef.value = false
    }
  }

  function has(featureKey: string): boolean {
    return featuresRef.value.has(featureKey)
  }

  return {
    load,
    has,
    features: computed(() => [...featuresRef.value]),
    serviceLevel: serviceLevelRef,
    version: versionRef,
    organizationId: orgRef,
    planId: planRef,
    loaded: loadedRef,
    loading: loadingRef,
    error: errorRef
  }
}
