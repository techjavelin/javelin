<template>
  <DashboardLayout>
    <section class="engagement-detail-section" v-if="loading && !engagement">
      <p>Loading engagement...</p>
    </section>
    <section v-else-if="engagement" class="engagement-detail-section">
      <div class="header-row top-gap">
        <h1 class="dashboard-title">{{ engagement.title }}</h1>
        <div class="badges">
          <span class="badge phase">Phase: {{ engagement.phase }}</span>
          <span class="badge status">Status: {{ engagement.status }}</span>
        </div>
        <div class="actions">
          <button class="btn btn-small" @click="refresh" :disabled="loading">Refresh</button>
          <button class="btn btn-small" @click="openArtifactModal">New Artifact</button>
        </div>
      </div>
      <div class="meta-grid">
        <div>
          <label>Code</label>
          <div class="value">{{ engagement.code }}</div>
        </div>
        <div>
          <label>Organization</label>
          <div class="value">{{ engagement.organizationId }}</div>
        </div>
        <div>
          <label>Applications</label>
          <div class="value apps">
            <span v-if="appLinks.length===0" class="dim">None linked</span>
            <span v-for="l in appLinks" :key="l.id" class="app-chip">{{ l.applicationId }}</span>
          </div>
        </div>
        <div>
          <label>Created</label>
          <div class="value">{{ formatDate(engagement.createdAt) }}</div>
        </div>
      </div>
      <div class="update-row">
        <div>
          <label for="phaseSelect">Phase</label>
          <select id="phaseSelect" v-model="editPhase">
            <option v-for="p in phases" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>
        <div>
          <label for="statusSelect">Status</label>
          <select id="statusSelect" v-model="editStatus">
            <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <button class="btn" @click="saveState" :disabled="savingState">Save</button>
      </div>
      <h2 class="section-title">Artifacts</h2>
      <div v-if="artifactsLoading" class="loading-sm">Loading artifacts...</div>
      <div v-else-if="artifacts.length === 0" class="empty">No artifacts yet.</div>
      <ul class="artifact-list" v-else>
        <li v-for="a in artifacts" :key="a.id" class="artifact-item">
          <div>
            <strong>{{ a.name }}</strong>
            <div class="small meta">Provider: {{ a.provider }} | Status: {{ a.status || 'N/A'}}</div>
          </div>
          <div class="artifact-actions">
            <button class="btn btn-tiny" @click="editArtifact(a)">Edit</button>
            <button class="btn btn-tiny danger" @click="deleteArtifact(a.id)">Delete</button>
          </div>
        </li>
      </ul>
    </section>
    <section v-else class="engagement-detail-section"><p>Engagement not found.</p></section>

    <div v-if="showArtifactModal" class="modal-backdrop">
      <div class="modal">
        <h3>{{ artifactForm.id ? 'Edit Artifact' : 'New Artifact' }}</h3>
        <form @submit.prevent="submitArtifact">
          <div class="form-row">
            <label>Name</label>
            <input v-model="artifactForm.name" required />
          </div>
            <div class="form-row">
            <label>Provider</label>
            <select v-model="artifactForm.provider" required>
              <option value="PANDADOC">Pandadoc</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div class="form-row">
            <label>Document Type</label>
            <select v-model="artifactForm.documentType">
              <option value="REPORT">Report</option>
              <option value="SOW">SOW</option>
              <option value="INVOICE">Invoice</option>
            </select>
          </div>
          <div class="form-row">
            <label>Description</label>
            <textarea v-model="artifactForm.description" rows="3"></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-small" @click="closeArtifactModal">Cancel</button>
            <button type="submit" class="btn btn-small primary">{{ artifactSubmitting ? 'Saving...' : 'Save' }}</button>
          </div>
        </form>
      </div>
    </div>
  </DashboardLayout>
</template>
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { useEngagements } from '../composables/useEngagements'
import { useArtifacts } from '../composables/useArtifacts'
import { useEngagementApplications } from '../composables/useEngagementApplications'

const route = useRoute()
const id = route.params.id as string

const { currentEngagement, get, update, loading, error } = useEngagements()
const engagement = currentEngagement

const { artifacts, list: listArtifacts, create: createArtifact, update: updateArtifact, remove: removeArtifact, loading: artifactsLoading } = useArtifacts()
const { links: appLinks, listByEngagement } = useEngagementApplications()

const phases = ['PLANNING','IN_PROGRESS','REPORTING','COMPLETE'] as const
type Phase = typeof phases[number]
const statuses = ['ACTIVE','ON_HOLD','CLOSED'] as const
type Status = typeof statuses[number]
const editPhase = ref<Phase>('PLANNING')
const editStatus = ref<Status>('ACTIVE')
const savingState = ref(false)

const showArtifactModal = ref(false)
const artifactForm = ref<any>({})
const artifactSubmitting = ref(false)

