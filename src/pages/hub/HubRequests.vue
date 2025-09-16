<template>
  <div class="hub-page">
    <div class="page-header">
      <h1>Service Requests</h1>
      <div class="actions" v-if="canRequest">
        <button class="btn primary" @click="showCreate=true">New Request</button>
      </div>
    </div>

  <div class="org-select" v-if="organizations.length > 1">
      <label>Organization</label>
      <select v-model="currentOrgIdLocal" @change="changeOrg">
  <option v-for="o in organizations" :key="o.id" :value="o.id">{{ o.name }}</option>
      </select>
    </div>

    <div v-if="loading" class="loading">Loading requests...</div>
    <div v-else-if="error" class="error">
      <span>{{ error }}</span>
      <button class="btn sm" @click="reload">Retry</button>
    </div>
    <div v-else>
      <div v-if="filtered.length===0" class="empty">
        <p>No requests yet<span v-if="canRequest"> — create your first one.</span></p>
      </div>
      <div class="filters" v-if="requests.length">
        <select v-model="statusFilter">
          <option value="">All Statuses</option>
          <option v-for="s in STATUS_ORDER" :key="s" :value="s">{{ s }}</option>
        </select>
        <select v-model="typeFilter">
          <option value="">All Types</option>
          <option v-for="t in TYPE_ORDER" :key="t" :value="t">{{ t }}</option>
        </select>
        <input v-model="q" placeholder="Search title/details" />
      </div>
      <table v-if="filtered.length" class="requests-table">
        <thead>
          <tr>
            <th @click="toggleSort('createdAt')">Created <span v-if="sortKey==='createdAt'">{{ sortDir==='desc'?'↓':'↑' }}</span></th>
            <th>Type</th>
            <th @click="toggleSort('title')">Title <span v-if="sortKey==='title'">{{ sortDir==='desc'?'↓':'↑' }}</span></th>
            <th>Status</th>
            <th>Priority</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in sorted" :key="r.id">
            <td>{{ formatDate(r.createdAt) }}</td>
            <td><span class="badge type">{{ r.type }}</span></td>
            <td>
              <div class="title">{{ r.title }}</div>
              <div v-if="r.details" class="details-preview">{{ truncate(r.details, 120) }}</div>
            </td>
            <td>
              <span class="badge status" :class="'st-'+r.status">{{ r.status }}</span>
            </td>
            <td>{{ r.priority || '-' }}</td>
            <td class="row-actions">
              <button v-if="canReview && r.status==='OPEN'" class="btn xs" @click="advance(r,'IN_REVIEW')">Review</button>
              <button v-if="canReview && r.status==='IN_REVIEW'" class="btn xs" @click="advance(r,'APPROVED')">Approve</button>
              <button v-if="canReview && ['OPEN','IN_REVIEW'].includes(r.status)" class="btn xs warn" @click="advance(r,'REJECTED')">Reject</button>
              <button v-if="canReview && r.status==='APPROVED'" class="btn xs" @click="advance(r,'FULFILLED')">Fulfill</button>
              <button v-if="canReview && ['FULFILLED','REJECTED'].includes(r.status)" class="btn xs" @click="advance(r,'CLOSED')">Close</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <dialog v-if="showCreate" open class="modal">
      <form class="modal-body" @submit.prevent="submitCreate">
        <h2>New Service Request</h2>
        <label>Type
          <select v-model="createForm.type" required>
            <option v-for="t in TYPE_ORDER" :key="t" :value="t">{{ t }}</option>
          </select>
        </label>
        <label>Title
          <input v-model="createForm.title" required maxlength="140" />
        </label>
        <label>Priority (1-5 optional)
          <input v-model.number="createForm.priority" min="1" max="5" type="number" />
        </label>
        <label>Details
          <textarea v-model="createForm.details" rows="6" placeholder="Describe the request, objectives, timelines, assets…" />
        </label>
        <div class="modal-actions">
          <button type="button" class="btn" @click="showCreate=false">Cancel</button>
          <button type="submit" class="btn primary" :disabled="creating">Submit</button>
        </div>
        <div v-if="createError" class="error small">{{ createError }}</div>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useCurrentOrg } from '@/composables/useCurrentOrg'
