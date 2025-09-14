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
              <div class="actions-row">
                <template v-if="editingOrgId === org.id">
                  <input v-model="editingName" class="mini-edit" :disabled="actionLoading" :placeholder="org.name" />
                  <button
                    class="icon-btn success"
                    :disabled="actionLoading || !editingName.trim()"
                    @click="saveEdit(org)"
                    title="Save changes"
                    aria-label="Save"
                  >
                    <font-awesome-icon :icon="['fas','floppy-disk']" />
                  </button>
                  <button
                    class="icon-btn neutral"
                    :disabled="actionLoading"
                    @click="cancelEdit"
                    title="Cancel edit"
                    aria-label="Cancel"
                  >
                    <font-awesome-icon :icon="['fas','xmark']" />
                  </button>
                </template>
                <template v-else>
                  <button
                    class="icon-btn neutral"
                    :disabled="actionLoading"
                    @click="startEdit(org)"
                    title="Edit organization"
                    aria-label="Edit organization"
                  >
                    <font-awesome-icon :icon="['fas','pencil']" />
                  </button>
                  <template v-if="deleteConfirmId === org.id">
                    <button
                      class="icon-btn danger"
                      :disabled="actionLoading"
                      @click="performDelete(org)"
                      title="Confirm delete"
                      aria-label="Confirm delete"
                    >
                      <font-awesome-icon :icon="['fas','check']" />
                    </button>
                    <button
                      class="icon-btn neutral"
                      :disabled="actionLoading"
                      @click="deleteConfirmId = null"
                      title="Cancel delete"
                      aria-label="Cancel delete"
                    >
                      <font-awesome-icon :icon="['fas','xmark']" />
                    </button>
                  </template>
                  <button
                    v-else
                    class="icon-btn danger"
                    :disabled="actionLoading"
                    @click="confirmDelete(org)"
                    title="Delete organization"
                    aria-label="Delete organization"
                  >
                    <font-awesome-icon :icon="['fas','trash']" />
                  </button>
                  <template v-if="org.status === 'PENDING'">
                    <button
                      class="icon-btn accent"
                      :disabled="actionLoading"
                      @click="resendInviteClick(org)"
                      title="Resend invite"
                      aria-label="Resend invite"
                    >
                      <font-awesome-icon :icon="['fas','paper-plane']" />
                    </button>
                    <button
                      class="icon-btn warning"
                      :disabled="actionLoading"
                      @click="manualActivate(org)"
                      title="Manual activate"
                      aria-label="Manual activate"
                    >
                      <font-awesome-icon :icon="['fas','bolt']" />
                    </button>
                  </template>
                </template>
                <small v-if="inviteStatus[org.id] && org.status === 'PENDING'" class="invite-status" :class="inviteStatus[org.id].lastResult">{{ inviteStatus[org.id].message }}</small>
              </div>
            </td>
            <td>{{ formatDate(org.createdAt) }}</td>
            <td>{{ formatDate(org.updatedAt) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="actionMessage" class="action-message">{{ actionMessage }}</p>
    </section>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { useOrganizations } from '../composables/useOrganizations'
import { buildAdminApiPath } from '../utils/apiBase'
import { buildAuthHeaders } from '../utils/authHeaders'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faBuilding, faList, faSync, faPencil, faTrash, faFloppyDisk, faXmark, faPaperPlane, faBolt, faCheck } from '@fortawesome/free-solid-svg-icons'

library.add(faBuilding, faList, faSync, faPencil, faTrash, faFloppyDisk, faXmark, faPaperPlane, faBolt, faCheck)

const { organizations, loading, error, creating, fetchOrganizations, createOrganization, resendInvite, inviteStatus, updateOrganization, deleteOrganization } = useOrganizations()
const name = ref('')
const adminEmail = ref('')
const createdMessage = ref('')
const actionLoading = ref(false)
const actionMessage = ref('')
const editingOrgId = ref<string | null>(null)
const editingName = ref('')
const deleteConfirmId = ref<string | null>(null)

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

async function resendInviteClick(org: any) {
  actionMessage.value = ''
  actionLoading.value = true
  try {
    const ok = await resendInvite(org)
    actionMessage.value = ok ? 'Invite resent.' : 'Invite failed.'
  } finally {
    actionLoading.value = false
  }
}

async function manualActivate(org: any) {
  actionMessage.value = ''
  actionLoading.value = true
  try {
    const url = buildAdminApiPath('/activate-organization-admin')
    if (url.includes('admin-api-misconfigured')) throw new Error('Admin API base missing')
    const headers = await buildAuthHeaders({ 'Content-Type': 'application/json' })
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ organizationId: org.id, email: org.invitedAdminEmail })
    })
    if (res.ok) {
      await fetchOrganizations({ force: true })
      actionMessage.value = 'Organization manually activated.'
    } else {
      actionMessage.value = res.status === 401 ? 'Not authorized (check login)' : 'Activation failed.'
    }
  } catch {
    actionMessage.value = 'Activation error.'
  } finally {
    actionLoading.value = false
  }
}

