<template>
  <div class="user-context-menu" v-if="visible">
    <ul>
      <li>
        <router-link to="/profile">Profile</router-link>
      </li>
      <li>
        <router-link to="/preferences">Preferences</router-link>
      </li>
      <li>
        <a @click="logout">Logout</a>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'

const props = defineProps({
  visible: Boolean
})

const { logout } = useAuth()
</script>

<style scoped>
.user-context-menu {
  position: absolute;
  left: 16px;
  bottom: 80px;
  background: #23293a;
  color: #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.15);
  padding: 1rem;
  z-index: 2000;
}
.user-context-menu ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.user-context-menu li {
  margin-bottom: 0.5rem;
}
.user-context-menu li:last-child {
  margin-bottom: 0;
}
</style>