function formatDate(d?: string | null) {
  if(!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleString()
}

async function refresh() {
  await get(id)
  if (engagement.value) {
    editPhase.value = engagement.value.phase
    editStatus.value = engagement.value.status
    await Promise.all([
      listArtifacts({ engagementId: engagement.value.id }),
      listByEngagement(engagement.value.id)
    ])
  }
}

async function saveState() {
  if (!engagement.value) return
  savingState.value = true
  await update(engagement.value.id, { phase: editPhase.value, status: editStatus.value } as any)
  savingState.value = false
}

function openArtifactModal(a?: any) {
  artifactForm.value = a ? { ...a } : { name: '', provider: 'PANDADOC', documentType: 'REPORT', description: '' }
  showArtifactModal.value = true
}
function closeArtifactModal() { showArtifactModal.value = false }

async function submitArtifact() {
  if (!engagement.value) return
  artifactSubmitting.value = true
  if (artifactForm.value.id) {
    await updateArtifact(artifactForm.value.id, { name: artifactForm.value.name, description: artifactForm.value.description, documentType: artifactForm.value.documentType })
  } else {
    await createArtifact({
      name: artifactForm.value.name,
      description: artifactForm.value.description,
      provider: artifactForm.value.provider,
      documentType: artifactForm.value.documentType,
      engagementId: engagement.value.id,
      organizationId: engagement.value.organizationId
    })
  }
  artifactSubmitting.value = false
  closeArtifactModal()
}

function editArtifact(a: any) { openArtifactModal(a) }
async function deleteArtifact(id: string) { await removeArtifact(id) }

watch(() => route.params.id, async newId => {
  if (typeof newId === 'string') {
    await refresh()
  }
})

onMounted(refresh)
</script>
<style scoped>
.engagement-detail-section { padding:2rem; background:#181e2a; border-radius:12px; min-height:300px; }
.dashboard-title { font-size:2rem; font-weight:700; color:#fff; margin:0; }
.header-row { display:flex; flex-wrap:wrap; gap:1rem; align-items:center; }
.badges { display:flex; gap:.5rem; }
.badge { background:#243044; color:#fff; padding:.35rem .75rem; border-radius:20px; font-size:.75rem; letter-spacing:.5px; text-transform:uppercase; }
.badge.phase { background:#34548f; }
.badge.status { background:#4b3d7a; }
.actions { margin-left:auto; display:flex; gap:.5rem; }
.btn { background:#2563eb; border:none; color:#fff; padding:.6rem 1rem; border-radius:6px; cursor:pointer; font-size:.85rem; font-weight:600; }
.btn-small { padding:.4rem .75rem; font-size:.75rem; }
.btn-tiny { padding:.25rem .5rem; font-size:.65rem; }
.btn.danger { background:#dc2626; }
.btn.primary { background:#2563eb; }
.btn:disabled { opacity:.5; cursor:default; }
.meta-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:1rem; margin-bottom:1.5rem; }
.meta-grid label { font-size:.65rem; text-transform:uppercase; letter-spacing:.5px; color:#94a3b8; }
.value { font-size:.85rem; font-weight:600; margin-top:.15rem; }
.value.apps { display:flex; flex-wrap:wrap; gap:.35rem; }
.app-chip { background:#1f2737; padding:.25rem .55rem; border-radius:14px; font-size:.65rem; letter-spacing:.5px; border:1px solid #273248; }
.dim { opacity:.6; }
.update-row { display:flex; gap:1rem; align-items:flex-end; margin-bottom:2rem; flex-wrap:wrap; }
.update-row select { background:#0f1623; color:#fff; border:1px solid #243044; padding:.4rem .5rem; border-radius:4px; }
.section-title { margin:0 0 .75rem; font-size:1.1rem; font-weight:600; }
.artifact-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:.5rem; }
.artifact-item { display:flex; justify-content:space-between; align-items:center; background:#0f1623; padding:.75rem 1rem; border:1px solid #1f2937; border-radius:8px; }
.artifact-item .small { font-size:.65rem; color:#94a3b8; margin-top:.25rem; }
.modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.65); display:flex; align-items:center; justify-content:center; z-index:50; }
.modal { background:#1e293b; padding:1.5rem; border-radius:12px; width:420px; max-width:95%; }
.modal h3 { margin-top:0; }
.form-row { display:flex; flex-direction:column; margin-bottom:.75rem; }
.form-row label { font-size:.7rem; text-transform:uppercase; letter-spacing:.5px; color:#94a3b8; margin-bottom:.25rem; }
.form-row input, .form-row select, .form-row textarea { background:#0f1623; color:#fff; border:1px solid #243044; padding:.5rem .6rem; border-radius:6px; font-size:.8rem; }
.modal-actions { display:flex; justify-content:flex-end; gap:.5rem; margin-top:.5rem; }
.empty, .loading-sm { font-size:.75rem; color:#94a3b8; }
</style>
