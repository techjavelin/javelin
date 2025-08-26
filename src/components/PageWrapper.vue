<template>
  <div class="page-wrapper">
    <slot></slot>
  </div>
</template>

<script setup>
// Simple wrapper component for page content
</script>

<style scoped>
.page-wrapper {
  padding: 2rem;
  min-height: calc(100vh - 200px); /* Account for header and footer */
  flex: 1;
}

/* Dark mode support */
[data-theme="dark"] .page-wrapper {
  background: transparent;
  color: #e0e0e0;
}
</style>
