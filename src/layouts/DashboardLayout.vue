<template>
  <div
    class="dashboard-layout pulse-bg"
    :class="{
      'admin-mode': isAdminRoute,
      'admin-collapsed': isAdminRoute && sidebarCollapsed
    }"
  >
    <!-- Sidebar: Admin or generic -->
    <AdminSidebar v-if="isAdminRoute" @toggle="handleAdminSidebarToggle" />
    <AppSidebar v-else :appName="appName">
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

    <!-- Content -->
    <div class="dashboard-content">
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
          <div class="header-right-group">
            <ThemeSwitcher :theme="currentTheme" @toggle-theme="handleThemeToggle" />
          </div>
        </div>
      </header>
      <main class="dashboard-main pulse-card">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useRoute } from 'vue-router'
import ThemeSwitcher from '../components/ThemeSwitcher.vue'
import AppSidebar from '../components/nav/AppSidebar.vue'
import SidebarCollapsible from '../components/nav/SidebarCollapsible.vue'
import SidebarHeading from '../components/nav/SidebarHeading.vue'
import SidebarLink from '../components/nav/SidebarLink.vue'
import SidebarUserMenu from '../components/nav/SidebarUserMenu.vue'
import AdminSidebar from '../components/AdminSidebar.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const route = useRoute()
const isAdminRoute = computed(() => route.path.startsWith('/admin'))

const sidebarCollapsed = ref(false)
const appName = 'Javelin Pulse'
const userName = 'User Name' // TODO: Replace with actual user name from auth
const userEmail = 'user@email.com' // TODO: Replace with actual user email from auth

function onLogout() {
  // TODO: Hook up to actual logout logic
  alert('Logout clicked')
}

function handleAdminSidebarToggle(val) {
  sidebarCollapsed.value = val
}

// THEME: inject from root App.vue
const themeRef = inject('themeRef', null)
const toggleThemeFn = inject('toggleThemeFn', null)
const setThemeFn = inject('setThemeFn', null)
const currentTheme = computed(() => (themeRef && 'value' in themeRef ? themeRef.value : 'light'))

function handleThemeToggle(nextTheme) {
  if (setThemeFn) {
    setThemeFn(nextTheme)
  } else if (toggleThemeFn) {
    toggleThemeFn()
  }
}
</script>

<style scoped>
/* Layout container */
.dashboard-layout {
  position: relative;
  display: flex;
  flex-direction: row;
  min-height: 100vh;
  background: var(--color-bg-light);
  width: 100%;
  overflow-x: hidden; /* guard against any accidental overflow */
  padding-left: var(--generic-sidebar-width, 260px); /* default for generic AppSidebar */
  transition: padding-left 0.25s ease;
  box-sizing: border-box;
}

/* Admin mode overrides (AdminSidebar is fixed @ 280px / 80px collapsed) */
.dashboard-layout.admin-mode {
  --admin-sidebar-expanded: 280px;
  --admin-sidebar-collapsed: 80px;
  padding-left: var(--admin-sidebar-expanded);
}
.dashboard-layout.admin-mode.admin-collapsed {
  padding-left: var(--admin-sidebar-collapsed);
}

/* When not admin mode, generic sidebar participates in normal flow (not fixed), so remove forced padding */
.dashboard-layout:not(.admin-mode) {
  padding-left: 0; /* generic AppSidebar width handled by its own flow if not fixed */
}

/* Content */
.dashboard-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 2rem 1.5rem 3rem 1.5rem;
  background: var(--color-bg-light);
  min-width: 0; /* prevent overflow from flex children */
  box-sizing: border-box;
}

.header-content {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: 10px;
  gap: 1rem;
  flex-wrap: wrap;
}
.header-left { display: flex; flex-direction: row; align-items: center; }
.header-right-group { display: flex; align-items: center; gap: 1rem; }

.dashboard-main {
  width: 100%;
  overflow-x: hidden;
  display: block;
}

/* Utility */
.app-menu-trigger {
  background: none;
  border: none;
  color: #90caf9;
  font-size: 1.5rem;
  cursor: pointer;
  margin-left: 0.5rem;
}

@media (max-width: 900px) {
  .dashboard-layout.admin-mode { padding-left: var(--admin-sidebar-collapsed); }
  .dashboard-layout.admin-mode.admin-collapsed { padding-left: var(--admin-sidebar-collapsed); }
  .dashboard-content { padding: 1.5rem 1rem 2.5rem 1rem; }
}
</style>
