<template>
  <div class="sidebar-collapsible">
    <div class="collapsible-header" @click="toggle">
      <slot name="icon" />
      <span class="collapsible-title">{{ title }}</span>
      <span class="collapsible-arrow">{{ open ? '▼' : '▶' }}</span>
    </div>
    <transition name="fade">
      <div v-show="open" class="collapsible-content">
        <slot />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps } from 'vue'
const props = defineProps<{ title: string, defaultOpen?: boolean }>()
const open = ref(props.defaultOpen ?? false)
function toggle() { open.value = !open.value }
</script>

<style scoped>
.sidebar-collapsible {
  margin-bottom: 0.5rem;
}
.collapsible-header {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0.75rem 1rem;
  font-weight: 500;
  background: #20263a;
  border-radius: 6px;
  user-select: none;
}
.collapsible-title {
  flex: 1;
  margin-left: 0.5rem;
}
.collapsible-arrow {
  margin-left: 0.5rem;
}
.collapsible-content {
  padding-left: 2rem;
  padding-top: 0.5rem;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
