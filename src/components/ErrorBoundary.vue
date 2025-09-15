<script lang="ts" setup>
import { ref, onErrorCaptured } from 'vue';
import { useLogger } from '../composables/useLogger';
const props = defineProps<{ fallback?: string }>();
const error = ref<Error | null>(null);
const log = useLogger();
onErrorCaptured((err, instance, info) => {
  error.value = err as Error;
  log.error('vue-render-error', { message: err?.message, info });
  return false; // allow further propagation to global handler
});
</script>

<template>
  <div v-if="error" class="error-boundary">
    <p>{{ props.fallback || 'Something went wrong.' }}</p>
    <details style="white-space: pre-wrap;">
      <summary>Error details</summary>
      {{ error?.message }}
    </details>
  </div>
  <slot v-else />
</template>

<style scoped>
.error-boundary { padding: 1rem; border: 1px solid #e55; background:#fee; color:#900; border-radius:4px; }
</style>