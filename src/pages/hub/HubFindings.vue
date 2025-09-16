<template>
  <DashboardLayout hideSidebarPadding>
    <template #sidebar>
      <HubSidebar />
    </template>
    <div class="hub-page">
      <h1 class="page-title">Findings</h1>
      <div class="filters-row">
        <div class="filter-col">
          <label class="lbl">Severity
            <select v-model="severityFilter">
              <option value="">All</option>
              <option v-for="s in severities" :key="s" :value="s">{{ s.charAt(0) + s.slice(1).toLowerCase() }}</option>
            </select>
          </label>
        </div>
        <div class="filter-col">
          <label class="lbl">Engagement
            <select v-model="engagementFilter">
              <option value="">All</option>
              <option v-for="e in engagementOptions" :key="e.id" :value="e.id">{{ e.title }}</option>
            </select>
          </label>
        </div>
        <div class="filter-col">
          <label class="lbl">Application
            <select v-model="applicationFilter">
              <option value="">All</option>
              <option v-for="a in applicationOptions" :key="a" :value="a">{{ a }}</option>
            </select>
          </label>
        </div>
        <div class="filter-col">
          <label class="lbl">Sort
            <select v-model="sortKey">
              <option value="recent">Most Recent</option>
              <option value="severity">Severity</option>
              <option value="title">Title</option>
            </select>
          </label>
        </div>
      </div>

      <div v-if="error" class="error-box"><p class="err-msg">{{ error }}</p><button class="retry" @click="reload">Retry</button></div>

      <div class="finding-list" v-if="!loading">
        <div class="finding-item" v-for="f in sortedFiltered" :key="f.id">
          <div class="top-line">
            <span class="sev" :class="f.severity.toLowerCase()">{{ f.severity }}</span>
            <span class="title">{{ f.title }}</span>
            <span class="meta" v-if="f.engagementTitle">{{ f.engagementTitle }}</span>
          </div>
          <p class="desc">{{ truncate(f.description || undefined) }}</p>
          <div class="tags-row">
            <span class="tag app" v-if="f.applicationId">App: {{ f.applicationId }}</span>
            <span class="tag code" v-if="f.engagementCode">{{ f.engagementCode }}</span>
          </div>
        </div>
        <p v-if="sortedFiltered.length===0" class="empty">No findings match filters.</p>
      </div>
      <div v-else class="loading">Loading...</div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import HubSidebar from '@/components/hub/HubSidebar.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { generateClient } from 'aws-amplify/data'
import { withAuth } from '@/amplifyClient'
import type { Schema } from '../../../amplify/data/resource'
import { useCurrentOrg } from '@/composables/useCurrentOrg'
import { useHubEngagements } from '@/composables/useHubEngagements'

// We aggregate published findings across org's engagements. For now we fetch per engagement sequentially.
// Future optimization: backend index or custom resolver for org-level published findings.

type HubFinding = Schema['VulnerabilityFinding']['type'] & { engagementTitle?: string; engagementCode?: string }
const client = generateClient<Schema>()

