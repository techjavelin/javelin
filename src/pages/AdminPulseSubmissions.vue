<template>
  <DashboardLayout>
    <template #header>
      <h1 class="dashboard-title">
        <font-awesome-icon :icon="['fas', 'envelope-open-text']" class="dashboard-svg-icon" />
        Pulse Invite Submissions
      </h1>
    </template>
    <section class="dashboard-section">
      <h2>Invite Requests</h2>
      <div v-if="loading">Loading submissions...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else>
        <table class="org-table" v-if="submissions.length">
          <thead>
            <tr>
              <th>Email</th>
              <th>Organization</th>
              <th>Industry</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sub in submissions" :key="sub.id">
              <td>{{ sub.email }}</td>
              <td>{{ sub.organizationName }}</td>
              <td>{{ sub.industry }}</td>
              <td>{{ sub.reason }}</td>
              <td>{{ sub.status }}</td>
              <td>
                <button v-if="sub.status === 'pending'" class="btn btn-primary" @click="invite(sub)">Invite</button>
                <span v-else>—</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else>No submissions found.</div>
      </div>
    </section>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { usePulseInviteAdmin } from '@/composables/usePulseInviteAdmin'
import { inviteOrganization } from '../services/pulsePlatformService'

const { submissions, loading, error, fetchSubmissions, markInvited } = usePulseInviteAdmin()

onMounted(() => {
  fetchSubmissions()
})

async function invite(sub: any) {
  await inviteOrganization(sub.organizationName, sub.email)
  await markInvited(sub.id)
  fetchSubmissions()
}
</script>

<style scoped>
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
