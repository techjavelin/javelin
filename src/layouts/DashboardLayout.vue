<template>
  <div class="dashboard-layout">
    <AdminSidebar @toggle="handleSidebarToggle" />
    <div class="dashboard-content" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <header class="dashboard-header no-bg">
    <div class="header-content" style="display: flex; flex-direction: row; padding-bottom: 10px;">
            <div class="header-left" style="display: flex; flex-direction: row;">
            <slot name="header">
              <h1 class="dashboard-title">
                <font-awesome-icon :icon="['fas', 'tachometer-alt']" class="dashboard-svg-icon" />
                Dashboard Overview
              </h1>
            </slot>
          </div>
          <div class="header-right-group" style="display: flex; align-items: center; gap: 1rem;">
            <ThemeSwitcher :theme="$root.theme" @toggle-theme="$root.toggleTheme" />
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="dashboard-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>

import { ref } from 'vue'
import ThemeSwitcher from '../components/ThemeSwitcher.vue'
import AdminSidebar from '../components/AdminSidebar.vue'

const showAppMenu = ref(false)
const sidebarCollapsed = ref(false)
function handleSidebarToggle(collapsed) {
  sidebarCollapsed.value = collapsed
}
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  flex-direction: row;
  min-height: 100vh;
  background: #181e2a;
}
.dashboard-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 2rem 0;
  background: #181e2a;
  min-height: 0;
  height: 100%;
  box-sizing: border-box;
  margin-left: 280px;
}
/* Collapsed sidebar adjustment */
.sidebar-collapsed.dashboard-content {
  margin-left: 80px;
}
.dashboard-main > * {
  width: 100%;
  max-width: 100vw;
}
.app-menu-trigger {
  background: none;
  border: none;
  color: #90caf9;
  font-size: 1.5rem;
  cursor: pointer;
  margin-left: 0.5rem;
}
</style>
