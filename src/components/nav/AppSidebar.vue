<template>
  <nav class="app-sidebar" :class="{ collapsed }">
    <div class="sidebar-header">
      <slot name="header">
        <span class="app-title">{{ appName }}</span>
      </slot>
    </div>
    <div class="sidebar-menu">
      <slot />
    </div>
    <div class="sidebar-footer">
      <slot name="footer" />
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, defineProps } from 'vue'
const props = defineProps<{ appName: string, collapsed?: boolean }>()
const collapsed = ref(props.collapsed ?? true)
</script>

<style scoped>
  .app-sidebar {
    width: var(--color-sidebar-width);
    background: var(--color-card-light);
    color: var(--color-text-light);
    display: flex;
    flex-direction: column;
    height: 100vh;
    transition: width 0.2s;
  }
  .app-sidebar.collapsed {
    width: var(--color-sidebar-collapsed);
  }
.sidebar-header {
  padding: 1.5rem 1rem 1rem 1rem;
  font-size: 1.3rem;
  font-weight: bold;
  letter-spacing: 1px;
  text-align: left;
}
.sidebar-menu {
  flex: 1;
  overflow-y: auto;
}
.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid #222;
}
.app-title {
  white-space: nowrap;
}
</style>
