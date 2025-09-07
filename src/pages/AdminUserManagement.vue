<template>
  <DashboardLayout>
    <template #header>
      <h1 class="dashboard-title">
        <font-awesome-icon :icon="['fas', 'users-cog']" class="dashboard-svg-icon" />
        User Management
      </h1>
    </template>
    <section class="user-management-section">
      <UserManagement />
    </section>
  </DashboardLayout>
</template>

<script setup>
import DashboardLayout from '../layouts/DashboardLayout.vue'
import UserManagement from '../components/UserManagement.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
</script>

<style scoped>
.user-management-section {
  padding: 2rem;
  background: #181e2a;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  min-height: 400px;
}
.dashboard-title {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.dashboard-svg-icon {
  font-size: 1.5rem;
  color: #60a5fa;
}
</style>
