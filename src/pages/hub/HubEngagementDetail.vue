<template>
  <DashboardLayout hideSidebarPadding>
    <template #sidebar>
      <HubSidebar />
    </template>
  <div class="hub-page" v-if="loaded && !loadError">
      <div class="header">
        <div class="titles">
          <h1 class="title">{{ engagement?.name || 'Engagement' }}</h1>
          <p class="code" v-if="engagement">Code: {{ engagement.code }}</p>
        </div>
        <div class="badges">
          <span class="badge phase" v-if="engagement?.phase">{{ engagement.phase }}</span>
          <span class="badge status" :class="engagement?.status?.toLowerCase()" v-if="engagement?.status">{{ engagement.status }}</span>
        </div>
      </div>

      <div class="tabs">
        <button v-for="t in tabs" :key="t.key" :class="['tab', currentTab===t.key ? 'active':'']" @click="currentTab=t.key">{{ t.label }}</button>
      </div>

      <div class="tab-panels">
        <div v-if="currentTab==='overview'" class="panel-grid">
          <section v-if="engagementsLoading && !engagement" class="panel wide">
            <h3>Loading Engagement…</h3>
            <p class="placeholder">Fetching engagement details.</p>
          </section>
          <section class="panel wide">
            <h3>Executive Summary</h3>
            <div v-if="engagement?.executiveSummary" class="md" v-html="renderMd(engagement.executiveSummary)"></div>
            <p v-else class="placeholder">No executive summary provided.</p>
          </section>
          <section class="panel">
            <h3>Key Dates</h3>
            <ul class="kv">
              <li><span>Start</span><strong>{{ formatDate(engagement?.startDate) }}</strong></li>
              <li><span>End</span><strong>{{ formatDate(engagement?.endDate) }}</strong></li>
              <li><span>Loaded</span><strong>{{ formatDateTime(new Date().toISOString()) }}</strong></li>
            </ul>
          </section>
          <section class="panel">
            <h3>Severity Distribution</h3>
            <div class="sev-bars" v-if="sevTotals.grand > 1 || sevTotals.totals.CRITICAL || sevTotals.totals.HIGH || sevTotals.totals.MEDIUM || sevTotals.totals.LOW || sevTotals.totals.INFO">
              <template v-for="s in sevOrder" :key="s">
                <div class="sev-bar" v-if="sevTotals.totals[s]">
                  <span class="lbl">{{ s }}</span>
                  <div class="bar"><div class="fill" :class="s.toLowerCase()" :style="{ width: ((sevTotals.totals[s]/sevTotals.grand)*100).toFixed(1)+'%' }"></div></div>
                  <span class="count">{{ sevTotals.totals[s] }}</span>
                </div>
              </template>
              <p v-if="!findings.length" class="placeholder">No findings yet.</p>
            </div>
            <p v-else class="placeholder">No findings data.</p>
          </section>
          <section class="panel">
            <h3>Participants</h3>
            <div v-if="canManage" class="actions-line"><button class="mini-btn" @click="showParticipantsModal=true">Manage</button></div>
            <div v-if="participantsError" class="error-box small"><p class="err-msg">{{ participantsError }}</p></div>
            <div v-else-if="participantsLoading" class="loading small">Loading participants…</div>
            <template v-else>
              <ul v-if="participants.length" class="participants">
                <li v-for="p in participants" :key="p.userId">
                  <span class="avatar" :title="p.userId">{{ p.userId.slice(0,2).toUpperCase() }}</span>
                  <span class="pid">{{ p.userId }}</span>
                  <span class="prole">{{ p.role }}</span>
                </li>
              </ul>
              <p v-else class="placeholder">No participants assigned.</p>
            </template>
          </section>
          <section class="panel">
            <h3>Documents</h3>
            <div v-if="canManage" class="actions-line"><button class="mini-btn" @click="showArtifactModal=true">Upload</button></div>
            <div v-if="artifactsError" class="error-box small"><p class="err-msg">{{ artifactsError }}</p></div>
            <div v-else-if="artifactsLoading" class="loading small">Loading documents…</div>
            <template v-else>
              <ul v-if="artifacts.length" class="artifacts">
                <li v-for="a in artifacts.slice(0,5)" :key="a.id">
                  <span class="aname" :title="a.name || a.id">{{ a.name || a.id }}</span>
                  <span class="atype">{{ humanFileSize(a.size) }}</span>
                  <button class="mini-btn" @click="downloadArtifact(a)" :disabled="downloadingId===a.id">{{ downloadingId===a.id ? '...' : 'Download' }}</button>
                </li>
              </ul>
              <p v-else class="placeholder">No documents uploaded.</p>
              <div v-if="artifacts.length > 5" class="more-line"><button class="mini-btn" @click="currentTab='artifacts'">View all ({{ artifacts.length }})</button></div>
            </template>
          </section>
        </div>
        <div v-else-if="currentTab==='findings'" class="panel-grid">
          <section class="panel wide">
            <h3>Published Findings</h3>
            <div v-if="findingsError" class="error-box">
              <p class="err-msg">{{ findingsError }}</p>
              <button class="retry" @click="listPublished">Retry</button>
            </div>
            <div v-else-if="findingsLoading" class="loading small">Loading findings…</div>
            <div v-else class="findings-list">
              <div v-for="f in findings" :key="f.id" class="finding-item">
                <div class="top-row">
                  <span class="sev" :class="(f.severity||'').toLowerCase()">{{ f.severity || 'N/A' }}</span>
                  <h4 class="f-title">{{ f.title }}</h4>
                </div>
                <p class="desc" v-if="f.description">{{ truncate(f.description) }}</p>
              </div>
              <p v-if="!findings.length" class="placeholder">No published findings yet.</p>
            </div>
          </section>
        </div>
        <div v-else-if="currentTab==='artifacts'" class="panel-grid">
          <section class="panel wide">
            <h3>Documents</h3>
            <div class="actions-line" v-if="canManage"><button class="mini-btn" @click="showArtifactModal=true">Upload</button></div>
            <div v-if="artifactsError" class="error-box small"><p class="err-msg">{{ artifactsError }}</p></div>
            <div v-else-if="artifactsLoading" class="loading small">Loading documents…</div>
            <template v-else>
              <ul v-if="artifacts.length" class="artifacts big">
                <li v-for="a in artifacts" :key="a.id">
                  <span class="aname" :title="a.name || a.id">{{ a.name || a.id }}</span>
                  <span class="atype">{{ humanFileSize(a.size) }}</span>
                  <button class="mini-btn" @click="downloadArtifact(a)" :disabled="downloadingId===a.id">{{ downloadingId===a.id ? '...' : 'Download' }}</button>
                </li>
              </ul>
              <p v-else class="placeholder">No documents uploaded.</p>
            </template>
          </section>
        </div>
        <div v-else-if="currentTab==='activity'" class="panel-grid">
          <section class="panel wide">
            <h3>Activity</h3>
            <p class="placeholder">Audit trail placeholder.</p>
          </section>
        </div>
      </div>
    </div>
    <div v-else-if="!loadError" class="hub-page loading">Loading...</div>
    <div v-else class="hub-page">
      <div class="error-box"><p class="err-msg">{{ loadError }}</p><button class="retry" @click="reloadEngagement">Retry</button></div>
    </div>
  </DashboardLayout>
  <ManageParticipantsModal
    v-if="engagement"
    :open="showParticipantsModal"
    :engagement-id="engagement.id"
    :application-id="(engagement as any).applicationId || ''"
    :organization-id="(engagement as any).organizationId || currentOrgId || ''"
    @close="showParticipantsModal=false"
    @changed="onParticipantsChanged" />
  <LinkArtifactModal
    v-if="engagement"
    :open="showArtifactModal"
    :engagement-id="engagement.id"
    :organization-id="(engagement as any).organizationId || currentOrgId || ''"
    @close="showArtifactModal=false"
    @uploaded="onArtifactCreated" />
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import HubSidebar from '@/components/hub/HubSidebar.vue'
import { usePublishedFindings } from '@/composables/usePublishedFindings'
import { useHubEngagements } from '@/composables/useHubEngagements'
import { useCurrentOrg } from '@/composables/useCurrentOrg'
import { useHubArtifacts } from '@/composables/useHubArtifacts'
import { getUrl } from 'aws-amplify/storage'
import { humanFileSize, triggerBrowserDownload } from '@/utils/file'
import { useToasts } from '@/composables/useToasts'
import { useEngagementParticipants } from '@/composables/useEngagementParticipants'
// Temporary markdown renderer - could replace with a shared util later
import { marked } from 'marked'
import { useAuthorization } from '@/composables/useAuthorization'
import { useHubAuth } from '@/composables/useHubAuth'
import ManageParticipantsModal from '@/components/hub/ManageParticipantsModal.vue'
import LinkArtifactModal from '@/components/hub/LinkArtifactModal.vue'

