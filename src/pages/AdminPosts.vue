<template>
  <DashboardLayout>
    <template #header>
      <h1 class="dashboard-title">
        <font-awesome-icon :icon="['fas', 'newspaper']" class="dashboard-svg-icon" />
        Posts
      </h1>
    </template>
    <section class="admin-posts-section">
      <!-- TODO: Implement posts management UI -->
      <div class="empty-state">Posts management coming soon.</div>
    </section>
  </DashboardLayout>
</template>
<script setup>
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
</script>
<style scoped>
.admin-posts-section { padding: 2rem; background: #181e2a; border-radius: 12px; min-height: 400px; }
.dashboard-title { font-size: 2rem; font-weight: 700; color: #fff; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem; }
.dashboard-svg-icon { font-size: 1.5rem; color: #60a5fa; }
</style>
