<template>
  <div class="sidebar-user-menu">
    <div class="user-menu-trigger" @click="toggleMenu" tabindex="0">
      <slot name="avatar">
        <svg class="user-icon" viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
          <circle cx="12" cy="8" r="4" />
          <ellipse cx="12" cy="18" rx="8" ry="5" />
        </svg>
      </slot>
    </div>
    <transition name="fade">
      <div v-if="menuOpen" class="user-menu-popout" @click.stop>
        <div class="user-info">
          <div class="user-name">{{ userName }}</div>
          <div class="user-email">{{ userEmail }}</div>
        </div>
        <ul class="action-list">
          <li>
            <router-link to="/profile" class="action-link">
              <font-awesome-icon :icon="['fas','user']" class="act-ic" /> Profile
            </router-link>
          </li>
          <li>
            <router-link to="/preferences" class="action-link">
              <font-awesome-icon :icon="['fas','cog']" class="act-ic" /> Preferences
            </router-link>
          </li>
          <li>
            <a @click="exitHome" class="action-link">
              <font-awesome-icon :icon="['fas','arrow-left']" class="act-ic" /> Exit
            </a>
          </li>
          <li>
            <a @click="onLogout" class="action-link danger">
              <font-awesome-icon :icon="['fas','sign-out-alt']" class="act-ic" /> Logout
            </a>
          </li>
          <slot />
        </ul>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { defineProps, ref } from 'vue'
import { useRouter } from 'vue-router'
const props = defineProps<{ userName: string, userEmail: string }>()
const menuOpen = ref(false)
const router = useRouter()
function toggleMenu() { menuOpen.value = !menuOpen.value }
function onLogout() { window.dispatchEvent(new CustomEvent('sidebar-logout')) }
function exitHome(){ router.push('/') }
</script>

<style scoped>
  .sidebar-user-menu {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 1rem 0 0.5rem 0;
  }
  .user-menu-trigger {
    cursor: pointer;
    border-radius: 50%;
    background: var(--color-card-light);
    padding: 0.5rem;
    transition: background 0.15s;
  }
  .user-menu-trigger:focus, .user-menu-trigger:hover {
    background: var(--color-primary);
    color: #fff;
  }
  .user-icon {
    color: var(--color-text-light);
  }
  .user-menu-popout {
    position: absolute;
    left: 110%;
    bottom: 0;
    min-width: 180px;
    background: var(--color-bg-light);
    color: var(--color-text-light);
    border-radius: 8px;
    box-shadow: 0 2px 16px rgba(0,0,0,0.18);
    padding: 1rem;
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .user-info {
    font-size: 0.95rem;
    color: var(--color-text-light);
  }
  .user-name {
    font-weight: 600;
  }
  .action-list { list-style:none; margin:.4rem 0 0; padding:0; display:flex; flex-direction:column; gap:.25rem; }
  .action-link { display:flex; align-items:center; gap:.55rem; font-size:.8rem; padding:.45rem .55rem; border-radius:6px; color:#e2e8f0; text-decoration:none; background:#20263a; transition:background .15s,color .15s; }
  .action-link:hover { background:#2b3245; color:#fff; }
  .action-link.danger { background:#3b1f24; color:#fca5a5; }
  .action-link.danger:hover { background:#4c1d1d; color:#fff; }
  .act-ic { width:14px; }
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.2s;
  }
  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }
</style>