interface HubEng { id:string; name:string; code:string; phase?:string; status?:string; executiveSummary?: string; startDate?: string; endDate?: string }
const route = useRoute()
const engagement = ref<HubEng | null>(null)
const loaded = ref(false)
const loadError = ref<string | null>(null)
const { currentOrgId } = useCurrentOrg()
const { engagements, listByOrg, loading: engagementsLoading, error: engagementsError } = useHubEngagements()

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'findings', label: 'Findings' },
  { key: 'artifacts', label: 'Documents' },
  { key: 'activity', label: 'Activity' }
]
const currentTab = ref('overview')

async function fetchEngagement(){
  loadError.value = null
  try {
    // Load engagements for org then pick by id (temporary until direct get available)
    await listByOrg(currentOrgId.value)
    const found = engagements.value.find(e => e.id === route.params.id)
    if (!found) throw new Error('Engagement not found or inaccessible')
    engagement.value = {
      id: found.id,
      name: (found as any).name || (found as any).title || 'Engagement',
      code: (found as any).code || found.id.slice(0,8).toUpperCase(),
      phase: (found as any).phase,
      status: (found as any).status,
      executiveSummary: (found as any).executiveSummary,
      startDate: (found as any).startDate,
      endDate: (found as any).endDate
    }
    loaded.value = true
  } catch (e:any){ loadError.value = e.message || 'Failed to load engagement' }
}

