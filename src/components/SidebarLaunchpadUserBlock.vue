<template>
  <div class="launchpad-user-block" :class="{ collapsed }">
    <div class="lp-section">
      <div class="lp-heading" v-if="!collapsed">Launchpad</div>
      <nav class="lp-links">
        <RouterLink v-for="item in filteredItems" :key="item.to" :to="item.to" class="lp-link" :title="collapsed ? item.label : undefined">
          <font-awesome-icon :icon="item.icon" class="lp-icon" />
          <span v-if="!collapsed" class="lp-label">{{ item.label }}</span>
          <span v-if="!collapsed && item.badge" class="lp-badge">{{ item.badge }}</span>
        </RouterLink>
      </nav>
    </div>
    <div class="user-section" :title="collapsed ? userName : undefined">
      <div class="user-avatar" :style="avatarStyle">{{ initials }}</div>
      <div class="user-meta" v-if="!collapsed">
        <div class="user-name">{{ userName }}</div>
        <div class="user-email">{{ userEmail }}</div>
        <div class="user-roles" v-if="roleTags.length">
          <span class="role-chip" v-for="r in roleTags" :key="r">{{ r }}</span>
        </div>
      </div>
      <div class="user-menu-trigger" @click="toggleMenu" :class="{ open: menuOpen }">
        <font-awesome-icon :icon="['fas','ellipsis-vertical']" />
      </div>
      <transition name="fade">
        <div class="user-pop" v-if="menuOpen">
          <UserContextMenu :visible="menuOpen" @close="menuOpen=false" />
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useRoles } from '../composables/useRoles'
import UserContextMenu from './UserContextMenu.vue'
import { useRouter } from 'vue-router'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

interface LaunchItem { to: string; label: string; icon: [string,string]; requires?: 'admin' | 'pentester'; badge?: string }

const props = defineProps<{ collapsed: boolean }>()

const { userName: rawName, userEmail: rawEmail, loadCurrentUser } = useAuth()
loadCurrentUser?.().catch(()=>{})
const { isAdmin, isPentester } = useRoles()

const items: LaunchItem[] = [
  { to: '/pulse', label: 'Home', icon: ['fas','rocket'] },
  { to: '/admin', label: 'Admin', icon: ['fas','gauge-high'], requires: 'admin' },
  { to: '/hub', label: 'Client Hub', icon: ['fas','people-group'] },
  { to: '/pentester', label: 'Pentester', icon: ['fas','shield-halved'], requires: 'pentester' }
]

const filteredItems = computed(() => items.filter(i => {
  if(i.requires === 'admin' && !isAdmin.value) return false
  if(i.requires === 'pentester' && !(isPentester.value || isAdmin.value)) return false
  return true
}))

const userName = computed(() => rawName?.value || 'User')
const userEmail = computed(() => rawEmail?.value || '')
const initials = computed(() => userName.value.split(/\s+/).map((p: string)=>p[0]||'').join('').slice(0,2).toUpperCase())

const roleTags = computed(() => {
  const tags: string[] = []
  if(isAdmin.value) tags.push('Admin')
  else if(isPentester.value) tags.push('Pentester')
  return tags
})

const colors = ['#6366F1','#0EA5E9','#10B981','#F59E0B','#EC4899']
const colorIndex = computed(() => (userName.value.charCodeAt(0) + userName.value.length) % colors.length)
const avatarStyle = computed(() => ({ background: colors[colorIndex.value] }))

const menuOpen = ref(false)
function toggleMenu() { menuOpen.value = !menuOpen.value }

// click outside
const blockRef = ref<HTMLElement | null>(null)
if(typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    if(!blockRef.value) return
    if(menuOpen.value && !blockRef.value.contains(e.target as Node)) menuOpen.value = false
  })
}
</script>

<style scoped>
.launchpad-user-block { display:flex; flex-direction:column; gap:1rem; padding:0.75rem 0.75rem 1rem; }
.launchpad-user-block.collapsed { padding:0.75rem 0.25rem; }
.lp-heading { font-size:0.65rem; text-transform:uppercase; letter-spacing:1px; font-weight:600; opacity:0.6; margin:0 0 0.35rem 0; }
.lp-links { display:flex; flex-direction:column; gap:2px; }
.lp-link { display:flex; align-items:center; gap:0.75rem; padding:0.55rem 0.6rem; font-size:0.85rem; font-weight:500; border-radius:6px; color:var(--color-text, #eee); text-decoration:none; position:relative; }
.lp-link:hover { background:rgba(255,255,255,0.08); }
.lp-icon { width:18px; font-size:14px; opacity:0.9; }
.lp-label { flex:1; }
.lp-badge { background:#334155; padding:2px 6px; font-size:0.65rem; border-radius:10px; letter-spacing:0.5px; }
.user-section { position:relative; display:flex; align-items:center; gap:0.75rem; padding:0.65rem 0.6rem; border-radius:8px; background:rgba(255,255,255,0.05); cursor:default; }
.launchpad-user-block.collapsed .user-section { flex-direction:column; gap:0.25rem; }
.user-avatar { width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.85rem; font-weight:600; color:#fff; box-shadow:0 0 0 2px rgba(255,255,255,0.15); }
.user-meta { display:flex; flex-direction:column; min-width:0; }
.user-name { font-size:0.8rem; font-weight:600; line-height:1.1rem; }
.user-email { font-size:0.65rem; opacity:0.65; line-height:1rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:140px; }
.role-chip { background:#1e293b; color:#fff; padding:2px 6px; border-radius:8px; font-size:0.55rem; font-weight:600; letter-spacing:0.5px; }
.user-roles { display:flex; flex-wrap:wrap; gap:4px; margin-top:4px; }
.user-menu-trigger { margin-left:auto; cursor:pointer; padding:4px 6px; border-radius:6px; background:rgba(255,255,255,0.05); color:#cbd5e1; }
.user-menu-trigger:hover { background:rgba(255,255,255,0.12); color:#fff; }
.user-pop { position:absolute; right:0; bottom:calc(100% + 4px); background:var(--color-surface,#0f172a); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:0.5rem; z-index:40; min-width:180px; box-shadow:0 6px 24px -4px rgba(0,0,0,0.5); }
.fade-enter-active, .fade-leave-active { transition:opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity:0; }
</style>
