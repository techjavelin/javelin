<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthorization } from '@/composables/useAuthorization'
import { useEngagementParticipants } from '@/composables/useEngagementParticipants'
import { useEngagements } from '@/composables/useEngagements'
import CapGate from '@/components/CapGate.vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import SectionEditable from '@/components/SectionEditable.vue'
import ParticipantsTab from '@/components/ParticipantsTab.vue'
import { useFindings } from '@/composables/useFindings'
import { useToasts } from '@/composables/useToasts'
import FindingEditorModal from '@/components/FindingEditorModal.vue'
import EditEngagementModal from '@/components/EditEngagementModal.vue'
import LinkArtifactModal from '@/components/hub/LinkArtifactModal.vue'
import { useArtifacts } from '@/composables/useArtifacts'
import { humanFileSize, triggerBrowserDownload } from '@/utils/file'

const route = useRoute()
const engagementId = ref<string>('')
// Track last engagement id we primed authorization context for to avoid re-priming loops
const lastPrimedId = ref<string | null>(null)
const activeTab = ref<'overview'|'findings'|'artifacts'|'participants'>('overview')
const { has, primeContext } = useAuthorization()
const { add: addToast } = useToasts()
const { get, updateDetails, loading: egLoading, error: egError } = useEngagements()
const engagement = ref<any | null>(null)
// Artifacts state
const { artifacts, list: listArtifacts, remove: removeArtifact, downloadUrl } = useArtifacts()
const artifactsLoading = ref(false)
const artifactError = ref<string | null>(null)
const showArtifactModal = ref(false)
const downloadingId = ref<string | null>(null)
async function loadArtifacts(){
  if (!engagement.value) return
  artifactsLoading.value = true; artifactError.value=null
  try {
    await listArtifacts({ organizationId: engagement.value.organizationId, engagementId: engagement.value.id })
  } catch (e:any){ artifactError.value = e.message || 'Failed to load artifacts' }
  finally { artifactsLoading.value=false }
}
async function onArtifactUploaded(){ showArtifactModal.value=false; await loadArtifacts(); addToast({ message: 'Document uploaded', type: 'success' }) }
async function downloadArtifact(a:any){
  try {
    downloadingId.value = a.id
    const url = await downloadUrl(a)
    triggerBrowserDownload(url, a.name || 'download')
    addToast({ message: `Downloading ${a.name || 'file'}…`, type: 'info', duration: 3000 })
  } catch (e:any){ addToast({ message: e.message || 'Download failed', type: 'error' }) }
  finally { downloadingId.value=null }
}
async function deleteArtifact(a:any){
  if (!confirm('Delete this document?')) return
  try { await removeArtifact(a); addToast({ message: 'Document deleted', type: 'success' }) }
  catch(e:any){ addToast({ message: e.message || 'Delete failed', type: 'error' }) }
}
// Findings state
const { findings, listByEngagement } = useFindings()
const showFindingModal = ref(false)
const editingFinding = ref<any | null>(null)
const showEditEngagement = ref(false)
function openEditEngagement() { showEditEngagement.value = true }
function onEngagementSaved(updated: any) { engagement.value = updated }
function newFinding() { editingFinding.value = null; showFindingModal.value = true }
function editFinding(f: any) { editingFinding.value = f; showFindingModal.value = true }
async function onFindingSaved() {
  if (engagement.value) await listByEngagement(engagement.value.id)
}
const findingsLoaded = ref(false)

// Editable markdown fields
type MdFieldKey = 'executiveSummary' | 'scopeNotes' | 'constraints'
interface EditState { editing: boolean; draft: string }
const fieldStates: Record<MdFieldKey, EditState> = {
  executiveSummary: { editing: false, draft: '' },
  scopeNotes: { editing: false, draft: '' },
  constraints: { editing: false, draft: '' }
}

const savingField = ref<MdFieldKey | null>(null)