function startEdit(org: any) {
  editingOrgId.value = org.id
  editingName.value = org.name
}

async function saveEdit(org: any) {
  if (!editingOrgId.value) return
  actionMessage.value = ''
  actionLoading.value = true
  try {
    const updated = await updateOrganization(org.id, { name: editingName.value })
    if (updated) {
      actionMessage.value = 'Organization updated.'
      editingOrgId.value = null
      editingName.value = ''
    } else {
      actionMessage.value = 'Update failed.'
    }
  } finally {
    actionLoading.value = false
  }
}

function cancelEdit() {
  editingOrgId.value = null
  editingName.value = ''
}

function confirmDelete(org: any) {
  deleteConfirmId.value = org.id
  actionMessage.value = ''
}

async function performDelete(org: any) {
  actionLoading.value = true
  try {
    const ok = await deleteOrganization(org.id, { confirm: true })
    actionMessage.value = ok ? 'Organization deleted.' : 'Delete failed.'
    deleteConfirmId.value = null
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
.mini.danger { background:#bb2d3b; color:#fff; border-color:#bb2d3b; }
.mini[disabled] { opacity:.5; cursor:not-allowed; }
.action-message { margin-top:.5rem; font-size:.7rem; color: var(--color-text-dim); }
.invite-status { font-size:.6rem; opacity:.85; }
.invite-status.success { color:#2d995b; }
.invite-status.failure { color:#d33; }
.mini-edit { font-size:.65rem; padding:.25rem .4rem; border:1px solid var(--color-border); border-radius:4px; }
.confirm-delete { display:flex; gap:.25rem; align-items:center; flex-wrap:wrap; }
.row-btns { display:flex; gap:.35rem; }
.actions-row { display:flex; align-items:center; gap:.35rem; flex-wrap:nowrap; }
.actions-cell { white-space:nowrap; }
.icon-btn { display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:6px; border:1px solid transparent; background: var(--color-border-strong); color: var(--color-text); font-size:.75rem; cursor:pointer; transition: background .15s, color .15s, border-color .15s; }
.icon-btn.neutral { background: var(--color-bg-alt); border-color: var(--color-border); }
.icon-btn.neutral:hover:not([disabled]) { background: var(--color-border-strong); }
.icon-btn.accent { background: var(--color-accent); color:#fff; }
.icon-btn.accent:hover:not([disabled]) { filter: brightness(1.1); }
.icon-btn.warning { background:#f59e0b; color:#151515; }
.icon-btn.warning:hover:not([disabled]) { filter: brightness(1.1); }
.icon-btn.success { background:#2d995b; color:#fff; }
.icon-btn.success:hover:not([disabled]) { filter: brightness(1.1); }
.icon-btn.danger { background:#bb2d3b; color:#fff; }
.icon-btn.danger:hover:not([disabled]) { filter: brightness(1.05); }
.icon-btn:focus-visible { outline:2px solid var(--color-accent); outline-offset:2px; }
.icon-btn[disabled] { opacity:.55; cursor:not-allowed; }
.loading-state, .empty-state { text-align:center; padding:1.5rem 0; color: var(--color-text-dim); }
.loading-spinner { width:28px; height:28px; border:3px solid var(--color-border); border-top-color: var(--color-accent); border-radius:50%; margin:0 auto .75rem; animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
