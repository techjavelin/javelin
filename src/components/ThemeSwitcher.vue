<template>
  <div class="theme-switcher">
    <n-switch :value="theme === 'dark'" @update:value="onThemeSwitch">
      <template #checked>
        <font-awesome-icon icon="moon" />
      </template>
      <template #unchecked>
        <font-awesome-icon icon="sun" />
      </template>
    </n-switch>
  </div>
</template>

<script setup>
import { NSwitch } from 'naive-ui'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
// defineProps / defineEmits are compiler macros; no import needed

const props = defineProps({
  theme: {
    type: String,
    default: 'light'
  }
})
const emit = defineEmits(['toggle-theme'])

function onThemeSwitch(val) {
  emit('toggle-theme', val ? 'dark' : 'light')
}
</script>

<style scoped>
.theme-switcher {
  display: flex;
  align-items: center;
  margin-left: 1rem;
}
.theme-switcher :deep(.fa) {
  font-size: 1.2rem;
  margin: 0 0.2rem;
  vertical-align: middle;
}
</style>
