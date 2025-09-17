<template>
  <div
    class="dashboard-layout pulse-bg"
    :class="{
      'admin-mode': isAdminRoute,
      'admin-collapsed': isAdminRoute && sidebarCollapsed,
      'generic-mode': !isAdminRoute && !hasCustomSidebar,
      'generic-collapsed': !isAdminRoute && !hasCustomSidebar && genericCollapsed,
      'custom-sidebar': hasCustomSidebar
    }"
  >
    <!-- Custom sidebar slot (e.g., Hub) -->
    <template v-if="hasCustomSidebar">
      <slot name="sidebar" />
    </template>
    <!-- Fallback: Admin or generic app sidebar -->
    <template v-else>
      <AdminSidebar v-if="isAdminRoute" @toggle="handleAdminSidebarToggle" />
      <AppSidebar v-else :appName="appName" :collapsed="genericCollapsed" @toggle="handleGenericSidebarToggle">
      <template #header>
        <span class="app-title">{{ appName }}</span>
      </template>
      <!-- Single Launchpad link replacing previous Pulse Apps group -->
      <SidebarLink to="/pulse">
        <template #icon><font-awesome-icon :icon="['fas','rocket']" /></template>
        Launchpad
      </SidebarLink>
      <SidebarCollapsible v-if="showPentesterPortal" title="Pentester Portal" :defaultOpen="true">
        <SidebarLink to="/pentester"><template #icon><font-awesome-icon :icon="['fas','shield-halved']" /></template>Dashboard</SidebarLink>
        <SidebarLink to="/pentester/applications"><template #icon><font-awesome-icon :icon="['fas','boxes-stacked']" /></template>Applications</SidebarLink>
        <SidebarLink to="/pentester/engagements"><template #icon><font-awesome-icon :icon="['fas','briefcase']" /></template>Engagements</SidebarLink>
        <SidebarLink to="/pentester/vuln-library"><template #icon><font-awesome-icon :icon="['fas','bug']" /></template>Vuln Library</SidebarLink>
        <SidebarLink to="/pentester/findings/new"><template #icon><font-awesome-icon :icon="['fas','plus-circle']" /></template>New Finding</SidebarLink>
      </SidebarCollapsible>
      <SidebarCollapsible title="Account" :defaultOpen="false">
        <SidebarLink to="/profile"><template #icon><font-awesome-icon :icon="['fas','user']" /></template>Profile</SidebarLink>
      </SidebarCollapsible>
      <template #footer>
        <UserFooterPanel :userName="userName" :userEmail="userEmail" roleLabel="User" :compact="false">
          <template #menu="slotProps">
            <UserContextMenu :visible="slotProps.open" />
          </template>
        </UserFooterPanel>
      </template>
      </AppSidebar>
    </template>

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

<script setup lang="ts">
import { ref, computed, inject, watch, useSlots } from 'vue'
const slots = useSlots()
const hasCustomSidebar = computed(() => !!slots.sidebar)
import { useRoute, useRouter } from 'vue-router'
import ThemeSwitcher from '../components/ThemeSwitcher.vue'
import AppSidebar from '../components/nav/AppSidebar.vue'
import SidebarCollapsible from '../components/nav/SidebarCollapsible.vue'
import SidebarHeading from '../components/nav/SidebarHeading.vue'
import SidebarLink from '../components/nav/SidebarLink.vue'
import SidebarUserMenu from '../components/nav/SidebarUserMenu.vue'
import UserContextMenu from '../components/UserContextMenu.vue'
import UserFooterPanel from '../components/UserFooterPanel.vue'
import AdminSidebar from '../components/AdminSidebar.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useRoles } from '../composables/useRoles'
import { useAuth } from '../composables/useAuth'

const route = useRoute()
const router = useRouter()
const isAdminRoute = computed(() => route.path.startsWith('/admin'))

const sidebarCollapsed = ref(false)
const genericCollapsed = ref(false)
const appName = 'Javelin Pulse'
// Auth & roles
const { userName: authUserName, userEmail: authUserEmail, loadCurrentUser } = useAuth()
const { isPentester, isAdmin } = useRoles()
const showPentesterPortal = computed(() => isPentester.value || isAdmin.value)

// Derive safe fallbacks
const userName = computed(() => authUserName?.value || 'User')
const userEmail = computed(() => authUserEmail?.value || '')
const userInitials = computed(() => userName.value.split(/\s+/).map((p: string)=>p[0]).join('').slice(0,2).toUpperCase())

// Eagerly load user if not present
loadCurrentUser?.().catch(()=>{})

// Logout now handled inside UserContextMenu

function handleAdminSidebarToggle(val: boolean) { sidebarCollapsed.value = val }
function handleGenericSidebarToggle(val: boolean) { genericCollapsed.value = val }
watch(genericCollapsed,(v:boolean)=>{ document.body.classList.toggle('sidebar-collapsed', v) })

function exitToHome() {
  router.push('/')
}

// THEME: inject from root App.vue
const themeRef = inject<{ value: string } | null>('themeRef', null)
const toggleThemeFn = inject<(() => void) | null>('toggleThemeFn', null)
const setThemeFn = inject<((t: string) => void) | null>('setThemeFn', null)
const currentTheme = computed(() => (themeRef ? themeRef.value : 'light'))

function handleThemeToggle(nextTheme: string) {
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
  height: 100vh; /* fixed viewport height to avoid body scroll */
  background: var(--color-bg-light);
  width: 100%;
  overflow: hidden; /* contain scroll to content area */
  padding-left: var(--generic-sidebar-width, 260px);
  transition: padding-left 0.25s ease;
  box-sizing: border-box;
}
/* When using a custom sidebar slot (Hub), remove inherited padding and rely on slot component width */
.dashboard-layout.custom-sidebar { padding-left: 0; }
/* Hub custom sidebar content offset (sidebar fixed at 240px or 62px collapsed) */
.dashboard-layout.custom-sidebar > .dashboard-content { margin-left:240px; transition:margin-left .25s ease; }
.dashboard-layout.custom-sidebar .hub-sidebar.collapsed + .dashboard-content { margin-left:62px; }

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
.dashboard-layout:not(.admin-mode):not(.custom-sidebar) { padding-left: var(--generic-sidebar-width, 280px); }
/* Generic collapsed */
.dashboard-layout.generic-mode.generic-collapsed { padding-left: var(--generic-sidebar-collapsed-width, 80px); }

/* Content */
.dashboard-content {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  padding: 2rem 1.5rem 1.75rem 1.5rem;
  background: var(--color-bg-light);
  min-width: 0; /* prevent overflow from flex children */
  box-sizing: border-box;
  overflow: hidden; /* internal main handles scroll */
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
  overflow-y: auto;
  display: block;
  flex: 1 1 auto;
  min-height:0;
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
/* Removed footer action buttons & local popover styling (handled by UserContextMenu) */
</style>
