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
        <div class="user-menu-actions">
          <slot />
          <a class="logout-link" @click="onLogout">Logout</a>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { defineProps, ref } from 'vue'
const props = defineProps<{ userName: string, userEmail: string }>()
const menuOpen = ref(false)
function toggleMenu() { menuOpen.value = !menuOpen.value }
function onLogout() {
  // Emit logout event for parent to handle
  window.dispatchEvent(new CustomEvent('sidebar-logout'))
}
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
  .user-menu-actions {
    margin-top: 0.5rem;
    width: 100%;
  }
  .logout-link {
    display: block;
    color: var(--color-primary);
    background: var(--color-card-light);
    border-radius: 4px;
    padding: 0.5rem 0.75rem;
    margin-top: 0.5rem;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s;
    text-decoration: none;
  }
  .logout-link:hover {
    background: var(--color-primary);
    color: #fff;
  }
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.2s;
  }
  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }
</style>
