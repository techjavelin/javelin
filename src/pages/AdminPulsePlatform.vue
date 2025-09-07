<template>
  <DashboardLayout>
    <template #header>
      <h1 class="dashboard-title">
        <font-awesome-icon :icon="['fas', 'tachometer-alt']" class="dashboard-svg-icon" />
        Pulse Platform Admin
      </h1>
    </template>
    <section class="dashboard-section">
      <h2>Invite Organization</h2>
      <form @submit.prevent="onInvite">
        <div>
          <label for="orgName">Organization Name</label>
          <input id="orgName" v-model="orgName" required />
        </div>
        <div>
          <label for="primaryEmail">Primary Email</label>
          <input id="primaryEmail" v-model="primaryEmail" type="email" required />
        </div>
        <button class="btn btn-primary" type="submit" :disabled="loading">Invite</button>
      </form>
      <div v-if="success" class="success">Invitation sent! The user will receive an email to join.</div>
      <div v-if="error" class="error">{{ error }}</div>
    </section>
    <section class="dashboard-section">
      <h2>Existing Organizations</h2>
      <div v-if="orgsLoading">Loading organizations...</div>
      <div v-else-if="orgsError" class="error">{{ orgsError }}</div>
      <div v-else>
        <table class="org-table" v-if="organizations.length">
          <thead>
            <tr>
              <th>Name</th>
              <th>Created</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="org in organizations" :key="org.id">
              <td>{{ org.name }}</td>
              <td>{{ org.createdAt ? new Date(org.createdAt).toLocaleString() : '' }}</td>
              <td>{{ org.id }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else>No organizations found.</div>
      </div>
    </section>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { inviteOrganization } from '../services/pulsePlatformService'
import { useOrganizations } from '@/composables/useOrganizations'

const orgName = ref('')
const primaryEmail = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

const { organizations, loading: orgsLoading, error: orgsError, fetchOrganizations } = useOrganizations()

onMounted(() => {
  fetchOrganizations()
})

async function onInvite() {
  error.value = null
  success.value = false
  loading.value = true
  try {
    await inviteOrganization(orgName.value, primaryEmail.value)
    success.value = true
    orgName.value = ''
    primaryEmail.value = ''
    fetchOrganizations()
  } catch (e: any) {
    error.value = e.message || 'Failed to send invitation.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
form {
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
}
.success {
  color: #059669;
  margin-top: 1rem;
}
.error {
  color: #e53935;
  margin-top: 1rem;
}
.org-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 2rem;
}
.org-table th, .org-table td {
  border: 1px solid #e0e0e0;
  padding: 0.5rem 1rem;
  text-align: left;
}
.org-table th {
  background: #f5f5f5;
  font-weight: 600;
}
.org-table tr:nth-child(even) {
  background: #fafafa;
}
</style>
