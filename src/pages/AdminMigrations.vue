<template>
  <DashboardLayout>
    <template #header>
      <h1 class="dashboard-title">Migrations</h1>
    </template>
    <section class="migration-admin">
      <div class="controls">
        <button class="action-btn" :disabled="running" @click="onRun">{{ running ? 'Running…' : 'Run Pending' }}</button>
        <button class="action-btn takeover" v-if="lockStale" :disabled="running" @click="onTakeoverRun">{{ running ? 'Running…' : 'Take Over Lock & Run' }}</button>
        <button class="secondary-btn" :disabled="loading" @click="loadState">Refresh</button>
        <span class="version">Code Latest: {{ latestCodeVersion }} | Applied Latest: {{ latestApplied ?? '—' }}</span>
      </div>
      <div v-if="error" class="error-box">{{ error }}</div>
      <div class="status-cards">
        <div class="card">
          <h3>Lock</h3>
          <p v-if="lockInfo">Acquired: {{ lockInfo.acquiredAt }}<br/>Expires: {{ lockInfo.expiresAt ? formatEpoch(lockInfo.expiresAt) : '—' }}<br/><span v-if="lockStale" class="stale">(STALE)</span></p>
          <p v-else>No lock present.</p>
        </div>
        <div class="card">
          <h3>Last Run Summary</h3>
          <p v-if="lastRunSummary">Applied {{ lastRunSummary.applied }} / {{ lastRunSummary.attempted }}; Skipped {{ lastRunSummary.skipped }} <span v-if="lastRunSummary.failed" class="error">Failed at {{ lastRunSummary.failed.id }}</span><br/>At: {{ lastRunAt || '—' }}</p>
          <p v-else>None this session.</p>
        </div>
      </div>
      <h2>Applied Migrations</h2>
      <div class="pagination-bar" v-if="appliedList.length">
        <label>Page Size
          <select v-model.number="pageSize">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
        </label>
        <div class="pager">
          <button :disabled="page===1" @click="page=1">«</button>
          <button :disabled="page===1" @click="page--">‹</button>
          <span>Page {{ page }} / {{ totalPages }}</span>
          <button :disabled="page===totalPages" @click="page++">›</button>
            <button :disabled="page===totalPages" @click="page=totalPages">»</button>
        </div>
        <span class="count">Showing {{ pagedMigs.length }} of {{ appliedList.length }}</span>
      </div>
      <table class="migs-table" v-if="appliedList.length">
        <thead><tr><th>ID</th><th>Name</th><th>Applied At</th><th>Checksum</th></tr></thead>
        <tbody>
          <tr v-for="m in pagedMigs" :key="m.id">
            <td>{{ m.id }}</td>
            <td>{{ m.name }}</td>
            <td>{{ m.appliedAt }}</td>
            <td>{{ m.checksum }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="placeholder" v-if="!loading">No migrations recorded.</p>
      <div class="logs" v-if="logs.length">
        <h3>Run Logs</h3>
        <pre><code>{{ logs.join('\n') }}</code></pre>
      </div>
    </section>
  </DashboardLayout>
</template>
<script setup lang="ts">
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { useMigrations } from '../composables/useMigrations'
import { onMounted, computed, ref, watch } from 'vue'
import { useToasts } from '../composables/useToasts'

const { latestCodeVersion, latestApplied, appliedList, lockInfo, loading, running, error, logs, lastRunSummary, lastRunAt, fetchState, runPending } = useMigrations()

const page = ref(1)
const pageSize = ref(20)
const totalPages = computed(()=> Math.max(1, Math.ceil(appliedList.value.length / pageSize.value)))
const pagedMigs = computed(()=> {
  const start = (page.value - 1) * pageSize.value
  return appliedList.value.slice(start, start + pageSize.value)
})
watch([appliedList, pageSize], ()=> { if(page.value > totalPages.value) page.value = totalPages.value })

function loadState(){ fetchState() }
const { add: pushToast } = useToasts()
async function onRun(){
  if(running.value) return
  const before = latestApplied.value
  await runPending()
  await fetchState()
  if(error.value){
    pushToast({ message: 'Migration run failed', type: 'error' })
  } else if((latestApplied.value||0) > (before||0)) {
    pushToast({ message: 'Migrations applied successfully', type: 'success' })
  } else {
    pushToast({ message: 'No pending migrations', type: 'info', duration: 2500 })
  }
}
async function onTakeoverRun(){
  if(running.value) return
  const before = latestApplied.value
  await runPending({ takeover: true })
  await fetchState()
  if(error.value){
    pushToast({ message: 'Takeover run failed', type: 'error' })
  } else if((latestApplied.value||0) > (before||0)) {
    pushToast({ message: 'Takeover applied pending migrations', type: 'success' })
  } else {
    pushToast({ message: 'No migrations applied (after takeover)', type: 'info', duration: 2500 })
  }
}

onMounted(()=> { fetchState() })

const lockStale = computed(()=> {
  if(!lockInfo.value?.expiresAt) return false
  const exp = parseInt(lockInfo.value.expiresAt,10)
  return Date.now()/1000 > exp
})

function formatEpoch(n:string){
  const ms = parseInt(n,10)*1000
  if(isNaN(ms)) return '—'
  return new Date(ms).toISOString()
}
</script>
<style scoped>
.migration-admin { padding:1rem; display:flex; flex-direction:column; gap:1.25rem; }
.controls { display:flex; gap:0.75rem; align-items:center; flex-wrap:wrap; }
.action-btn { background:#2563eb; color:#fff; border:none; padding:0.5rem 0.9rem; border-radius:4px; cursor:pointer; }
.secondary-btn { background:#eee; border:1px solid #ccc; padding:0.45rem 0.8rem; border-radius:4px; cursor:pointer; }
.version { font-size:0.8rem; opacity:0.7; }
.error-box { background:#fee2e2; color:#b91c1c; padding:0.5rem 0.75rem; border-radius:4px; }
.status-cards { display:flex; gap:1rem; flex-wrap:wrap; }
.card { background:#fff; border:1px solid #e5e7eb; border-radius:6px; padding:0.75rem 1rem; min-width:220px; }
.migs-table { width:100%; border-collapse:collapse; }
.migs-table th, .migs-table td { border:1px solid #e5e7eb; padding:0.4rem 0.6rem; font-size:0.8rem; }
.placeholder { opacity:0.6; font-size:0.85rem; }
.logs pre { background:#111; color:#0f0; padding:0.75rem; font-size:0.7rem; border-radius:4px; max-height:240px; overflow:auto; }
.stale { color:#d97706; font-weight:600; }
.takeover { background:#d97706; }
</style>
