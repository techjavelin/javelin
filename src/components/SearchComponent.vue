<template>
  <div class="search-component">
    <input type="text" v-model="query" placeholder="Search..." @keyup.enter="search" />
    <button @click="search">
      <font-awesome-icon :icon="'search'" />
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const query = ref('')
const search = () => {
  // Implement search logic or emit event
}
</script>

<style scoped>
.search-component {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.search-component input {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid #94a3b8;
  background: #23293a;
  color: #e2e8f0;
}
.search-component button {
  background: none;
  border: none;
  color: #e2e8f0;
  cursor: pointer;
  font-size: 1.1rem;
}
</style>
