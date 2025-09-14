<template>
  <DashboardLayout>
    <template #header>
      <h1 class="dashboard-title">Engagements</h1>
    </template>
    <section class="engagements-section">
      <div class="toolbar">
        <div class="filters">
          <select v-model="phase" @change="refresh()">
            <option value="">All Phases</option>
            <option v-for="p in phases" :key="p" :value="p">{{ p }}</option>
          </select>
          <select v-model="status" @change="refresh()">
            <option value="">All Statuses</option>
            <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <router-link to="/pentester/engagements/new" class="new-btn">New Engagement</router-link>
      </div>
      <div v-if="loading" class="loading">Loading engagements...</div>
      <table v-else-if="rows.length" class="eng-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Title</th>
            <th>Phase</th>
            <th>Status</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in rows" :key="e.id" @click="openDetail(e.id)" class="row">
            <td>{{ e.code }}</td>
            <td>{{ e.title }}</td>
            <td><span class="badge phase">{{ e.phase }}</span></td>
            <td><span class="badge status" :data-status="e.status">{{ e.status }}</span></td>
            <td>{{ (e.updatedAt || e.createdAt || '').slice(0,10) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty">No engagements found.</p>
    </section>
  </DashboardLayout>
</template>
<script setup>
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { ref, computed, onMounted } from 'vue'
import { useEngagements } from '../composables/useEngagements'
import { useRouter } from 'vue-router'

const router = useRouter()
const { engagements, list, loading } = useEngagements()
const phase = ref('')
const status = ref('')
const phases = ['PLANNING','RECON','TESTING','REPORTING','REMEDIATION','CLOSED']
const statuses = ['ACTIVE','ON_HOLD','COMPLETED','CANCELLED']

function refresh(){
  list({ phase: phase.value || undefined, status: status.value || undefined })
}

const rows = computed(()=> engagements.value)

function openDetail(id){
  router.push(`/pentester/engagements/${id}`)
}

onMounted(()=> refresh())
</script>
<style scoped>
.engagements-section { padding:1.5rem; background:#181e2a; border-radius:12px; min-height:300px; }
.dashboard-title { font-size:2rem; font-weight:700; color:#fff; margin-bottom:1rem; }
.toolbar { display:flex; justify-content:space-between; flex-wrap:wrap; gap:.75rem; margin-bottom:1rem; }
.filters { display:flex; gap:.5rem; }
select { background:#1f2737; color:#e2e8f0; border:1px solid #2a364b; padding:.5rem .6rem; border-radius:8px; font-size:.8rem; }
.new-btn { background:#2563eb; color:#fff; text-decoration:none; padding:.6rem .9rem; border-radius:8px; font-size:.75rem; font-weight:500; letter-spacing:.04em; }
.new-btn:hover { background:#1d4ed8; }
.loading { color:#94a3b8; font-size:.85rem; }
.eng-table { width:100%; border-collapse:collapse; font-size:.78rem; }
.eng-table th { text-align:left; padding:.55rem .6rem; font-weight:600; color:#94a3b8; font-size:.7rem; letter-spacing:.05em; }
.eng-table td { padding:.6rem .6rem; border-top:1px solid #243048; color:#e2e8f0; }
.row { cursor:pointer; }
.row:hover { background:#1f2737; }
.badge { display:inline-block; padding:.25rem .45rem; border-radius:6px; font-size:.6rem; font-weight:600; letter-spacing:.05em; }
.badge.phase { background:#334155; color:#cbd5e1; }
.badge.status[data-status='ACTIVE'] { background:#166534; color:#dcfce7; }
.badge.status[data-status='ON_HOLD'] { background:#78350f; color:#fde68a; }
.badge.status[data-status='COMPLETED'] { background:#1e3a8a; color:#bfdbfe; }
.badge.status[data-status='CANCELLED'] { background:#7f1d1d; color:#fecaca; }
.empty { color:#64748b; font-size:.8rem; margin:0; }
@media (max-width:700px){ .eng-table th:nth-child(3), .eng-table td:nth-child(3), .eng-table th:nth-child(5), .eng-table td:nth-child(5){ display:none; } }
</style>
