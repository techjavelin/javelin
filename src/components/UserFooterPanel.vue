<template>
  <div class="user-footer-panel" @click="toggle" :class="{ open: menuOpen }">
    <div class="ufp-avatar"><span>{{ initials }}</span></div>
    <div class="ufp-meta" v-if="!compact">
      <div class="ufp-name">{{ userName }}</div>
      <div class="ufp-email" v-if="userEmail">{{ userEmail }}</div>
      <div class="ufp-role" v-if="roleLabel">{{ roleLabel }}</div>
    </div>
    <slot name="menu" :open="menuOpen" :toggle="toggle" />
  </div>
</template>
<script setup lang="ts">
import { computed, defineProps, ref } from 'vue'
const props = defineProps<{ userName: string; userEmail?: string; roleLabel?: string; compact?: boolean }>()
const initials = computed(()=> props.userName.split(/\s+/).map((p:string)=>p[0]).join('').slice(0,2).toUpperCase())
const menuOpen = ref(false)
function toggle(){ menuOpen.value = !menuOpen.value }
</script>
<style scoped>
.user-footer-panel { display:flex; align-items:center; gap:.75rem; padding:.6rem .65rem; border-radius:8px; cursor:pointer; transition:background .2s; position:relative; }
.user-footer-panel:hover { background:rgba(255,255,255,0.08); }
.ufp-avatar { width:40px; height:40px; background:linear-gradient(135deg,#2563eb,#3b82f6); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.8rem; font-weight:600; color:#fff; }
.ufp-meta { flex:1; min-width:0; }
.ufp-name { font-size:.85rem; font-weight:500; color:#e2e8f0; }
.ufp-email { font-size:.65rem; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ufp-role { font-size:.6rem; color:#64748b; text-transform:uppercase; letter-spacing:.05em; margin-top:2px; }
</style>
