<template>
  <div class="dashboard-layout pulse-bg">
    <AppSidebar :appName="appName">
      <template #header>
        <slot name="sidebar-header">
          <span class="app-title">{{ appName }}</span>
        </slot>
      </template>
      <SidebarCollapsible title="Pulse Apps" :defaultOpen="true">
        <SidebarLink to="/sigint">
          <template #icon>
            <font-awesome-icon :icon="['fas', 'eye']" />
          </template>
          SigInt
        </SidebarLink>
        <SidebarLink to="/pulse">
          <template #icon>
            <font-awesome-icon :icon="['fas', 'chart-line']" />
          </template>
          Pulse Platform
        </SidebarLink>
        <!-- Add more app links as needed -->
      </SidebarCollapsible>
      <SidebarHeading>Other</SidebarHeading>
      <SidebarLink to="/profile">
        <template #icon>
          <font-awesome-icon :icon="['fas', 'user']" />
        </template>
        Profile
      </SidebarLink>
      <template #footer>
        <SidebarUserMenu :userName="userName" :userEmail="userEmail">
          <button @click="onLogout" class="sidebar-logout">Logout</button>
        </SidebarUserMenu>
      </template>
    </AppSidebar>
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
  <main class="dashboard-main pulse-card">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ThemeSwitcher from '../components/ThemeSwitcher.vue'
import AppSidebar from '../components/nav/AppSidebar.vue'
import SidebarCollapsible from '../components/nav/SidebarCollapsible.vue'
import SidebarHeading from '../components/nav/SidebarHeading.vue'
import SidebarLink from '../components/nav/SidebarLink.vue'
import SidebarUserMenu from '../components/nav/SidebarUserMenu.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const sidebarCollapsed = ref(false)
const appName = 'Javelin Pulse'
const userName = 'User Name' // Replace with actual user name from auth
const userEmail = 'user@email.com' // Replace with actual user email from auth
function onLogout() {
  // TODO: Hook up to actual logout logic
  alert('Logout clicked')
}
</script>

<style scoped>
  .dashboard-layout {
    display: flex;
    flex-direction: row;
    min-height: 100vh;
    background: var(--color-bg-light);
  }
  .dashboard-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 2rem 0;
    background: var(--color-bg-light);
    min-height: 0;
    height: 100%;
    box-sizing: border-box;
    margin-left: var(--color-sidebar-width);
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