function beginEdit(field: string) {
  const f = field as MdFieldKey
  if (!engagement.value) return
  fieldStates[f].draft = engagement.value[f] || ''
  fieldStates[f].editing = true
}
function cancelEdit(field: string) {
  const f = field as MdFieldKey
  fieldStates[f].editing = false
  fieldStates[f].draft = ''
}
async function saveField(field: string) {
  const f = field as MdFieldKey
  if (!engagement.value) return
  savingField.value = f
  try {
    const patch: any = { [f]: fieldStates[f].draft }
    const updated = await updateDetails(engagement.value.id, patch)
    if (updated) {
      engagement.value = { ...engagement.value, ...updated }
      addToast({ title: 'Saved', message: fieldLabel(f) + ' updated', type: 'success' })
    }
    fieldStates[f].editing = false
  } catch (e: any) {
    addToast({ title: 'Error', message: e.message || 'Failed to save', type: 'error' })
  } finally { savingField.value = null }
}

function fieldLabel(f: MdFieldKey) {
  return f === 'executiveSummary' ? 'Executive Summary' : f === 'scopeNotes' ? 'Scope Notes' : 'Constraints'
}

const loading = computed(() => egLoading.value)
const error = computed(() => egError.value)

async function load() {
  if (!engagementId.value) return
  // Only prime context if we have not already for this engagement id
  if (lastPrimedId.value !== engagementId.value) {
    await primeContext({ engagementId: engagementId.value })
    lastPrimedId.value = engagementId.value
  }
  const data = await get(engagementId.value)
  engagement.value = data
  if (data && !findingsLoaded.value) {
    await listByEngagement(data.id)
    findingsLoaded.value = true
  }
  if (data) await loadArtifacts()
}

onMounted(() => {
  const id = route.params.id as string | undefined
  if (id) {
    engagementId.value = id
    load()
  }
})
// Guard against redundant route param updates with same id
watch(() => route.params.id, (id) => {
  if (id && id !== engagementId.value) {
    engagementId.value = id as string
    load()
  }
})

function tabClass(t: string) { return ['tab-btn', activeTab.value === t ? 'active' : ''].join(' ') }
</script>

