<template>
  <div class="dashboard-layout">
    <!-- Sidebar Navigation -->
    <AdminSidebar @toggle="handleSidebarToggle" />

    <!-- Main Content Area -->
    <div class="dashboard-content" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <!-- Header -->
      <header class="dashboard-header no-bg">
        <div class="header-content">
          <div class="header-left">
            <slot name="header">
              <h1 class="dashboard-title">
                <font-awesome-icon :icon="['fas', 'tachometer-alt']" class="dashboard-svg-icon" />
                Dashboard Overview
              </h1>
            </slot>
          </div>
          <div class="header-right">
            <SearchComponent />
            <!-- AppContextMenu will be replaced with a modal trigger icon -->
            <button class="app-menu-trigger" @click="showAppMenu = true">
              <font-awesome-icon :icon="['fas', 'th-large']" />
            </button>
            <AppContextMenu v-if="showAppMenu" :visible="true" />
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
const showAppMenu = ref(false)
import AdminSidebar from '../components/AdminSidebar.vue'
import AppContextMenu from '../components/AppContextMenu.vue'
import SearchComponent from '../components/SearchComponent.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const sidebarCollapsed = ref(false)
function handleSidebarToggle(collapsed) {
  sidebarCollapsed.value = collapsed
}
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  background: #181e2a;
}
.dashboard-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.dashboard-header {
  color: #e2e8f0;
  padding: 1.5rem 2rem 1rem 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  border-bottom: 1px solid #1a2233;
  background: transparent;
  box-shadow: none;
}
.dashboard-header.no-bg {
  background: transparent;
  box-shadow: none;
}
.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}
.header-left {
  display: flex;
  align-items: center;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.dashboard-title {
  font-size: 2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.dashboard-svg-icon {
  font-size: 2rem;
  color: #90caf9;
}
.dashboard-main {
  flex: 1;
  padding: 2rem 0;
  background: #181e2a;
  min-height: 0;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: stretch;
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
