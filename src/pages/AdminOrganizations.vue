<template>
  <DashboardLayout>
    <template #header>
      <h1 class="dashboard-title">
        <font-awesome-icon :icon="['fas','building']" class="dashboard-svg-icon" />
        Organizations
      </h1>
    </template>

    <section class="org-actions">
      <form class="create-org-form" @submit.prevent="handleCreate">
        <div class="form-row">
          <label>Name</label>
          <input v-model="name" type="text" placeholder="Acme Corp" required />
        </div>
        <div class="form-row">
          <label>Initial Admin Email</label>
          <input v-model="adminEmail" type="email" placeholder="admin@example.com" required />
        </div>
        <p class="hint">An invitation email will be sent. Additional admins/members can be added later.</p>
        <button class="primary" :disabled="creating || !name || !adminEmail">{{ creating ? 'Creating...' : 'Create & Invite' }}</button>
        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="createdMessage" class="success">{{ createdMessage }}</p>
      </form>
    </section>

    <section class="org-list-section">
      <div class="section-header">
        <h2>
          <font-awesome-icon :icon="['fas','list']" class="section-svg-icon" /> Existing Organizations
        </h2>
        <button class="refresh" @click="fetchOrganizations({ force: true })" :disabled="loading">Refresh</button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading organizations...</p>
      </div>
      <div v-else-if="!organizations.length" class="empty-state">
        <p>No organizations yet. Create the first one above.</p>
      </div>
      <table v-else class="org-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Admins</th>
            <th>Members</th>
            <th>Created</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="org in organizations" :key="org.id">
            <td>{{ org.name }}</td>
            <td><span class="badge" v-for="a in org.admins" :key="a">{{ a }}</span></td>
            <td><span class="badge secondary" v-for="m in org.members || []" :key="m">{{ m }}</span></td>
            <td>{{ formatDate(org.createdAt) }}</td>
            <td>{{ formatDate(org.updatedAt) }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { useOrganizations } from '../composables/useOrganizations'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faBuilding, faList, faSync } from '@fortawesome/free-solid-svg-icons'

library.add(faBuilding, faList, faSync)

const { organizations, loading, error, creating, fetchOrganizations, createOrganization } = useOrganizations()
const name = ref('')
const adminEmail = ref('')
const createdMessage = ref('')

onMounted(() => {
  fetchOrganizations()
})

async function handleCreate() {
  createdMessage.value = ''
  const result = await createOrganization({ name: name.value, adminEmail: adminEmail.value })
  if (result) {
    createdMessage.value = `Organization '${result.name}' created and invite sent to ${adminEmail.value}.`
    name.value = ''
    adminEmail.value = ''
  }
}

function formatDate(dateString?: string | null) {
  if (!dateString) return '—'
  try { return new Date(dateString).toLocaleDateString() } catch { return dateString }
}
</script>

<style scoped>
.dashboard-title { display:flex; align-items:center; gap:.6rem; font-size:1.75rem; }
.org-actions { background: var(--color-surface); padding:1.25rem; border-radius:8px; margin-bottom:1.5rem; }
.create-org-form { display:grid; gap:1rem; max-width:720px; }
.form-row { display:flex; flex-direction:column; gap:.35rem; }
.form-row label { font-weight:600; font-size:.9rem; }
.form-row input { padding:.6rem .75rem; border:1px solid var(--color-border); border-radius:4px; background:var(--color-bg-alt); color:inherit; }
button.primary { background: var(--color-accent); color:#fff; border:none; padding:.65rem 1rem; border-radius:4px; cursor:pointer; font-weight:600; }
button.primary[disabled] { opacity:.6; cursor: not-allowed; }
.error { color:#d33; font-size:.85rem; }
.success { color:#2d995b; font-size:.85rem; }
.org-list-section { background: var(--color-surface); padding:1.25rem; border-radius:8px; }
.section-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:.75rem; }
.section-header h2 { display:flex; align-items:center; gap:.5rem; font-size:1.1rem; }
.refresh { background:none; border:1px solid var(--color-border); padding:.45rem .8rem; border-radius:4px; cursor:pointer; }
.org-table { width:100%; border-collapse:collapse; font-size:.9rem; }
.org-table th, .org-table td { padding:.55rem .6rem; border-bottom:1px solid var(--color-border); vertical-align:top; }
.badge { display:inline-block; background: var(--color-accent); color:#fff; padding:.15rem .5rem; border-radius:12px; font-size:.7rem; margin:0 .25rem .25rem 0; }
.badge.secondary { background: var(--color-border-strong); color:var(--color-text); }
.loading-state, .empty-state { text-align:center; padding:1.5rem 0; color: var(--color-text-dim); }
.loading-spinner { width:28px; height:28px; border:3px solid var(--color-border); border-top-color: var(--color-accent); border-radius:50%; margin:0 auto .75rem; animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
