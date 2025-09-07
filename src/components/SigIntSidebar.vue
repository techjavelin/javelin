<template>
  <aside class="sigint-sidebar" :class="{ 'collapsed': isCollapsed }">
    <button @click="toggleSidebar" class="sidebar-toggle" :title="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'">
      <svg v-if="isCollapsed" width="20" height="20" viewBox="0 0 20 20"><path d="M7 5l5 5-5 5" stroke="#2563eb" stroke-width="2" fill="none"/></svg>
      <svg v-else width="20" height="20" viewBox="0 0 20 20"><path d="M13 5l-5 5 5 5" stroke="#2563eb" stroke-width="2" fill="none"/></svg>
    </button>
    <div class="sidebar-header">
      <h2 v-if="!isCollapsed"><svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#2563eb"/><path d="M12 6v6l4 2" stroke="#fff" stroke-width="2" fill="none"/></svg> SigInt</h2>
      <span v-else><svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#2563eb"/><path d="M12 6v6l4 2" stroke="#fff" stroke-width="2" fill="none"/></svg></span>
    </div>
    <nav class="sidebar-nav">
      <ul class="nav-menu">
        <li class="nav-item">
          <a class="nav-link" :class="{ active: $route.path === '/sigint' }" @click.prevent="$router.push('/sigint')">
            <span class="nav-icon"><svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="#60a5fa"/></svg></span>
            <span class="nav-text" v-if="!isCollapsed">Organizations</span>
          </a>
        </li>
        <!-- Add more SigInt-specific nav items here -->
      </ul>
    </nav>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
const isCollapsed = ref(false)
function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value
}
</script>

<style scoped>
.sigint-sidebar {
  width: 260px;
  background: #1e293b;
  color: #fff;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  transition: width 0.2s;
  z-index: 10;
}
.sigint-sidebar.collapsed {
  width: 64px;
}
.sidebar-toggle {
  background: none;
  border: none;
  color: #2563eb;
  font-size: 1.5rem;
  margin: 1rem 0 0.5rem 0.5rem;
  cursor: pointer;
  align-self: flex-start;
}
.sidebar-header {
  padding: 1rem 1rem 0.5rem 1rem;
  font-size: 1.2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
}
.nav-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}
.nav-item {
  margin-bottom: 0.5rem;
}
.nav-link {
  display: flex;
  align-items: center;
  color: #fff;
  text-decoration: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  transition: background 0.15s;
  cursor: pointer;
}
.nav-link.active, .nav-link:hover {
  background: #2563eb;
  color: #fff;
}
.nav-icon {
  margin-right: 1rem;
  display: flex;
  align-items: center;
  min-width: 20px;
}
.nav-text {
  font-size: 1rem;
}
</style>
