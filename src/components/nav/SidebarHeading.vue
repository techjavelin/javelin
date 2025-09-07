<template>
  <div class="sidebar-heading">
    <slot />
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.sidebar-heading {
  font-size: 0.95rem;
  font-weight: 600;
  color: #8fa2c7;
  padding: 0.75rem 1rem 0.25rem 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}
</style>