<template>
  <DashboardLayout>
    <template #header>
      <h1 class="dashboard-title">Engagement Detail</h1>
    </template>
    <div class="engagement-detail">
      <div v-if="loading" class="state">Loading…</div>
      <div v-else-if="error" class="state error">{{ error }}</div>
      <div v-else-if="!engagement" class="state empty">Engagement not found.</div>
      <div v-else>
        <header class="page-header">
          <div class="title-block">
            <h1 class="title">{{ engagement.title || engagement.code || engagement.id }}</h1>
            <div class="meta-row">
              <span class="badge phase">{{ engagement.phase }}</span>
              <span class="badge status">{{ engagement.status }}</span>
              <span class="id">ID: {{ engagement.id }}</span>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn" @click="openEditEngagement">Edit</button>
          </div>
        </header>
        <nav class="tabs modern">
          <button :class="tabClass('overview')" @click="activeTab='overview'">Overview</button>
          <button :class="tabClass('findings')" @click="activeTab='findings'">Findings</button>
          <button :class="tabClass('artifacts')" @click="activeTab='artifacts'">Artifacts</button>
          <button :class="tabClass('participants')" @click="activeTab='participants'">Participants</button>
        </nav>

        <!-- OVERVIEW TAB -->
        <section v-if="activeTab==='overview'" class="tab-panel grid-cols">
          <div class="panel-card span-2">
            <SectionEditable :engagement="engagement" field="executiveSummary" label="Executive Summary" :state="fieldStates.executiveSummary" :saving="savingField==='executiveSummary'" @edit="beginEdit" @cancel="cancelEdit" @save="saveField" />
          </div>
          <div class="panel-card">
            <SectionEditable :engagement="engagement" field="scopeNotes" label="Scope" :state="fieldStates.scopeNotes" :saving="savingField==='scopeNotes'" @edit="beginEdit" @cancel="cancelEdit" @save="saveField" />
          </div>
          <div class="panel-card">
            <SectionEditable :engagement="engagement" field="constraints" label="Constraints" :state="fieldStates.constraints" :saving="savingField==='constraints'" @edit="beginEdit" @cancel="cancelEdit" @save="saveField" />
          </div>
        </section>

        <!-- PLACEHOLDER OTHER TABS (future tables/components to integrate) -->
        <section v-else-if="activeTab==='findings'" class="tab-panel">
          <div class="panel-head">
            <h2 class="section-title">Findings</h2>
            <div class="actions">
              <button class="btn primary" @click="newFinding">New Finding</button>
            </div>
          </div>
          <div v-if="!findings.length" class="placeholder">No findings yet.</div>
          <table v-else class="findings-table">
            <thead><tr><th>Title</th><th>Severity</th><th>Status</th><th>Publication</th><th></th></tr></thead>
            <tbody>
              <tr v-for="f in findings" :key="f.id">
                <td>{{ f.title }}</td>
                <td>{{ f.severity }}</td>
                <td>{{ f.status }}</td>
                <td><span class="pub-pill" :class="f.publicationStatus.toLowerCase()">{{ f.publicationStatus }}</span></td>
                <td><button class="link-btn" @click="editFinding(f)">Edit</button></td>
              </tr>
            </tbody>
          </table>
          <FindingEditorModal v-if="engagement" v-model="showFindingModal" :engagement-id="engagement.id" :application-id="engagement.applicationId" :finding="editingFinding" @saved="onFindingSaved" />
          <EditEngagementModal v-if="engagement" v-model="showEditEngagement" :engagement="engagement" @saved="onEngagementSaved" />
        </section>
        <section v-else-if="activeTab==='artifacts'" class="tab-panel">
          <div class="panel-head">
            <h2 class="section-title">Artifacts</h2>
            <div class="actions" v-if="has('ENG.MANAGE',{ engagementId: engagement.id })"><button class="btn primary" @click="showArtifactModal=true">Upload</button></div>
          </div>
          <div v-if="artifactError" class="placeholder error">{{ artifactError }}</div>
          <div v-else-if="artifactsLoading" class="placeholder">Loading documents…</div>
          <table v-else-if="artifacts.length" class="artifacts-table">
            <thead><tr><th>Name</th><th>Description</th><th>Size</th><th>Type</th><th></th></tr></thead>
            <tbody>
              <tr v-for="a in artifacts" :key="a.id">
                <td>{{ a.name }}</td>
                <td>{{ a.description || '-' }}</td>
                <td>{{ humanFileSize(a.size) }}</td>
                <td>{{ a.contentType || '-' }}</td>
                <td class="row-actions">
                  <button class="link-btn" @click="downloadArtifact(a)" :disabled="downloadingId===a.id">{{ downloadingId===a.id ? '...' : 'Download' }}</button>
                  <button class="link-btn danger" v-if="has('ENG.MANAGE',{ engagementId: engagement.id })" @click="deleteArtifact(a)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else class="placeholder">No artifacts uploaded.</p>
          <LinkArtifactModal
            v-if="engagement"
            :open="showArtifactModal"
            :organization-id="engagement.organizationId"
            :engagement-id="engagement.id"
            @close="showArtifactModal=false"
            @uploaded="onArtifactUploaded" />
        </section>
        <section v-else-if="activeTab==='participants'" class="tab-panel">
          <h2 class="section-title">Participants</h2>
          <ParticipantsTab v-if="engagement" :engagement-id="engagement.id" :organization-id="engagement.organizationId" />
        </section>
      </div>
    </div>
  </DashboardLayout>
</template>

<!-- Removed inline SectionEditable; now imported as a standalone component -->

