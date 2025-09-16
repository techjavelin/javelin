<template>
  <aside class="hub-sidebar" :class="{ collapsed }">
    <div class="top">
      <div class="brand" @click="$router.push('/hub')">
        <slot name="logo"><span class="logo-text">Pulse Hub</span></slot>
      </div>
      <button class="collapse-btn" @click="toggle" :title="collapsed ? 'Expand' : 'Collapse'">{{ collapsed ? '›' : '‹' }}</button>
    </div>
    <SidebarLaunchpadUserBlock :collapsed="collapsed" />
    <div class="section-heading" v-if="!collapsed">Hub Navigation</div>
    <nav class="nav">
      <RouterLink v-for="item in items" :key="item.to" :to="item.to" class="nav-item" :class="{ active: route.path === item.to }" :title="collapsed ? item.label : undefined">
        <span class="icon" v-if="item.icon">{{ item.icon }}</span>
        <span class="label" v-show="!collapsed">{{ item.label }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import SidebarLaunchpadUserBlock from '../SidebarLaunchpadUserBlock.vue'
import { useHubAuth } from '@/composables/useHubAuth'
import { useRoute } from 'vue-router'

interface NavItem { to: string; label: string; icon?: string; capability?: string }

const route = useRoute()
const collapsed = ref(false)

function toggle(){
  collapsed.value = !collapsed.value
  localStorage.setItem('hubSidebarCollapsed', collapsed.value ? '1':'0')
}

// Capability filtering placeholder (extend once useHubAuth is added)
const baseItems: NavItem[] = [
  { to: '/hub', label: 'Dashboard', icon: '📊' },
  { to: '/hub/engagements', label: 'Engagements', icon: '🛡️' },
  { to: '/hub/findings', label: 'Findings', icon: '⚡' },
  { to: '/hub/artifacts', label: 'Artifacts', icon: '📁' },
  { to: '/hub/requests', label: 'Requests', icon: '📝' },
  { to: '/hub/users', label: 'Users', icon: '👥', capability: 'HUB.MANAGE_ORG_USERS' },
  { to: '/hub/settings', label: 'Settings', icon: '⚙️' }
]
const { has } = useHubAuth()
const items = computed(()=> baseItems.filter(i => !i.capability || has(i.capability)))

if (localStorage.getItem('hubSidebarCollapsed')==='1') collapsed.value = true
</script>

<style scoped>
.hub-sidebar { width:240px; background:var(--color-sidebar,#0f172a); color:#cbd5e1; display:flex; flex-direction:column; border-right:1px solid rgba(255,255,255,0.05); transition:width .25s; position:sticky; top:0; height:100vh; overflow:hidden; }
.custom-sidebar & { position:fixed; left:0; top:0; height:100vh; z-index:140; }
.hub-sidebar.collapsed { width:62px; }
.top { display:flex; align-items:center; justify-content:space-between; padding:.75rem .75rem .5rem; }
.brand { font-weight:600; letter-spacing:.5px; cursor:pointer; font-size:.8rem; display:flex; align-items:center; gap:.4rem; }
.logo-text { white-space:nowrap; }
.collapse-btn { background:transparent; border:none; color:inherit; cursor:pointer; font-size:.9rem; opacity:.7; }
.collapse-btn:hover { opacity:1; }
.nav { display:flex; flex-direction:column; padding:.25rem .4rem 1rem; gap:.15rem; flex:1; overflow-y:auto; }
.nav-item { display:flex; align-items:center; gap:.65rem; padding:.55rem .65rem; font-size:.7rem; color:#94a3b8; text-decoration:none; border-radius:8px; font-weight:500; }
.nav-item.active, .nav-item:hover { background:rgba(255,255,255,0.06); color:#fff; }
.hub-sidebar.collapsed .label { display:none; }
.icon { width:1rem; text-align:center; }
.section-heading { font-size:0.55rem; text-transform:uppercase; letter-spacing:1px; font-weight:600; opacity:0.55; padding:0.25rem 0.95rem 0.35rem; }
</style>
