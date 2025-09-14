import type { App, DirectiveBinding } from 'vue'
import router from '../router'
import { useEntitlements } from '../composables/useEntitlements'

export function installEntitlements(app: App) {
  // Route guard
  router.beforeEach(async (to) => {
    const metaFeature = to.meta?.feature as string | undefined
    if (!metaFeature) return true
    const { load, has, loaded } = useEntitlements()
    if (!loaded.value) await load()
    if (!has(metaFeature)) {
      // Redirect or show upgrade route if defined
      return { name: 'AdminDashboard' } // fallback; adjust to dedicated upgrade page
    }
    return true
  })

  // v-feature directive
  app.directive('feature', {
    mounted(el: HTMLElement, binding: DirectiveBinding) {
      process(el, binding)
    },
    updated(el: HTMLElement, binding: DirectiveBinding) {
      process(el, binding)
    }
  })
}

function process(el: HTMLElement, binding: DirectiveBinding) {
  const featureKey = binding.value as string
  if (!featureKey) return
  const { has } = useEntitlements()
  if (!has(featureKey)) {
    el.style.display = 'none'
  } else {
    el.style.display = ''
  }
}
