<template>
  <aside class="app-sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-header">
      <div class="logo-wrapper" :class="{ compact: isCollapsed }">
        <div class="sidebar-logo" v-if="!isCollapsed">
          <h2 class="logo-text"><slot name="header"><span class="app-title">{{ appName }}</span></slot></h2>
        </div>
        <div class="sidebar-logo-compact" v-else>
          <span class="compact-initials">{{ initials }}</span>
        </div>
      </div>
      <button
        @click="toggle"
        class="sidebar-toggle"
        :title="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        aria-label="Toggle sidebar"
      >
        <font-awesome-icon :icon="isCollapsed ? 'chevron-right' : 'chevron-left'" />
      </button>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-content">
        <slot />
      </div>
    </nav>
    <div class="sidebar-footer">
      <slot name="footer" />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
const props = defineProps<{ appName: string, collapsed?: boolean }>()
const emit = defineEmits<{ (e:'toggle', value:boolean):void }>()
const isCollapsed = ref(props.collapsed ?? false)
function toggle(){
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem('appSidebarCollapsed', String(isCollapsed.value))
  emit('toggle', isCollapsed.value)
}
watchEffect(()=>{
  const saved = localStorage.getItem('appSidebarCollapsed')
  if (saved !== null) { isCollapsed.value = saved === 'true'; emit('toggle', isCollapsed.value) }
})
const initials = computed(()=> props.appName.split(/\s+/).map(p=>p[0]).join('').slice(0,3).toUpperCase())
</script>

<style scoped>
  .app-sidebar { position:fixed; top:0; left:0; width:280px; background:linear-gradient(180deg,#1a1f36 0%, #2d3748 100%); color:#e2e8f0; display:flex; flex-direction:column; height:100vh; border-right:1px solid rgba(255,255,255,0.08); transition:width .25s ease; box-shadow:4px 0 12px rgba(0,0,0,0.15); z-index:900; }
  .app-sidebar.collapsed { width:80px; }
  .sidebar-header { display:flex; align-items:center; justify-content:space-between; padding:1rem .75rem .75rem .75rem; border-bottom:1px solid rgba(255,255,255,0.1); }
  .logo-text { font-size:1.05rem; letter-spacing:.5px; font-weight:600; margin:0; display:flex; align-items:center; gap:.5rem; color:#e2e8f0; }
  .sidebar-logo-compact { font-size:1rem; font-weight:600; letter-spacing:.05em; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.18); padding:.55rem .65rem; border-radius:8px; }
  .compact-initials { display:inline-block; }
  .sidebar-toggle { background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.25); color:#e2e8f0; width:32px; height:32px; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:.9rem; transition:background .2s,border .2s,color .2s; }
  .sidebar-toggle:hover { background:rgba(255,255,255,0.15); color:#fff; border-color:#60a5fa; }
  .sidebar-nav { flex:1; overflow-y:auto; padding:.5rem .5rem 1rem; }
  .nav-content { display:flex; flex-direction:column; gap:.5rem; }
  .sidebar-footer { padding: .75rem 1rem 1rem; border-top:1px solid rgba(255,255,255,0.1); }
  .app-sidebar::-webkit-scrollbar { width:4px; }
  .app-sidebar::-webkit-scrollbar-track { background:rgba(255,255,255,0.05); }
  .app-sidebar::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.2); border-radius:2px; }
  .app-sidebar::-webkit-scrollbar-thumb:hover { background:rgba(255,255,255,0.3); }
  .app-sidebar.collapsed .logo-text { display:none; }
  .app-sidebar.collapsed .sidebar-footer { padding:.5rem .25rem; }
  .app-sidebar.collapsed .sidebar-toggle { width:38px; }
  .app-title { white-space:nowrap; }
  [data-theme="dark"] .app-sidebar { background:linear-gradient(180deg,#0f172a 0%, #1e293b 100%); }
</style>
