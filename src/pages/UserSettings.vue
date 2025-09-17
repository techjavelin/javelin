<script setup lang="ts">
import UserApiKeyManager from '../components/settings/UserApiKeyManager.vue';
</script>

<template>
  <div class="user-settings">
    <h2>User Settings</h2>
    <UserApiKeyManager />
  </div>
</template>

<style scoped>
.user-settings { max-width: 900px; margin: 0 auto; padding: 1rem; }
</style>
