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
            <th>Status</th>
            <th>Invited Admin</th>
            <th>Admins</th>
            <th>Members</th>
            <th>Age</th>
            <th>Activated At</th>
            <th>Actions</th>
            <th>Created</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="org in organizations" :key="org.id">
            <td>{{ org.name }}</td>
            <td>
              <span :class="['status-pill', org.status === 'ACTIVE' ? 'active' : 'pending']">{{ org.status || 'PENDING' }}</span>
            </td>
            <td>
              <span v-if="org.invitedAdminEmail && !org.admins.length" class="invited-email">{{ org.invitedAdminEmail }}</span>
              <span v-else-if="org.invitedAdminEmail && org.admins.includes(org.invitedAdminEmail)" class="activated-email">{{ org.invitedAdminEmail }}</span>
              <span v-else>—</span>
            </td>
            <td><span class="badge" v-for="a in org.admins" :key="a">{{ a }}</span></td>
            <td><span class="badge secondary" v-for="m in org.members || []" :key="m">{{ m }}</span></td>
            <td>{{ formatAge(org.createdAt) }}</td>
            <td>{{ org.activatedAt ? formatDateTime(org.activatedAt) : '—' }}</td>
            <td class="actions-cell">
              <div v-if="org.status === 'PENDING'" class="actions-stack">
                <button class="mini" @click="resendInvite(org)" :disabled="actionLoading">Resend Invite</button>
                <button class="mini secondary" @click="manualActivate(org)" :disabled="actionLoading">Manual Activate</button>
              </div>
              <span v-else class="dash">—</span>
            </td>
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
const actionLoading = ref(false)
const actionMessage = ref('')

onMounted(() => {
  fetchOrganizations()
})

async function handleCreate() {
  createdMessage.value = ''
  const result = await createOrganization({ name: name.value, adminEmail: adminEmail.value })
  if (result) {
  createdMessage.value = `Organization '${result.name}' created in PENDING state. Invite sent to ${adminEmail.value}. It will activate when the user verifies.`
    name.value = ''
    adminEmail.value = ''
  }
}

async function resendInvite(org: any) {
  if (!org?.invitedAdminEmail) return
  actionMessage.value = ''
  actionLoading.value = true
  try {
    await fetch(import.meta.env.VITE_ADMIN_API_BASE + '/invite-admin-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: org.invitedAdminEmail,
        organizationId: org.id,
        organizationName: org.name,
        sendEmail: true
      })
    })
    actionMessage.value = 'Invite resent.'
  } catch (e: any) {
    actionMessage.value = 'Failed to resend invite.'
  } finally {
    actionLoading.value = false
  }
}

async function manualActivate(org: any) {
  actionMessage.value = ''
  actionLoading.value = true
  try {
    const res = await fetch(import.meta.env.VITE_ADMIN_API_BASE + '/activate-organization-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId: org.id, email: org.invitedAdminEmail })
    })
    if (res.ok) {
      await fetchOrganizations({ force: true })
      actionMessage.value = 'Organization manually activated.'
    } else {
      actionMessage.value = 'Activation failed.'
    }
  } catch {
    actionMessage.value = 'Activation error.'
  } finally {
    actionLoading.value = false
  }
}

function formatDateTime(dateString?: string | null) {
  if (!dateString) return '—'
  try { return new Date(dateString).toLocaleString() } catch { return dateString }
}

function formatAge(createdAt?: string | null) {
  if (!createdAt) return '—'
  const start = new Date(createdAt).getTime()
  if (isNaN(start)) return '—'
  const diffMs = Date.now() - start
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays > 0) return diffDays + 'd'
  const diffHours = Math.floor(diffMs / 3600000)
  if (diffHours > 0) return diffHours + 'h'
  const diffMinutes = Math.floor(diffMs / 60000)
  return diffMinutes + 'm'
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
.status-pill { display:inline-block; padding:.2rem .55rem; border-radius:12px; font-size:.65rem; font-weight:600; letter-spacing:.5px; }
.status-pill.pending { background: var(--color-border-strong); color: var(--color-text-dim); }
.status-pill.active { background: #2d995b; color:#fff; }
.invited-email { font-size:.7rem; background: var(--color-border-strong); padding:.15rem .4rem; border-radius:10px; }
.activated-email { font-size:.7rem; background:#2d995b; color:#fff; padding:.15rem .4rem; border-radius:10px; }
.actions-cell { min-width:140px; }
.actions-stack { display:flex; flex-direction:column; gap:.35rem; }
.mini { font-size:.65rem; padding:.3rem .5rem; border:1px solid var(--color-border); background:var(--color-bg-alt); border-radius:4px; cursor:pointer; }
.mini.secondary { background: var(--color-border-strong); }
.mini[disabled] { opacity:.5; cursor:not-allowed; }
.action-message { margin-top:.5rem; font-size:.7rem; color: var(--color-text-dim); }
.loading-state, .empty-state { text-align:center; padding:1.5rem 0; color: var(--color-text-dim); }
.loading-spinner { width:28px; height:28px; border:3px solid var(--color-border); border-top-color: var(--color-accent); border-radius:50%; margin:0 auto .75rem; animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
