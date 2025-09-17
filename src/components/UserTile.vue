<template>
  <div class="user-tile" :class="{ collapsed }" :title="collapsed ? userName : undefined">
    <div class="user-avatar" :style="avatarStyle">{{ initials }}</div>
    <div class="user-meta" v-if="!collapsed">
      <div class="user-name">{{ userName }}</div>
      <div class="user-email" v-if="userEmail">{{ userEmail }}</div>
      <div class="user-roles" v-if="roleTags.length">
        <span class="role-chip" v-for="r in roleTags" :key="r">{{ r }}</span>
      </div>
    </div>
    <div class="user-menu-trigger" @click.stop="toggleMenu" :class="{ open: menuOpen }">
      <font-awesome-icon :icon="['fas','ellipsis-vertical']" />
    </div>
    <transition name="fade">
      <div class="user-pop" v-if="menuOpen">
        <UserContextMenu :visible="menuOpen" @close="menuOpen=false" />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRoles } from '@/composables/useRoles'
import UserContextMenu from './UserContextMenu.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps<{ collapsed: boolean }>()

const { userName: rawName, userEmail: rawEmail, loadCurrentUser } = useAuth()
loadCurrentUser?.().catch(()=>{})
const { isAdmin, isPentester } = useRoles()

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
function toggleMenu(){ menuOpen.value = !menuOpen.value }

function handleDocClick(e: MouseEvent){
  const el = container.value
  if(!el) return
  if(menuOpen.value && !el.contains(e.target as Node)) menuOpen.value = false
}

const container = ref<HTMLElement | null>(null)

onMounted(()=> document.addEventListener('click', handleDocClick))
onBeforeUnmount(()=> document.removeEventListener('click', handleDocClick))
</script>

<style scoped>
.user-tile { position:relative; display:flex; align-items:center; gap:.75rem; padding:.6rem .7rem; border-top:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.04); }
.user-tile.collapsed { flex-direction:column; gap:.4rem; }
.user-avatar { width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.8rem; font-weight:600; color:#fff; box-shadow:0 0 0 2px rgba(255,255,255,0.15); }
.user-meta { display:flex; flex-direction:column; min-width:0; }
.user-name { font-size:.75rem; font-weight:600; line-height:1rem; }
.user-email { font-size:.6rem; opacity:.6; max-width:140px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.user-roles { display:flex; gap:4px; margin-top:4px; flex-wrap:wrap; }
.role-chip { background:#1e293b; color:#fff; padding:2px 6px; border-radius:8px; font-size:.5rem; font-weight:600; letter-spacing:.5px; }
.user-menu-trigger { margin-left:auto; cursor:pointer; padding:4px 6px; border-radius:6px; background:rgba(255,255,255,0.05); color:#cbd5e1; }
.user-menu-trigger:hover { background:rgba(255,255,255,0.12); color:#fff; }
.user-pop { position:absolute; right:0; bottom:calc(100% + 4px); background:var(--color-surface,#0f172a); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:.5rem; z-index:50; min-width:180px; box-shadow:0 6px 24px -4px rgba(0,0,0,0.5); }
.fade-enter-active, .fade-leave-active { transition:opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity:0; }
</style>
