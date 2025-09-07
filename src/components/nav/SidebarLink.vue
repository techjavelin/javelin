<template>
  <router-link :to="to" class="sidebar-link" active-class="active">
    <slot name="icon" />
    <span class="link-label"><slot /></span>
  </router-link>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
const props = defineProps<{ to: string }>()
</script>

<style scoped>
.sidebar-link {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: #fff;
  text-decoration: none;
  border-radius: 6px;
  transition: background 0.15s;
  font-size: 1rem;
  margin-bottom: 2px;
}
.sidebar-link.active, .sidebar-link:hover {
  background: #232b44;
  color: #fff;
}
.link-label {
  margin-left: 0.75rem;
}
</style>