const findings = ref<HubFinding[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const severityFilter = ref('')
const engagementFilter = ref('')
const applicationFilter = ref('')
const sortKey = ref<'recent'|'severity'|'title'>('recent')

const severities = ['CRITICAL','HIGH','MEDIUM','LOW','INFO']

const { currentOrgId } = useCurrentOrg()
const { engagements, listByOrg } = useHubEngagements()

const engagementOptions = computed(()=> engagements.value.map(e => ({ id: e.id, title: e.title })))
const applicationOptions = computed(()=> {
  const set = new Set<string>()
  findings.value.forEach(f => { if (f.applicationId) set.add(f.applicationId) })
  return Array.from(set).sort()
})

const filtered = computed(()=> findings.value.filter(f =>
  (!severityFilter.value || f.severity === severityFilter.value) &&
  (!engagementFilter.value || f.engagementId === engagementFilter.value) &&
  (!applicationFilter.value || f.applicationId === applicationFilter.value)
))

const severityRank: Record<string, number> = { CRITICAL: 5, HIGH:4, MEDIUM:3, LOW:2, INFO:1 }
const sortedFiltered = computed(()=> {
  const arr = [...filtered.value]
  switch (sortKey.value) {
    case 'severity': return arr.sort((a,b)=> (severityRank[b.severity]||0) - (severityRank[a.severity]||0) || (b.cvssScore||0) - (a.cvssScore||0))
    case 'title': return arr.sort((a,b)=> a.title.localeCompare(b.title))
    case 'recent':
    default: return arr.sort((a,b)=> new Date(b.reportedAt||'').getTime() - new Date(a.reportedAt||'').getTime())
  }
})

async function loadFindings(){
  if (!currentOrgId.value) { findings.value = []; return }
  loading.value = true; error.value = null; findings.value = []
  try {
    await listByOrg(currentOrgId.value)
    for (const eng of engagements.value){
  const { data } = await client.models.VulnerabilityFinding.list(withAuth({ filter: { engagementId: { eq: eng.id }, publicationStatus: { eq: 'PUBLISHED' } } }))
      ;(data||[]).forEach(f => findings.value.push({ ...(f as any), engagementTitle: eng.title, engagementCode: eng.code }))
    }
  } catch (e:any){ error.value = e.message || 'Failed to load findings' }
  finally { loading.value = false }
}

function reload(){ loadFindings() }

watch(currentOrgId, () => { reload() })

onMounted(()=> { reload() })

function truncate(text?: string, max=220){ if (!text) return ''; if (text.length <= max) return text; return text.slice(0,max-1)+'…' }
</script>

<style scoped>
.hub-page { padding:1.25rem 1.4rem 2rem; display:flex; flex-direction:column; gap:1.1rem; }
.page-title { font-size:1rem; margin:0; }
.filters-row { display:flex; flex-wrap:wrap; gap:.75rem; }
.filter-col { display:flex; flex-direction:column; }
.lbl { font-size:.55rem; letter-spacing:.05em; text-transform:uppercase; opacity:.7; display:flex; flex-direction:column; gap:.3rem; }
select { background:#1e293b; border:1px solid rgba(255,255,255,0.12); color:#e2e8f0; padding:.45rem .6rem; border-radius:8px; font-size:.65rem; }
.finding-list { display:flex; flex-direction:column; gap:.65rem; }
.finding-item { background:var(--color-card,#1e293b); border:1px solid rgba(255,255,255,0.06); padding:.75rem .85rem; border-radius:10px; display:flex; flex-direction:column; gap:.4rem; }
.top-line { display:flex; align-items:center; gap:.6rem; font-size:.7rem; flex-wrap:wrap; }
.title { font-weight:600; }
.meta { font-size:.5rem; letter-spacing:.05em; opacity:.55; background:rgba(255,255,255,0.06); padding:.2rem .4rem; border-radius:5px; }
.sev { font-size:.55rem; padding:.2rem .45rem; border-radius:6px; letter-spacing:.05em; font-weight:600; background:#334155; }
.sev.critical { background:#991b1b; color:#fff; }
.sev.high { background:#b45309; color:#fff; }
.sev.medium { background:#92400e; color:#fff; }
.sev.low { background:#1e40af; color:#fff; }
.sev.info { background:#475569; color:#fff; }
.desc { margin:0; font-size:.6rem; opacity:.75; line-height:1.35; }
.tags-row { display:flex; gap:.5rem; flex-wrap:wrap; }
.tag { font-size:.5rem; letter-spacing:.05em; background:rgba(255,255,255,0.07); padding:.25rem .4rem; border-radius:6px; }
.tag.code { background:#24324a; }
.tag.app { background:#2d3b52; }
.empty { margin:0; font-size:.6rem; opacity:.65; }
.loading { font-size:.7rem; opacity:.7; }
.error-box { background:#3f1f23; border:1px solid #7f2f37; padding:.6rem .75rem; border-radius:8px; }
.err-msg { margin:0 0 .4rem; font-size:.6rem; letter-spacing:.04em; }
.retry { background:#7f2f37; border:none; color:#fff; font-size:.55rem; letter-spacing:.05em; padding:.35rem .6rem; border-radius:6px; cursor:pointer; }
</style>
