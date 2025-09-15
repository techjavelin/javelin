<script setup lang="ts">
import { computed } from 'vue'
import { useAuthorization } from '@/composables/useAuthorization'

// Capability type is wide string to avoid tight coupling with internal union; runtime function will validate.
interface Props { capability: string; ctx?: Record<string, any>; not?: boolean }
const props = defineProps<Props>()
const { has } = useAuthorization()
const allowed = computed(() => {
  const ok = has(props.capability as any, props.ctx || {})
  return props.not ? !ok : ok
})
</script>
<template>
  <slot v-if="allowed" />
</template>
