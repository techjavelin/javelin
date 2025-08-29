<template>
  <nav class="app-context-menu" v-if="visible">
    <ul>
      <li>
        <font-awesome-icon :icon="['fas', 'home']" class="menu-icon" />
        <router-link to="/">Homepage</router-link>
      </li>
      <li v-if="isAdmin">
        <font-awesome-icon :icon="['fas', 'cogs']" class="menu-icon" />
        <router-link to="/admin">Admin Panel</router-link>
      </li>
      <!-- Add new app links here as apps are added -->
    </ul>
  </nav>
</template>

<script setup>
const props = defineProps({
  visible: Boolean
})

import { useAuth } from '../composables/useAuth'
const { isAdmin } = useAuth()
</script>

<style scoped>
.app-context-menu {
  background: transparent;
  color: #e2e8f0;
  padding: 0;
  position: static;
}
.app-context-menu ul {
  display: flex;
  gap: 1.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
.app-context-menu li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0;
}
.menu-icon {
  font-size: 1.2rem;
  color: #90caf9;
}
</style>
