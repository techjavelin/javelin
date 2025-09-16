<template>
  <DashboardLayout hideSidebarPadding>
    <template #sidebar><HubSidebar /></template>
    <div class="hub-page">
      <div class="head-row">
        <h1 class="page-title">Artifacts</h1>
        <div class="org-select" v-if="organizations.length || orgsLoading">
          <select v-model="selectedOrgId" :disabled="orgsLoading">
            <option v-if="orgsLoading" value="">Loading…</option>
            <option v-for="o in organizations" :key="o.id" :value="o.id">{{ o.name }}</option>
          </select>
        </div>
      </div>
      <div class="filters">
        <select v-model="providerFilter">
          <option value="">All Providers</option>
          <option v-for="p in PROVIDERS" :key="p" :value="p">{{ p }}</option>
        </select>
        <select v-model="docTypeFilter">
          <option value="">All Doc Types</option>
          <option v-for="d in DOC_TYPES" :key="d" :value="d">{{ d }}</option>
        </select>
        <input v-model="q" placeholder="Search name" />
      </div>
      <div v-if="loading" class="loading">Loading artifacts…</div>
      <div v-else-if="error" class="error-box"><p class="err-msg">{{ error }}</p><button class="retry" @click="reload">Retry</button></div>
      <div v-else>
        <table v-if="filtered.length" class="art-table">
          <thead>
            <tr><th>Name</th><th>Provider</th><th>Type</th><th>Status</th><th>Updated</th></tr>
          </thead>
            <tbody>
              <tr v-for="a in filtered" :key="a.id">
                <td class="name">{{ a.name }}</td>
                <td>{{ a.provider }}</td>
                <td>{{ a.documentType || '-' }}</td>
                <td><span class="badge st" :class="(a.status||'').toLowerCase()">{{ a.status || '-' }}</span></td>
                <td>{{ formatDate(a.updatedAt || a.createdAt) }}</td>
              </tr>
            </tbody>
        </table>
        <p v-else class="empty">No artifacts match filters.</p>
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

const providerFilter = ref('')
const docTypeFilter = ref('')
const q = ref('')
const PROVIDERS = ['PANDADOC','QUICKBOOKS','OTHER']
const DOC_TYPES = ['NDA','SOW','RULES_OF_ENGAGEMENT','ESTIMATE','OTHER']

const filtered = computed(()=> artifacts.value.filter(a => {
  if (providerFilter.value && a.provider !== providerFilter.value) return false
  if (docTypeFilter.value && a.documentType !== docTypeFilter.value) return false
  if (q.value){ const n = q.value.toLowerCase(); if (!a.name.toLowerCase().includes(n)) return false }
  return true
}))

watch(selectedOrgId, (id)=>{ setCurrentOrg(id); reload() })
watch(currentOrgId, (id)=>{ if (id && selectedOrgId.value!==id) selectedOrgId.value = id })

function reload(){ listByOrg(selectedOrgId.value || undefined) }
function formatDate(d?: string | null){ if (!d) return '-'; return new Date(d).toLocaleDateString() }

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
