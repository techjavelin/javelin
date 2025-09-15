<template>
  <div
    class="dashboard-layout pulse-bg"
    :class="{
      'admin-mode': isAdminRoute,
      'admin-collapsed': isAdminRoute && sidebarCollapsed,
      'generic-mode': !isAdminRoute,
      'generic-collapsed': !isAdminRoute && genericCollapsed
    }"
  >
    <!-- Sidebar: Admin or generic -->
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
        <SidebarLink to="/pentester/engagements"><template #icon><font-awesome-icon :icon="['fas','briefcase']" /></template>Engagements</SidebarLink>
        <SidebarLink to="/pentester/vuln-library"><template #icon><font-awesome-icon :icon="['fas','bug']" /></template>Vuln Library</SidebarLink>
        <SidebarLink to="/pentester/findings/new"><template #icon><font-awesome-icon :icon="['fas','plus-circle']" /></template>New Finding</SidebarLink>
      </SidebarCollapsible>
      <SidebarCollapsible title="Account" :defaultOpen="false">
        <SidebarLink to="/profile"><template #icon><font-awesome-icon :icon="['fas','user']" /></template>Profile</SidebarLink>
      </SidebarCollapsible>
      <template #footer>
        <UserFooterPanel :userName="userName" :userEmail="userEmail" roleLabel="User" :compact="false">
          <template #menu>
            <UserContextMenu :visible="userMenuVisible" />
          </template>
        </UserFooterPanel>
        <div class="footer-actions">
          <button @click="exitToHome" class="sidebar-exit">Home</button>
          <button @click="onLogout" class="sidebar-logout">Logout</button>
        </div>
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

<script setup lang="ts">
import { ref, computed, inject, watch } from 'vue'
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
const userMenuVisible = ref(false)
function toggleUserMenu(){ userMenuVisible.value = !userMenuVisible.value }

// Eagerly load user if not present
loadCurrentUser?.().catch(()=>{})

function onLogout() {
  // TODO: Hook up to actual logout logic
  alert('Logout clicked')
}

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
  padding-left: var(--generic-sidebar-width, 280px);
}
/* Generic collapsed */
.dashboard-layout.generic-mode.generic-collapsed { padding-left: var(--generic-sidebar-collapsed-width, 80px); }

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
.sidebar-exit {
  background:#374151;
  color:#e5e7eb;
  border:none;
  padding:.5rem .75rem;
  border-radius:6px;
  font-size:.7rem;
  cursor:pointer;
  margin-right:.5rem;
}
.sidebar-exit:hover { background:#4b5563; }
.sidebar-logout { background:#b91c1c; color:#fff; border:none; padding:.5rem .75rem; border-radius:6px; font-size:.7rem; cursor:pointer; }
.sidebar-logout:hover { background:#dc2626; }
.footer-user { display:flex; align-items:center; gap:.75rem; padding:.5rem .5rem; border-radius:8px; cursor:pointer; position:relative; transition:background .2s; }
.footer-user:hover { background:rgba(255,255,255,0.08); }
.footer-user .user-avatar { width:40px; height:40px; background:linear-gradient(135deg,#2563eb,#3b82f6); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.8rem; font-weight:600; color:#fff; }
.footer-user .user-meta { flex:1; min-width:0; }
.footer-user .user-name { font-size:.85rem; font-weight:500; color:#e2e8f0; }
.footer-user .user-email { font-size:.65rem; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.footer-actions { display:flex; gap:.5rem; margin-top:.5rem; }
</style>