import { useHubAuth } from '@/composables/useHubAuth'
import { useHubServiceRequests } from '@/composables/useHubServiceRequests'
import type { Schema } from '../../../amplify/data/resource'

const { currentOrgId, organizations, setCurrentOrg } = useCurrentOrg()
const currentOrgIdLocal = ref<string | null | undefined>(currentOrgId.value)
const { has } = useHubAuth()
const { requests, loading, error, listByOrg, create, creating, updateStatus } = useHubServiceRequests()

const canRequest = computed(()=> has('HUB.REQUEST_SERVICE'))
// For now review handled by admin capability reuse; adjust mapping if needed
const canReview = computed(()=> has('HUB.MANAGE_ORG_USERS') || has('HUB.VIEW_DRAFT_FINDINGS'))

const STATUS_ORDER: Schema['ServiceRequestStatus']['type'][] = ['OPEN','IN_REVIEW','APPROVED','REJECTED','FULFILLED','CLOSED']
const TYPE_ORDER: Schema['ServiceRequestType']['type'][] = ['ENGAGEMENT','RETTEST','CONSULTING','REPORT_EXPORT','OTHER']

const statusFilter = ref('')
const typeFilter = ref('')
const q = ref('')
const sortKey = ref<'createdAt'|'title'>('createdAt')
const sortDir = ref<'asc'|'desc'>('desc')

function toggleSort(key: 'createdAt'|'title'){
  if (sortKey.value===key){ sortDir.value = sortDir.value==='asc'?'desc':'asc' } else { sortKey.value=key; sortDir.value='asc' }
}

function formatDate(dt?: string | null){ if (!dt) return '-'; return new Date(dt).toLocaleDateString() }
function truncate(s: string, n: number){ return s.length>n? s.slice(0,n-1)+'…': s }

const filtered = computed(()=> requests.value.filter((r: any) => {
  if (statusFilter.value && r.status!==statusFilter.value) return false
  if (typeFilter.value && r.type!==typeFilter.value) return false
  if (q.value){ const needle = q.value.toLowerCase(); if (!(r.title.toLowerCase().includes(needle) || (r.details||'').toLowerCase().includes(needle))) return false }
  return true
}))

const sorted = computed(()=> [...filtered.value].sort((a,b)=>{
  let av:any; let bv:any
  if (sortKey.value==='createdAt'){ av = a.createdAt || ''; bv = b.createdAt || '' }
  else { av = a.title.toLowerCase(); bv = b.title.toLowerCase() }
  if (av<bv) return sortDir.value==='asc'? -1:1
  if (av>bv) return sortDir.value==='asc'? 1:-1
  return 0
}))

function reload(){ listByOrg(currentOrgId.value) }
function changeOrg(){ setCurrentOrg(currentOrgIdLocal.value || null); reload() }

watch(()=>currentOrgId.value, (n)=>{ currentOrgIdLocal.value = n; listByOrg(n) })
onMounted(()=>{ listByOrg(currentOrgId.value) })

// Creation modal state
const showCreate = ref(false)
const createForm = ref<{ type: any; title: string; details: string; priority?: number | null }>({ type: 'ENGAGEMENT', title: '', details: '', priority: null })
const createError = ref<string|null>(null)

async function submitCreate(){
  if (!currentOrgId.value) return
  createError.value = null
  try {
    await create({ organizationId: currentOrgId.value, type: createForm.value.type, title: createForm.value.title, details: createForm.value.details, priority: createForm.value.priority||undefined })
    showCreate.value = false
    createForm.value = { type: 'ENGAGEMENT', title: '', details: '', priority: null }
  } catch (e:any){ createError.value = e.message || 'Failed to create request' }
}

