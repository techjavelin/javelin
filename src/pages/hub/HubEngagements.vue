<template>
  <DashboardLayout hideSidebarPadding>
    <template #sidebar>
      <HubSidebar />
    </template>
    <div class="hub-page">
      <div class="head-row">
        <div class="left-block">
          <h1 class="page-title">Engagements</h1>
          <p class="sub" v-if="!loading">{{ filtered.length }} of {{ engagements.length }} shown</p>
        </div>
        <div class="filters-row">
          <div class="org-select" v-if="orgs.length || orgsLoading">
            <label>
              <span class="lbl">Org</span>
              <select :disabled="orgsLoading" v-model="selectedOrgId">
                <option v-if="orgsLoading" value="">Loading...</option>
                <option v-for="o in orgs" :key="o.id" :value="o.id">{{ o.name }}</option>
              </select>
            </label>
          </div>
          <select v-model="phaseFilter" class="filter" title="Phase">
            <option value="">All Phases</option>
            <option v-for="p in PHASES" :key="p" :value="p">{{ p }}</option>
          </select>
          <select v-model="statusFilter" class="filter" title="Status">
            <option value="">All Status</option>
            <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
          </select>
          <input v-model="q" class="search" placeholder="Search title/code" />
        </div>
      </div>

      <div v-if="error" class="error-box">
        <p class="err-msg">{{ error }}</p>
        <button class="retry" @click="reload">Retry</button>
      </div>

      <div v-if="loading" class="loading">Loading engagements…</div>
      <div v-else>
        <table v-if="filtered.length" class="eng-table">
          <thead>
            <tr>
              <th @click="toggleSort('title')">Title <span v-if="sortKey==='title'">{{ sortDir==='asc'?'↑':'↓' }}</span></th>
              <th @click="toggleSort('code')">Code <span v-if="sortKey==='code'">{{ sortDir==='asc'?'↑':'↓' }}</span></th>
              <th>Phase</th>
              <th>Status</th>
              <th @click="toggleSort('startDate')">Start <span v-if="sortKey==='startDate'">{{ sortDir==='asc'?'↑':'↓' }}</span></th>
              <th @click="toggleSort('endDate')">End <span v-if="sortKey==='endDate'">{{ sortDir==='asc'?'↑':'↓' }}</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in sorted" :key="e.id" @click="$router.push(`/hub/engagements/${e.id}`)">
              <td class="title-cell">{{ e.title }}</td>
              <td><code class="code">{{ e.code }}</code></td>
              <td><span class="badge phase">{{ e.phase || 'N/A' }}</span></td>
              <td><span class="badge status" :class="e.status?.toLowerCase()">{{ e.status }}</span></td>
              <td>{{ formatDate(e.startDate) }}</td>
              <td>{{ formatDate(e.endDate) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="empty">No engagements match current filters.</p>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import HubSidebar from '@/components/hub/HubSidebar.vue'
import { ref, onMounted, watch, computed } from 'vue'
import { useHubEngagements } from '@/composables/useHubEngagements'
import { useCurrentOrg } from '@/composables/useCurrentOrg'

const { engagements, loading, error, listByOrg } = useHubEngagements()
const { currentOrgId, organizations: orgs, orgsLoading, setCurrentOrg } = useCurrentOrg()
const selectedOrgId = ref<string | null>(currentOrgId.value)

// Filters & sorting
const phaseFilter = ref('')
const statusFilter = ref('')
const q = ref('')
const sortKey = ref<'title'|'code'|'startDate'|'endDate'>('title')
const sortDir = ref<'asc'|'desc'>('asc')
const PHASES = ['PLANNING','RECON','TESTING','REPORTING','REMEDIATION','CLOSED']
const STATUSES = ['ACTIVE','ON_HOLD','COMPLETED','CANCELLED']

const filtered = computed(()=> engagements.value.filter(e => {
  if (phaseFilter.value && e.phase !== phaseFilter.value) return false
  if (statusFilter.value && e.status !== statusFilter.value) return false
  if (q.value){ const n = q.value.toLowerCase(); if (!(e.title.toLowerCase().includes(n) || e.code.toLowerCase().includes(n))) return false }
  return true
}))

const sorted = computed(()=> [...filtered.value].sort((a:any,b:any)=>{
  const ak = a[sortKey.value] || ''
  const bk = b[sortKey.value] || ''
  if (ak<bk) return sortDir.value==='asc' ? -1 : 1
  if (ak>bk) return sortDir.value==='asc' ? 1 : -1
  return 0
}))

function toggleSort(k: typeof sortKey.value){
  if (sortKey.value===k){ sortDir.value = sortDir.value==='asc'?'desc':'asc' } else { sortKey.value = k; sortDir.value='asc' }
}

function formatDate(d?: string | null){ if (!d) return '-'; return new Date(d).toLocaleDateString() }

watch(selectedOrgId, (val) => { setCurrentOrg(val); reload() })
watch(currentOrgId, (id) => { if (id && selectedOrgId.value !== id) selectedOrgId.value = id })

function reload(){ listByOrg(selectedOrgId.value || undefined) }
onMounted(()=>{ reload() })
</script>

<style scoped>
.hub-page { padding:1.25rem 1.4rem 2rem; display:flex; flex-direction:column; gap:1.25rem; }
.head-row { display:flex; align-items:center; justify-content:space-between; }
.page-title { font-size:1rem; margin:0; }
.org-select label { display:flex; align-items:center; gap:.4rem; font-size:.55rem; letter-spacing:.05em; }
.org-select select { background:#1e293b; border:1px solid rgba(255,255,255,0.15); color:#fff; font-size:.6rem; padding:.3rem .45rem; border-radius:6px; }
.eng-list { display:grid; gap:.6rem; }
.eng-item { background:var(--color-card,#1e293b); border:1px solid rgba(255,255,255,0.05); padding:.75rem .85rem; border-radius:10px; display:flex; flex-direction:column; gap:.4rem; cursor:pointer; }
.eng-item:hover { background:var(--color-card-hover,#24324a); }
.line1 { display:flex; align-items:center; gap:.5rem; font-size:.75rem; }
.name { font-weight:600; }
.code { font-size:.55rem; opacity:.55; letter-spacing:.06em; }
.meta { display:flex; gap:.75rem; font-size:.6rem; opacity:.75; }
.status { background:rgba(255,255,255,0.08); padding:.15rem .4rem; border-radius:6px; font-size:.55rem; letter-spacing:.05em; }
.empty { font-size:.65rem; opacity:.6; margin:0; }
.loading { font-size:.7rem; opacity:.7; }
.error-box { background:#3f1f23; border:1px solid #7f2f37; padding:.6rem .75rem; border-radius:8px; }
.err-msg { margin:0 0 .4rem; font-size:.6rem; letter-spacing:.04em; }
.retry { background:#7f2f37; border:none; color:#fff; font-size:.55rem; letter-spacing:.05em; padding:.35rem .6rem; border-radius:6px; cursor:pointer; }
</style>