function reloadEngagement(){ loaded.value = false; fetchEngagement().then(()=> { listPublished(); loadArtifacts(); loadParticipants() }) }

onMounted(async () => { await fetchEngagement(); if (!loadError.value) { listPublished(); loadArtifacts(); loadParticipants() } })

// Findings
const { findings, loading: findingsLoading, error: findingsError, listByEngagement } = usePublishedFindings()
function listPublished(){ listByEngagement(route.params.id as string) }

// Artifacts
const { artifacts, loading: artifactsLoading, error: artifactsError, listByEngagement: listArtifacts } = useHubArtifacts()
function loadArtifacts(){ listArtifacts(route.params.id as string) }

// Participants
const { participants, loading: participantsLoading, error: participantsError, list: listParticipants } = useEngagementParticipants()
function loadParticipants(){ listParticipants(route.params.id as string) }

// Severity distribution (computed from findings)
const sevOrder = ['CRITICAL','HIGH','MEDIUM','LOW','INFO']
const sevTotals = computed(() => {
  const totals: Record<string, number> = { CRITICAL:0,HIGH:0,MEDIUM:0,LOW:0,INFO:0 }
  findings.value.forEach(f => {
    const sev = (f.severity || 'INFO').toUpperCase()
    if (totals[sev] == null) totals[sev] = 0
    totals[sev] += 1
  })
  const grand = Object.values(totals).reduce((a,b)=>a+b,0) || 1
  return { totals, grand }
})

// Helpers
function truncate(text: string, max = 180){ if (!text) return ''; if (text.length <= max) return text; return text.slice(0,max-1)+'…' }
function formatDate(value?: string){ if(!value) return '—'; const d=new Date(value); return d.toLocaleDateString() }
function formatDateTime(value?: string){ if(!value) return '—'; const d=new Date(value); return d.toLocaleString() }
function renderMd(md?: string){ if(!md) return ''; return marked.parse(md) }
// Authorization
const { has } = useAuthorization()
const { has: hubHas } = useHubAuth()
// Can upload artifacts if classic ENG/ORG manage OR hub capability explicitly granted
const canManage = computed(() =>
  has('ENG.MANAGE', { engagementId: route.params.id as string }) ||
  has('ORG.MANAGE', { organizationId: (engagement.value as any)?.organizationId || currentOrgId.value || '' }) ||
  hubHas('HUB.UPLOAD_ARTIFACT')
)
// Modal state
const showParticipantsModal = ref(false)
const showArtifactModal = ref(false)
const downloadingId = ref<string | null>(null)
function onParticipantsChanged(){ loadParticipants() }
function onArtifactCreated(){ loadArtifacts() }
const { add: addToast } = useToasts()
async function downloadArtifact(a: any){
  if (!a.storageKey) return
  try {
    downloadingId.value = a.id
    const { url } = await getUrl({ key: a.storageKey })
    triggerBrowserDownload(url.toString(), a.name || 'download')
    addToast({ message: `Downloading ${a.name || 'file'}…`, type: 'info', duration: 3000 })
  } catch (e:any){
    addToast({ message: `Download failed${e?.message ? ': '+e.message: ''}`, type: 'error' })
  } finally { downloadingId.value = null }
}
</script>

