<template>
  <div class="social-icons">
    <a href="https://twitter.com/techjavelin" target="_blank" rel="noopener" aria-label="Twitter">
  <font-awesome-icon :icon="['fab', 'twitter']" />
    </a>
    <a href="https://linkedin.com/company/techjavelin" target="_blank" rel="noopener" aria-label="LinkedIn">
  <font-awesome-icon :icon="['fab', 'linkedin']" />
    </a>
    <a href="https://github.com/techjavelin/javelin" target="_blank" rel="noopener" aria-label="GitHub">
  <font-awesome-icon :icon="['fab', 'github']" />
    </a>
    <a href="/support" aria-label="Support">
  <font-awesome-icon :icon="['fas', 'life-ring']" />
    </a>
  </div>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
</script>

<style scoped>
.social-icons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 0.5rem;
}
.social-icons :deep(.fa) {
  font-size: 1.15rem;
  color: #2566af;
  transition: color 0.2s;
}
.social-icons a:hover :deep(.fa) {
  color: #3b82f6;
}
</style>