async function advance(r: any, status: Schema['ServiceRequestStatus']['type']){
  try { await updateStatus(r.id, status) } catch (e:any){ /* surface minimal error handling */ alert(e.message || 'Update failed') }
}

</script>

<style scoped>
.hub-page { padding:1rem 1.25rem 2.5rem; color:var(--color-text,#e2e8f0); font-size:.8rem; }
.page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; }
.actions .btn { font-size:.7rem; }
.filters { display:flex; gap:.5rem; margin:.75rem 0 1rem; }
.filters select, .filters input { background:#1e293b; border:1px solid #334155; color:#e2e8f0; padding:.4rem .5rem; border-radius:6px; font-size:.7rem; }
.requests-table { width:100%; border-collapse:collapse; }
.requests-table th, .requests-table td { padding:.5rem .6rem; text-align:left; border-bottom:1px solid rgba(255,255,255,0.06); vertical-align:top; }
.requests-table th { font-weight:600; font-size:.65rem; text-transform:uppercase; letter-spacing:.5px; cursor:pointer; user-select:none; }
.requests-table tbody tr:hover { background:rgba(255,255,255,0.03); }
.badge { display:inline-block; padding:.15rem .45rem; border-radius:999px; background:#334155; font-size:.55rem; font-weight:600; letter-spacing:.5px; }
.badge.status.st-OPEN { background:#1e3a8a; color:#bfdbfe; }
.badge.status.st-IN_REVIEW { background:#7e22ce; color:#f3e8ff; }
.badge.status.st-APPROVED { background:#065f46; color:#a7f3d0; }
.badge.status.st-REJECTED { background:#7f1d1d; color:#fecaca; }
.badge.status.st-FULFILLED { background:#166534; color:#bbf7d0; }
.badge.status.st-CLOSED { background:#475569; color:#cbd5e1; }
.title { font-weight:600; }
.details-preview { font-size:.6rem; opacity:.7; margin-top:.15rem; }
.row-actions .btn { font-size:.55rem; padding:.3rem .45rem; margin-right:.25rem; }
.loading, .error, .empty { padding:1rem 0; }
.error { color:#f87171; }
.modal { border:none; background:rgba(0,0,0,0.55); position:fixed; inset:0; display:flex; align-items:flex-start; justify-content:center; padding-top:5vh; }
.modal-body { background:#0f172a; padding:1.25rem 1.5rem 1.5rem; border-radius:12px; width:min(640px,96%); box-shadow:0 4px 30px rgba(0,0,0,0.4); display:flex; flex-direction:column; gap:.75rem; }
.modal-body h2 { margin:0 0 .25rem; font-size:1rem; }
.modal-body label { display:flex; flex-direction:column; gap:.25rem; font-size:.65rem; text-transform:uppercase; letter-spacing:.5px; }
.modal-body input, .modal-body textarea, .modal-body select { background:#1e293b; border:1px solid #334155; color:#e2e8f0; padding:.5rem .6rem; border-radius:8px; font-size:.7rem; }
.modal-actions { display:flex; justify-content:flex-end; gap:.5rem; margin-top:.25rem; }
.btn { background:#334155; border:none; color:#e2e8f0; padding:.5rem .9rem; border-radius:8px; cursor:pointer; font-weight:500; font-size:.7rem; }
.btn.primary { background:#2563eb; }
.btn.warn { background:#b91c1c; }
.btn.sm { font-size:.6rem; padding:.4rem .6rem; }
.btn.xs { font-size:.5rem; padding:.25rem .4rem; }
.btn:disabled { opacity:.5; cursor:not-allowed; }
.error.small { font-size:.6rem; }
.org-select { margin-bottom:1rem; display:flex; gap:.5rem; align-items:center; }
.org-select select { background:#1e293b; border:1px solid #334155; color:#e2e8f0; padding:.35rem .5rem; border-radius:6px; font-size:.7rem; }
</style>