<style scoped>
.hub-page { padding:1.25rem 1.4rem 2rem; display:flex; flex-direction:column; gap:1.25rem; }
.header { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; flex-wrap:wrap; }
.title { margin:0; font-size:1rem; letter-spacing:.5px; }
.code { margin:.2rem 0 0; font-size:.6rem; opacity:.6; }
.badges { display:flex; gap:.5rem; flex-wrap:wrap; }
.badge { background:rgba(255,255,255,0.08); padding:.3rem .55rem; font-size:.55rem; letter-spacing:.05em; border-radius:8px; font-weight:600; }
.tabs { display:flex; gap:.4rem; border-bottom:1px solid rgba(255,255,255,0.08); }
.tab { background:transparent; border:none; padding:.65rem .9rem; font-size:.65rem; letter-spacing:.05em; cursor:pointer; color:#94a3b8; font-weight:500; position:relative; }
.tab.active { color:#fff; }
.tab.active:after { content:''; position:absolute; left:0; right:0; bottom:0; height:2px; background:#6366f1; border-radius:2px; }
.tab:hover { color:#fff; }
.tab-panels { display:flex; flex-direction:column; gap:1.2rem; }
.panel-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:1rem; }
.panel { background:var(--color-card,#1e293b); border:1px solid rgba(255,255,255,0.05); padding:1rem 1.1rem; border-radius:12px; display:flex; flex-direction:column; gap:.6rem; min-height:140px; }
.panel.wide { grid-column:1 / -1; }
.panel h3 { margin:0; font-size:.7rem; text-transform:uppercase; letter-spacing:.08em; opacity:.75; }
.placeholder { margin:0; font-size:.65rem; opacity:.6; }
.loading { font-size:.7rem; opacity:.7; }
.loading.small { font-size:.6rem; }
.findings-list { display:flex; flex-direction:column; gap:.6rem; }
.finding-item { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.05); padding:.6rem .7rem; border-radius:8px; display:flex; flex-direction:column; gap:.35rem; }
.f-title { margin:0; font-size:.65rem; font-weight:600; }
.desc { margin:0; font-size:.55rem; opacity:.7; line-height:1.2; }
.sev { font-size:.5rem; font-weight:600; letter-spacing:.05em; padding:.15rem .4rem; border-radius:5px; background:#334155; text-transform:uppercase; }
.sev.high { background:#7f1d1d; }
.sev.critical { background:#991b1b; }
.sev.medium { background:#9a6d20; }
.sev.low { background:#1e3a8a; }
.sev.info, .sev.informational { background:#1e3a5f; }
.top-row { display:flex; align-items:center; gap:.5rem; }
.error-box { background:#3f1f23; border:1px solid #7f2f37; padding:.6rem .75rem; border-radius:8px; }
.err-msg { margin:0 0 .4rem; font-size:.6rem; letter-spacing:.04em; }
.retry { background:#7f2f37; border:none; color:#fff; font-size:.55rem; letter-spacing:.05em; padding:.35rem .6rem; border-radius:6px; cursor:pointer; }
.md :where(p,ul,ol){ margin:.35rem 0; font-size:.6rem; line-height:1.25; }
.md h1,.md h2,.md h3 { font-size:.7rem; margin:.4rem 0 .3rem; letter-spacing:.06em; }
.kv { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:.4rem; }
.kv li { display:flex; justify-content:space-between; font-size:.55rem; background:rgba(255,255,255,0.04); padding:.35rem .5rem; border-radius:6px; }
.kv li span { opacity:.65; }
.sev-bars { display:flex; flex-direction:column; gap:.4rem; }
.sev-bar { display:flex; align-items:center; gap:.5rem; }
.sev-bar .lbl { width:55px; font-size:.5rem; letter-spacing:.05em; text-transform:uppercase; opacity:.7; }
.sev-bar .bar { flex:1; background:#1e293b; border:1px solid rgba(255,255,255,0.05); height:10px; border-radius:6px; overflow:hidden; }
.sev-bar .fill { height:100%; background:#334155; }
.sev-bar .fill.critical { background:#b91c1c; }
.sev-bar .fill.high { background:#dc2626; }
.sev-bar .fill.medium { background:#d97706; }
.sev-bar .fill.low { background:#2563eb; }
.sev-bar .fill.info { background:#475569; }
.sev-bar .count { font-size:.55rem; width:24px; text-align:right; }
.participants,.artifacts { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:.45rem; }
.participants li, .artifacts li { display:flex; align-items:center; gap:.5rem; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.05); padding:.4rem .55rem; border-radius:6px; font-size:.55rem; }
.avatar { width:22px; height:22px; border-radius:50%; background:#334155; display:flex; align-items:center; justify-content:center; font-size:.55rem; font-weight:600; letter-spacing:.05em; }
.prole { margin-left:auto; font-size:.5rem; background:#1e3a5f; padding:.2rem .4rem; border-radius:5px; letter-spacing:.05em; }
.atype { margin-left:auto; font-size:.5rem; background:#312e81; padding:.18rem .45rem; border-radius:5px; letter-spacing:.05em; }
.aname { flex:1; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
.error-box.small { padding:.45rem .55rem; }
.actions-line { display:flex; justify-content:flex-end; }
.mini-btn { background:#334155; border:1px solid rgba(255,255,255,0.12); color:#fff; font-size:.5rem; padding:.25rem .55rem; border-radius:5px; cursor:pointer; letter-spacing:.05em; }
.mini-btn:hover { background:#475569; }
</style>
