<template>
  <aside class="sigint-sidebar" :class="{ 'collapsed': isCollapsed }">
    <div class="sidebar-header">
      <div class="logo-wrapper" :class="{ compact: isCollapsed }">
        <div class="sidebar-logo" v-if="!isCollapsed">
          <h2><font-awesome-icon :icon="['fas','satellite-dish']" class="sidebar-logo-svg" /> SigInt</h2>
        </div>
        <div class="sidebar-logo-compact" v-else>
          <span><font-awesome-icon :icon="['fas','satellite-dish']" class="sidebar-logo-svg" /></span>
        </div>
      </div>
      <button
        @click="toggleSidebar"
        class="sidebar-toggle"
        :title="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        aria-label="Toggle sidebar"
      >
        <font-awesome-icon :icon="isCollapsed ? 'chevron-right' : 'chevron-left'" />
      </button>
    </div>
    <nav class="sidebar-nav">
      <ul class="nav-menu">
        <li class="nav-item" v-if="canViewOrganizations">
          <router-link to="/sigint" class="nav-link" :class="{ active: $route.path === '/sigint' }">
            <span class="nav-icon"><font-awesome-icon :icon="['fas','building']" class="sidebar-png-icon" /></span>
            <span class="nav-text" v-if="!isCollapsed">Organizations</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/pulse" class="nav-link">
            <span class="nav-icon"><font-awesome-icon :icon="['fas','rocket']" class="sidebar-png-icon" /></span>
            <span class="nav-text" v-if="!isCollapsed">Launchpad</span>
          </router-link>
        </li>
      </ul>
    </nav>
    <div class="sidebar-footer">
      <UserFooterPanel :userName="userName" :userEmail="''" roleLabel="SigInt User" :compact="isCollapsed">
        <template #menu>
          <UserContextMenu :visible="userMenuVisible" />
        </template>
      </UserFooterPanel>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import UserContextMenu from './UserContextMenu.vue'
import UserFooterPanel from './UserFooterPanel.vue'
import { getCurrentUser } from 'aws-amplify/auth'

const isCollapsed = ref(false)
const currentUser = ref<any>(null)
const userGroups = ref<string[]>([])
const userMenuVisible = ref(false)

function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem('sigintSidebarCollapsed', String(isCollapsed.value))
}

onMounted(async () => {
  // restore persisted state
  const saved = localStorage.getItem('sigintSidebarCollapsed')
  if (saved !== null) isCollapsed.value = saved === 'true'
  try {
    currentUser.value = await getCurrentUser()
    const payload = (currentUser.value as any)?.signInDetails?.tokenPayload || {}
    let groups = payload['cognito:groups'] || payload['groups'] || []
    if (typeof groups === 'string') groups = [groups]
    userGroups.value = Array.isArray(groups) ? groups : []
  } catch { /* ignore */ }
})

const userName = computed(() => {
  if (!currentUser.value) return 'User'
  return currentUser.value.signInDetails?.loginId?.split('@')[0] || 'User'
})
const userInitials = computed(() => userName.value.split(/\s+/).map((w: string) => w[0]).join('').slice(0,2).toUpperCase())
const canViewOrganizations = computed(() => userGroups.value.includes('admin') || userGroups.value.includes('pulse-sigint'))
</script>

<style scoped>
.sigint-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 280px;
  background: linear-gradient(180deg, #1a1f36 0%, #2d3748 100%);
  color: white;
  transition: width 0.3s ease;
  z-index: 950;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.15);
}
.sigint-sidebar.collapsed { width: 80px; }
.sidebar-header { padding: 1rem 0.75rem 0.75rem 0.75rem; border-bottom:1px solid rgba(255,255,255,0.1); margin-bottom:1rem; display:flex; align-items:center; justify-content:space-between; gap:.5rem; }
.logo-wrapper.compact h2 { display:none; }
.sidebar-logo h2 { margin:0; font-size:1.2rem; font-weight:600; color:#e2e8f0; display:flex; align-items:center; gap:.5rem; }
.sidebar-logo-compact { text-align:center; font-size:1.4rem; }
.sidebar-toggle { width:30px; height:30px; background:rgba(255,255,255,0.08); color:#e2e8f0; border:1px solid rgba(255,255,255,0.25); border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background .2s,color .2s,border-color .2s; }
.sidebar-toggle:hover { border-color:#60a5fa; color:#60a5fa; background:rgba(255,255,255,0.15); }
.sidebar-nav { flex:1; overflow-y:auto; padding:0 .5rem; }
.nav-menu { list-style:none; margin:0; padding:0; }
.nav-item { margin-bottom:.25rem; }
.nav-link { display:flex; align-items:center; gap:.75rem; padding:.75rem 1rem; color:#cbd5e1; text-decoration:none; border-radius:8px; transition:all .2s ease; font-size:.9rem; position:relative; }
.nav-link:hover { background:rgba(255,255,255,0.1); color:#fff; transform:translateX(4px); }
.nav-link.active { background:linear-gradient(135deg,#2563eb,#3b82f6); color:#fff; font-weight:500; }
.nav-icon { font-size:1.2rem; width:20px; text-align:center; flex-shrink:0; }
.nav-text { white-space:nowrap; opacity:1; transition:opacity .3s ease; }
.collapsed .nav-text { opacity:0; }
.sidebar-footer { padding:1rem; border-top:1px solid rgba(255,255,255,0.1); }
.user-info, .user-info-compact { display:flex; align-items:center; gap:.75rem; cursor:pointer; position:relative; }
.user-avatar { width:40px; height:40px; background:linear-gradient(135deg,#2563eb,#3b82f6); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.8rem; font-weight:600; color:#fff; flex-shrink:0; }
.user-details { flex:1; min-width:0; }
.user-name { font-size:.9rem; font-weight:500; color:#e2e8f0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.user-role { font-size:.75rem; color:#94a3b8; }
/* Scrollbar */
.sidebar-nav::-webkit-scrollbar { width:4px; }
.sidebar-nav::-webkit-scrollbar-track { background:rgba(255,255,255,0.05); }
.sidebar-nav::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.2); border-radius:2px; }
.sidebar-nav::-webkit-scrollbar-thumb:hover { background:rgba(255,255,255,0.3); }
/* Dark theme override */
[data-theme="dark"] .sigint-sidebar { background:linear-gradient(180deg,#0f172a 0%, #1e293b 100%); }
[data-theme="dark"] .nav-link.active { background:linear-gradient(135deg,#1e40af,#2563eb); }
@media (max-width:768px) { .sigint-sidebar { transform:translateX(-100%); transition:transform .3s ease,width .3s ease; } .sigint-sidebar.collapsed { transform:translateX(0); width:80px; } }
</style>
