<template>
  <DashboardLayout hideSidebarPadding>
    <template #sidebar><HubSidebar /></template>
    <div class="hub-page">
      <div class="head-row">
  <h1 class="page-title">Documents</h1>
        <div class="org-select" v-if="organizations.length || orgsLoading">
          <select v-model="selectedOrgId" :disabled="orgsLoading">
            <option v-if="orgsLoading" value="">Loading…</option>
            <option v-for="o in organizations" :key="o.id" :value="o.id">{{ o.name }}</option>
          </select>
        </div>
      </div>
      <div class="filters">
        <input v-model="q" placeholder="Search name" />
      </div>
  <div v-if="loading" class="loading">Loading documents…</div>
      <div v-else-if="error" class="error-box"><p class="err-msg">{{ error }}</p><button class="retry" @click="reload">Retry</button></div>
      <div v-else>
        <table v-if="filtered.length" class="art-table">
          <thead>
            <tr><th>Name</th><th>Description</th><th>Type</th><th>Size</th><th>Updated</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="a in filtered" :key="a.id">
              <td class="name">{{ a.name }}</td>
              <td class="desc">{{ a.description || '-' }}</td>
              <td>{{ a.contentType || '-' }}</td>
              <td>{{ humanSize(a.size) }}</td>
              <td>{{ formatDate(a.updatedAt || a.createdAt) }}</td>
              <td class="actions"><button class="dl" @click="download(a)" :disabled="downloadingId===a.id">{{ downloadingId===a.id ? '...' : 'Download' }}</button></td>
            </tr>
          </tbody>
        </table>
  <p v-else class="empty">No documents match filters.</p>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import HubSidebar from '@/components/hub/HubSidebar.vue'
import { useHubArtifacts } from '@/composables/useHubArtifacts'
import { useCurrentOrg } from '@/composables/useCurrentOrg'

const { artifacts, loading, error, listByOrg } = useHubArtifacts()
const { currentOrgId, organizations, orgsLoading, setCurrentOrg } = useCurrentOrg()
const selectedOrgId = ref<string | null>(currentOrgId.value)

const q = ref('')
const downloadingId = ref<string | null>(null)
const filtered = computed(()=> artifacts.value.filter(a => {
  if (q.value){ const n = q.value.toLowerCase(); if (!a.name.toLowerCase().includes(n)) return false }
  return true
}))

watch(selectedOrgId, (id)=>{ setCurrentOrg(id); reload() })
watch(currentOrgId, (id)=>{ if (id && selectedOrgId.value!==id) selectedOrgId.value = id })

function reload(){ listByOrg(selectedOrgId.value || undefined) }
function formatDate(d?: string | null){ if (!d) return '-'; return new Date(d).toLocaleDateString() }
function humanSize(bytes?: number | null){
  if (!bytes && bytes!==0) return '-'
  const sizes = ['B','KB','MB','GB']
  let v = bytes; let i=0; while (v>=1024 && i < sizes.length-1){ v/=1024; i++ }
  return `${v.toFixed(v<10 && i>0 ? 1:0)} ${sizes[i]}`
}
async function download(a: any){
  if (!a.storageKey) return
  try {
    downloadingId.value = a.id
    // TODO: Implement signed URL retrieval & trigger browser download (deferred until upload modal in place)
  } finally { downloadingId.value = null }
}

onMounted(()=> reload())
</script>

<style scoped>
.hub-page { padding:1.25rem 1.4rem 2rem; display:flex; flex-direction:column; gap:1rem; }
.head-row { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:.75rem; }
.filters { display:flex; gap:.5rem; flex-wrap:wrap; }
select, input { background:#1e293b; border:1px solid rgba(255,255,255,0.12); color:#fff; font-size:.6rem; padding:.4rem .55rem; border-radius:6px; }
.art-table { width:100%; border-collapse:collapse; font-size:.6rem; }
.art-table th, .art-table td { text-align:left; padding:.5rem .6rem; border-bottom:1px solid rgba(255,255,255,0.08); }
.art-table tbody tr:hover { background:rgba(255,255,255,0.05); }
.badge.st { background:#334155; padding:.2rem .45rem; border-radius:999px; font-size:.5rem; }
.empty { font-size:.65rem; opacity:.6; }
.loading { font-size:.7rem; opacity:.7; }
.error-box { background:#3f1f23; border:1px solid #7f2f37; padding:.6rem .75rem; border-radius:8px; }
.err-msg { margin:0 0 .4rem; font-size:.6rem; }
.retry { background:#7f2f37; border:none; color:#fff; font-size:.55rem; padding:.35rem .6rem; border-radius:6px; cursor:pointer; }
</style>