<style scoped>
.page-header { margin-bottom:1rem; }
.title { margin:0; font-size:1.55rem; letter-spacing:.5px; }
.meta-row { display:flex; gap:.4rem; align-items:center; margin-top:.5rem; flex-wrap:wrap; }
.header-actions { display:flex; align-items:center; gap:.5rem; }
.badge { font-size:.6rem; text-transform:uppercase; letter-spacing:.08em; padding:.25rem .45rem; border-radius:4px; background:var(--color-accent-soft,#eef2ff); color:#334155; font-weight:600; }
[data-theme="dark"] .badge { background:#1e293b; color:#cbd5e1; }
.id { font-size:.65rem; opacity:.65; }
.tabs.modern { display:flex; gap:.35rem; margin-bottom:.9rem; }
.tab-btn { background:var(--color-card,#f3f4f6); border:1px solid var(--color-border,#e5e7eb); padding:.5rem .95rem; border-radius:8px; font-size:.75rem; font-weight:500; letter-spacing:.03em; cursor:pointer; transition:.15s; }
.tab-btn.active { background:linear-gradient(135deg,#3b82f6,#6366f1); color:#fff; box-shadow:0 2px 4px rgba(0,0,0,0.12); }
.tab-panel { background:var(--color-card,#fff); border:1px solid var(--color-border,#e5e7eb); border-radius:14px; padding:1.2rem 1.25rem; box-shadow:0 1px 2px rgba(0,0,0,0.04); }
[data-theme="dark"] .tab-panel { background:#1f2735; border-color:#2c3848; }
.grid-cols { display:grid; grid-template-columns:repeat(auto-fill,minmax(380px,1fr)); gap:1rem; }
.panel-card { background:var(--color-card,#fff); border:1px solid var(--color-border,#e5e7eb); border-radius:12px; padding:1rem 1rem 1.1rem; display:flex; flex-direction:column; gap:.75rem; position:relative; }
[data-theme="dark"] .panel-card { background:#1f2735; border-color:#2c3848; }
.section-editable { display:flex; flex-direction:column; gap:.65rem; }
.section-head { display:flex; align-items:center; justify-content:space-between; gap:.5rem; }
.section-label { font-size:.85rem; margin:0; font-weight:600; letter-spacing:.04em; text-transform:uppercase; opacity:.85; }
.markdown-body { font-size:.78rem; line-height:1.45; white-space:pre-wrap; word-wrap:break-word; }
.markdown-body :deep(h1), .markdown-body :deep(h2) { font-size:1rem; }
.markdown-body :deep(code) { background:rgba(0,0,0,.05); padding:2px 4px; border-radius:4px; font-size:.65rem; }
[data-theme="dark"] .markdown-body :deep(code) { background:#273142; }
.editor-wrap { display:flex; flex-direction:column; gap:.5rem; }
.edit-actions { display:flex; gap:.5rem; }
.btn { background:#e2e8f0; border:none; padding:.45rem .9rem; border-radius:6px; font-size:.7rem; cursor:pointer; font-weight:500; }
.btn.primary { background:#3b82f6; color:#fff; }
.btn.subtle { background:transparent; color:var(--color-text,#334155); }
[data-theme="dark"] .btn { background:#273142; color:#cbd5e1; }
[data-theme="dark"] .btn.primary { background:#3b82f6; }
.btn:disabled { opacity:.6; cursor:not-allowed; }
.placeholder { opacity:.6; font-size:.75rem; }
.state { padding:1rem; }
.state.error { color:#dc2626; }
.state.empty { color:#64748b; }
.panel-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:.75rem; }
.findings-table { width:100%; border-collapse:collapse; font-size:.7rem; }
.findings-table th, .findings-table td { padding:.45rem .5rem; border-bottom:1px solid var(--color-border,#e5e7eb); text-align:left; }
.findings-table th { font-size:.6rem; text-transform:uppercase; letter-spacing:.08em; opacity:.75; }
.link-btn { background:transparent; border:none; color:#2563eb; font-size:.65rem; cursor:pointer; }
.pub-pill { display:inline-block; font-size:.55rem; padding:.25rem .4rem; border-radius:4px; font-weight:600; letter-spacing:.05em; }
.pub-pill.draft { background:#fcd34d; color:#723b13; }
.pub-pill.published { background:#4ade80; color:#064e3b; }
[data-theme="dark"] .pub-pill.draft { background:#b45309; color:#fff; }
[data-theme="dark"] .pub-pill.published { background:#15803d; color:#fff; }
@media (max-width:800px){ .grid-cols { grid-template-columns:1fr; } }
</style>
