<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useFindings } from '@/composables/useFindings'
import type { Schema } from '../../amplify/data/resource'
import { useAuthorization } from '@/composables/useAuthorization'
import { useToasts } from '@/composables/useToasts'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import { calculate, nextVector } from '@/services/cvss'
import { useVulnerabilityTemplates } from '@/composables/useVulnerabilityTemplates'
import { likelihoodFromVector, impactFromCvssBase, severityFrom, deriveSeverityData } from '@/services/risk'

interface Props {
  engagementId: string
  applicationId: string
  modelValue: boolean
  finding?: Schema['VulnerabilityFinding']['type'] | null
}
const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue','saved'])

const { has } = useAuthorization()
const { create, update } = useFindings()
const { add: addToast } = useToasts()

const local = ref<any>({
  title: '',
  severity: 'MEDIUM', // computed from likelihood + impactLevel if present
  impactLevel: '',
  likelihood: '',
  status: 'OPEN',
  publicationStatus: 'DRAFT',
  description: '',
  impact: '',
  reproduction: '',
  remediation: '',
  references: '',
  affectedAssets: '',
  cvssVector: '',
  cvssScore: undefined as number | undefined,
})

const mode = computed(() => props.finding ? 'edit' : 'create')
const canPublish = computed(() => has('ENG.UPDATE_FINDING',{ engagementId: props.engagementId }) && (local.value.publicationStatus === 'DRAFT'))

// Centralized risk derivation using deriveSeverityData helper
const riskResult = ref<{ likelihood?: string; impactLevel?: string; severity?: string }>({})
async function recomputeRisk() {
  const res = await deriveSeverityData({
    likelihood: local.value.likelihood || undefined,
    impactLevel: local.value.impactLevel || undefined,
    cvssVector: local.value.cvssVector || undefined
  })
  riskResult.value = res
  if (res.severity) local.value.severity = res.severity
}
watch(()=>[local.value.likelihood, local.value.impactLevel, local.value.cvssVector], ()=> { recomputeRisk() }, { immediate:true })

function recomputeCvss() {
  if (!local.value.cvssVector) { local.value.cvssScore = undefined; return }
  const res = calculate(local.value.cvssVector)
  if (res) {
    local.value.cvssScore = res.score
    // severity will be recalculated by watcher
  }
}

watch(()=>local.value.cvssVector, () => recomputeCvss())

watch(() => props.finding, (f) => {
  if (f) {
    local.value = {
      title: f.title,
      severity: f.severity,
      impactLevel: (f as any).impactLevel || '',
      likelihood: (f as any).likelihood || '',
      status: f.status,
      publicationStatus: f.publicationStatus,
      description: f.description || '',
      impact: f.impact || '',
      reproduction: f.reproduction || '',
      remediation: f.remediation || '',
      references: (f.references||[]).join('\n'),
      affectedAssets: (f.affectedAssets||[]).join('\n'),
      cvssVector: f.cvssVector || '',
      cvssScore: f.cvssScore,
    }
    recomputeCvss()
  } else {
    reset()
  }
},{ immediate: true })

function reset() {
  local.value = {
    title: '', severity: 'MEDIUM', impactLevel:'', likelihood:'', status: 'OPEN', publicationStatus: 'DRAFT', description: '', impact: '', reproduction: '', remediation: '', references: '', affectedAssets: '', cvssVector: '', cvssScore: undefined,
  }
}

const busy = ref(false)

// --- Template selection & auto-fill ---
const { templates, list: listTemplates, loading: loadingTemplates } = useVulnerabilityTemplates()
const templateQuery = ref('')
const debouncedQuery = ref('')
let tqTimer: any
watch(templateQuery,(v)=>{
  clearTimeout(tqTimer)
  tqTimer = setTimeout(()=> debouncedQuery.value = v, 200)
})
const showTemplateDropdown = ref(false)
const selectedTemplateId = ref<string>('')
const filteredTemplates = computed(()=>{
  const q = debouncedQuery.value.trim().toLowerCase()
  if (!q) return templates.value.slice(0, 12)
  return templates.value.filter(t => {
    const title = (t.title||'').toLowerCase()
    const tags = ((t.tags||[]) as (string|null)[]).filter(Boolean).map(x=> (x as string).toLowerCase())
    const desc = (t.description||'').toLowerCase()
    return title.includes(q) || desc.includes(q) || tags.some(tag => tag.includes(q))
  }).slice(0, 15)
})
const activeTemplateIndex = ref(-1)
watch(filteredTemplates,()=>{ activeTemplateIndex.value = filteredTemplates.value.length ? 0 : -1 })

function onTemplateKey(e: KeyboardEvent){
  if (!showTemplateDropdown.value) return
  if (e.key==='ArrowDown') { e.preventDefault(); if (filteredTemplates.value.length) activeTemplateIndex.value = (activeTemplateIndex.value+1) % filteredTemplates.value.length }
  else if (e.key==='ArrowUp') { e.preventDefault(); if (filteredTemplates.value.length) activeTemplateIndex.value = (activeTemplateIndex.value-1+filteredTemplates.value.length) % filteredTemplates.value.length }
  else if (e.key==='Enter') { if (activeTemplateIndex.value>=0) { applyTemplate(filteredTemplates.value[activeTemplateIndex.value]) } }
  else if (e.key==='Escape') { showTemplateDropdown.value = false }
}

function applyTemplate(t: any) {
  if (!t) return
  selectedTemplateId.value = t.id
  templateQuery.value = t.title
  // Overwrite fields with template content
  local.value.title = t.title || ''
  local.value.description = t.description || ''
  local.value.impact = t.impact || ''
  local.value.remediation = t.remediation || ''
  local.value.references = (t.references||[]).join('\n')
  local.value.cvssVector = t.cvssVector || ''
  local.value.likelihood = (t as any).likelihood || ''
  local.value.impactLevel = (t as any).impactLevel || ''
  // severity will update via watchers; recompute score
  recomputeCvss()
  showTemplateDropdown.value = false
}

function clearTemplate() {
  selectedTemplateId.value = ''
  templateQuery.value = ''
}

onMounted(()=>{
  if (mode.value === 'create' && !templates.value.length) {
    listTemplates()
  }
  if (mode.value === 'edit' && !templates.value.length) {
    listTemplates()
  }
})

const provenanceTemplate = computed(()=> {
  if (mode.value !== 'edit' || !props.finding?.templateId) return null
  return templates.value.find(t=> t.id === (props.finding as any).templateId) || null
})

// CVSS builder state & helpers
const showCvss = ref(false)
interface MetricDef { key: string; options: string[] }
interface MetricMeta { name: string; desc: string; values: Record<string,{ name:string; desc:string }> }
const metricDetails: Record<string, MetricMeta> = {
  AV: { name:'Attack Vector', desc:'Context by which vulnerability exploitation is possible.', values:{ N:{name:'Network',desc:'Accessible over a network.'}, A:{name:'Adjacent',desc:'Same shared physical/logic network.'}, L:{name:'Local',desc:'Requires local access or shell.'}, P:{name:'Physical',desc:'Physical interaction required.'} } },
  AC: { name:'Attack Complexity', desc:'Conditions beyond attacker control.', values:{ L:{name:'Low',desc:'No specialized conditions.'}, H:{name:'High',desc:'Specific conditions required.'} } },
  PR: { name:'Privileges Required', desc:'Level of privileges required for a successful attack.', values:{ N:{name:'None',desc:'No privileges needed.'}, L:{name:'Low',desc:'Basic user privileges.'}, H:{name:'High',desc:'Admin or powerful privileges.'} } },
  UI: { name:'User Interaction', desc:'Whether user interaction is required.', values:{ N:{name:'None',desc:'No user interaction required.'}, R:{name:'Required',desc:'User must participate.'} } },
  S: { name:'Scope', desc:'Whether exploitation affects resources beyond security scope.', values:{ U:{name:'Unchanged',desc:'Same security authority.'}, C:{name:'Changed',desc:'Impacts other components.'} } },
  C: { name:'Confidentiality', desc:'Impact on data confidentiality.', values:{ H:{name:'High',desc:'Total loss of protection.'}, L:{name:'Low',desc:'Some data disclosure.'}, N:{name:'None',desc:'No impact.'} } },
  I: { name:'Integrity', desc:'Impact on trust & correctness.', values:{ H:{name:'High',desc:'Complete loss of integrity.'}, L:{name:'Low',desc:'Modification possible.'}, N:{name:'None',desc:'No impact.'} } },
  A: { name:'Availability', desc:'Impact to availability of impacted component.', values:{ H:{name:'High',desc:'Total loss or shut down.'}, L:{name:'Low',desc:'Reduced performance.'}, N:{name:'None',desc:'No impact.'} } },
}
const metrics: MetricDef[] = Object.keys(metricDetails).map(k=>({ key:k, options:Object.keys(metricDetails[k].values) }))
function currentMetricValue(metric: string) {
  const segs = (local.value.cvssVector || '').split('/')
  for (const s of segs) { const [k,v] = s.split(':'); if (k===metric) return v }
  return ''
}
function applyMetric(metric: string, val: string){
  const segs: string[] = (local.value.cvssVector || '')
    .split('/')
    .filter((s: string) => !!s)
    .filter((s: string) => !s.startsWith(metric+':'))
  segs.push(`${metric}:${val}`)
  // maintain order
  const order = ['AV','AC','PR','UI','S','C','I','A']
  segs.sort((a: string, b: string)=> order.indexOf(a.split(':')[0]) - order.indexOf(b.split(':')[0]))
  local.value.cvssVector = segs.join('/')
  recomputeCvss()
}

async function save(publish = false) {
  if (!props.engagementId || !props.applicationId) return
  busy.value = true
  try {
    const base = {
      engagementId: props.engagementId,
      applicationId: props.applicationId,
      title: local.value.title,
  severity: local.value.severity,
  impactLevel: local.value.impactLevel || undefined,
  likelihood: local.value.likelihood || undefined,
      templateId: mode.value==='create' && selectedTemplateId.value ? selectedTemplateId.value : undefined,
      status: local.value.status,
      publicationStatus: publish ? 'PUBLISHED' : local.value.publicationStatus,
      description: local.value.description || undefined,
      impact: local.value.impact || undefined,
      reproduction: local.value.reproduction || undefined,
      remediation: local.value.remediation || undefined,
      references: local.value.references ? local.value.references.split(/\n+/).map((s:string)=>s.trim()).filter(Boolean) : undefined,
      affectedAssets: local.value.affectedAssets ? local.value.affectedAssets.split(/\n+/).map((s:string)=>s.trim()).filter(Boolean) : undefined,
      cvssVector: local.value.cvssVector || undefined,
      cvssScore: local.value.cvssScore ?? undefined,
    }
    let saved: any
    if (props.finding) {
      saved = await update(props.finding.id, props.engagementId, base as any)
      addToast({ title: 'Updated', message: 'Finding updated', type: 'success' })
    } else {
      saved = await create(base as any)
      addToast({ title: 'Created', message: 'Finding created', type: 'success' })
    }
    emit('saved', saved)
    emit('update:modelValue', false)
  } catch (e:any) {
    addToast({ title: 'Error', message: e.message || 'Failed to save finding', type: 'error' })
  } finally { busy.value = false }
}

function close() { emit('update:modelValue', false) }
</script>

<template>
  <div v-if="modelValue" class="modal-overlay">
    <div class="modal">
      <header class="modal-header">
        <h2 class="title">{{ mode==='create' ? 'New Finding' : 'Edit Finding' }}</h2>
        <button class="icon-btn" @click="close">✕</button>
      </header>
      <div class="modal-body">
        <div class="form-grid">
          <div v-if="provenanceTemplate" class="field full provenance-badge">
            <span>Template Source</span>
            <div class="prov-pill">From template: <strong>{{ provenanceTemplate.title }}</strong></div>
          </div>
          <div v-if="mode==='create'" class="field template-field full">
            <span>Use Template</span>
            <div class="template-input-row">
              <input
                v-model="templateQuery"
                placeholder="Search vulnerability templates..."
                @focus="showTemplateDropdown = true"
                @input="showTemplateDropdown = true"
                @keydown="onTemplateKey"
              />
              <button
                v-if="selectedTemplateId"
                type="button"
                class="btn tiny clear-btn"
                @click="clearTemplate"
              >Clear</button>
            </div>
            <div
              v-if="showTemplateDropdown"
              class="template-dropdown"
              @mousedown.prevent
            >
              <div v-if="loadingTemplates" class="template-loading">Loading templates...</div>
              <div v-else>
                <div
                  v-for="(t,idx) in filteredTemplates"
                  :key="t.id"
                  class="template-item"
                  :data-active="idx===activeTemplateIndex"
                  @mouseenter="activeTemplateIndex = idx"
                  @click="applyTemplate(t)"
                >
                  <div class="ti-top">
                    <strong class="ti-title">{{ t.title }}</strong>
                    <span v-if="(t as any).impactLevel || (t as any).likelihood" class="ti-risk">{{ (t as any).impactLevel || '—' }}/{{ (t as any).likelihood || '—' }}</span>
                  </div>
                  <div class="ti-meta">
                    <span class="ti-sev" :class="(t.severity||'').toLowerCase()">{{ t.severity }}</span>
                    <span v-if="t.cvssVector" class="ti-cvss">CVSS</span>
                    <span v-for="tag in ((t.tags||[]) as (string|null)[]).filter(Boolean).slice(0,3)" :key="tag || ''" class="ti-tag">{{ tag }}</span>
                  </div>
                  <p v-if="t.description" class="ti-desc">{{ t.description.slice(0,100) }}<span v-if="t.description.length>100">…</span></p>
                </div>
                <div v-if="!filteredTemplates.length" class="template-empty">No templates match.</div>
              </div>
            </div>
            <div v-if="selectedTemplateId" class="applied-note">Applied from template. You can edit any field.</div>
          </div>
          <label class="field span-2 full">
            <span>Title</span>
            <input v-model="local.title" placeholder="Finding title" />
          </label>
          <label class="field">
            <span>Likelihood</span>
            <select v-model="local.likelihood">
              <option value="">(auto)</option>
              <option value="VERY_HIGH">VERY_HIGH</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
              <option value="VERY_LOW">VERY_LOW</option>
            </select>
          </label>
          <label class="field">
            <span>Impact Level</span>
            <select v-model="local.impactLevel">
              <option value="">(auto)</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </label>
          <div class="field severity-main">
            <span>Derived Severity</span>
            <div class="sev-pill" :class="(riskResult.severity||'').toLowerCase()">{{ riskResult.severity || '—' }}</div>
          </div>
          <label class="field">
            <span>Status</span>
            <select v-model="local.status">
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="REMEDIATED">REMEDIATED</option>
              <option value="ACCEPTED_RISK">ACCEPTED_RISK</option>
              <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
              <option value="DUPLICATE">DUPLICATE</option>
            </select>
          </label>
          <label class="field">
            <span>Publication</span>
            <select v-model="local.publicationStatus">
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
            </select>
          </label>
          <div class="field span-2 long-field full">
            <div class="field-head"><span>Description (Markdown)</span></div>
            <MarkdownEditor v-model="local.description" :autosave-key="props.engagementId + ':finding:desc'" />
          </div>
            <div class="field span-2 long-field full">
              <div class="field-head"><span>Impact</span></div>
              <MarkdownEditor v-model="local.impact" :autosave-key="props.engagementId + ':finding:impact'" />
            </div>
            <div class="field span-2 long-field full">
              <div class="field-head"><span>Reproduction Steps</span></div>
              <MarkdownEditor v-model="local.reproduction" :autosave-key="props.engagementId + ':finding:repro'" />
            </div>
            <div class="field span-2 long-field full">
              <div class="field-head"><span>Remediation</span></div>
              <MarkdownEditor v-model="local.remediation" :autosave-key="props.engagementId + ':finding:remed'" />
            </div>
          <label class="field half-field">
            <span>References (one per line)</span>
            <textarea v-model="local.references" rows="4" />
          </label>
          <label class="field half-field">
            <span>Affected Assets (one per line)</span>
            <textarea v-model="local.affectedAssets" rows="4" />
          </label>
          <div class="field cvss-block full">
            <div class="cvss-row">
              <div class="cvss-vector-input">
                <span>CVSS Vector</span>
                <div class="vector-edit">
                  <input v-model="local.cvssVector" placeholder="AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H" />
                  <button type="button" class="btn tiny" @click="showCvss = !showCvss">Builder</button>
                </div>
              </div>
              <div class="cvss-score">
                <span>Score</span>
                <input v-model.number="local.cvssScore" type="number" step="0.1" min="0" max="10" @change="recomputeCvss" />
              </div>
            </div>
            <div v-if="showCvss" class="cvss-pop full">
              <div class="metric" v-for="m in metrics" :key="m.key">
                <label>{{ m.key }} — {{ metricDetails[m.key].name }}</label>
                <p class="metric-desc">{{ metricDetails[m.key].desc }}</p>
                <div class="options">
                  <button v-for="opt in m.options" :key="opt" type="button" :class="['opt', currentMetricValue(m.key)===opt ? 'active':'']" @click="applyMetric(m.key,opt)">
                    <span class="opt-code">{{ opt }}</span>
                    <span class="opt-name">{{ metricDetails[m.key].values[opt].name }}</span>
                    <span class="opt-desc">{{ metricDetails[m.key].values[opt].desc }}</span>
                  </button>
                </div>
              </div>
              <div class="close-line"><button class="btn tiny" @click="showCvss=false">Close</button></div>
            </div>
          </div>
        </div>
      </div>
      <footer class="modal-footer">
        <div class="left-info">
          <span class="pub-badge" :class="local.publicationStatus.toLowerCase()">{{ local.publicationStatus }}</span>
        </div>
        <div class="actions">
          <button class="btn" @click="close" :disabled="busy">Cancel</button>
          <button v-if="canPublish" class="btn outline" @click="save(true)" :disabled="busy">Save & Publish</button>
          <button class="btn primary" @click="save(false)" :disabled="busy">{{ mode==='create' ? 'Create' : 'Save' }}</button>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:flex-start; justify-content:center; padding:4rem 1rem 2rem; overflow:auto; z-index:200; }
.modal { background:var(--color-card,#fff); color:var(--color-text,#111); border-radius:14px; width:75%; max-width:1400px; display:flex; flex-direction:column; max-height:100%; }
[data-theme="dark"] .modal { background:#1f2735; color:#e2e8f0; }
.modal-header { display:flex; align-items:center; justify-content:space-between; padding:1rem 1.1rem; border-bottom:1px solid var(--color-border,#e5e7eb); }
.modal-header .title { font-size:1rem; margin:0; letter-spacing:.5px; }
.modal-body { padding:1rem 1.1rem 1.25rem; overflow-y:auto; }
.modal-footer { padding:.9rem 1.1rem; border-top:1px solid var(--color-border,#e5e7eb); display:flex; gap:1rem; align-items:center; justify-content:space-between; }
.form-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:1rem 1.1rem; }
.full { grid-column:1 / -1; }
.field { display:flex; flex-direction:column; gap:.35rem; font-size:.7rem; }
.field > span { font-weight:600; letter-spacing:.05em; font-size:.65rem; text-transform:uppercase; opacity:.8; }
input, select, textarea { background:var(--color-input,#f8fafc); border:1px solid var(--color-border,#d1d5db); border-radius:8px; padding:.5rem .6rem; font-size:.72rem; font-family:inherit; resize:vertical; }
[data-theme="dark"] input,[data-theme="dark"] select,[data-theme="dark"] textarea { background:#273142; border-color:#334155; color:#e2e8f0; }
textarea { min-height:60px; }
.btn { background:#e2e8f0; border:none; padding:.55rem 1rem; border-radius:8px; font-size:.7rem; font-weight:600; cursor:pointer; letter-spacing:.03em; }
.btn.tiny { padding:.45rem .75rem; font-size:.6rem; }
[data-theme="dark"] .btn { background:#334155; color:#e2e8f0; border:1px solid #475569; }
[data-theme="dark"] .btn:hover:not(:disabled) { background:#475569; }
[data-theme="dark"] .btn:disabled { background:#1e293b; border-color:#334155; }
.btn.primary { background:#3b82f6; color:#fff; }
.btn.outline { background:#6366f1; color:#fff; }
.btn:disabled { opacity:.6; cursor:not-allowed; }
.icon-btn { background:transparent; border:none; cursor:pointer; font-size:1rem; line-height:1; opacity:.7; }
.icon-btn:hover { opacity:1; }
.pub-badge { font-size:.55rem; padding:.3rem .5rem; border-radius:6px; font-weight:700; letter-spacing:.08em; }
.pub-badge.draft { background:#fcd34d; color:#723b13; }
.pub-badge.published { background:#4ade80; color:#064e3b; }
[data-theme="dark"] .pub-badge.draft { background:#b45309; color:#fff; }
[data-theme="dark"] .pub-badge.published { background:#15803d; color:#fff; }
.long-field { display:flex; flex-direction:column; gap:.4rem; }
.field-head span { font-weight:600; font-size:.65rem; text-transform:uppercase; opacity:.8; letter-spacing:.05em; }
.cvss-block { display:flex; flex-direction:column; gap:.4rem; position:relative; }
.cvss-row { display:flex; gap:1rem; align-items:flex-end; width:100%; }
.cvss-vector-input { flex:1; }
.cvss-score { flex:0 0 120px; }
.cvss-vector-input, .cvss-score { display:flex; flex-direction:column; gap:.3rem; font-size:.65rem; }
.vector-edit { display:flex; gap:.5rem; align-items:stretch; width:100%; }
.vector-edit input { flex:1; }
.vector-edit .btn.tiny { padding:.5rem .85rem; height:100%; display:flex; align-items:center; } /* Align builder button height with input */
.cvss-pop { position:absolute; top:100%; left:0; margin-top:.5rem; background:var(--color-card,#fff); border:1px solid var(--color-border,#d1d5db); border-radius:14px; padding:1rem 1.1rem; display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:1rem; z-index:60; box-shadow:0 10px 28px -6px rgba(0,0,0,0.35); max-width:100%; }
[data-theme="dark"] .cvss-pop { background:#1f2735; border-color:#334155; }
.metric { display:flex; flex-direction:column; gap:.4rem; }
.metric-desc { margin:0; font-size:.55rem; opacity:.65; line-height:1.3; }
.metric label { font-size:.6rem; font-weight:600; letter-spacing:.05em; opacity:.75; }
.options { display:flex; flex-direction:column; gap:.35rem; }
.opt { background:#f1f5f9; border:1px solid var(--color-border,#d1d5db); border-radius:8px; padding:.45rem .55rem; font-size:.6rem; cursor:pointer; display:flex; flex-direction:column; align-items:flex-start; gap:.2rem; text-align:left; }
.opt.active { background:#6366f1; color:#fff; border-color:#6366f1; }
.opt-code { font-weight:700; letter-spacing:.05em; font-size:.55rem; opacity:.85; }
.opt-name { font-weight:600; }
.opt-desc { font-size:.55rem; line-height:1.25; opacity:.85; }
/* Make paired half-field items (References / Affected Assets) span two columns so together they fill the modal width */
.half-field { grid-column:span 2; width:100%; }
@media (max-width: 900px){
  .half-field { grid-column:1 / -1; }
}
[data-theme="dark"] .opt { background:#273142; color:#cbd5e1; }
[data-theme="dark"] .opt.active { background:#6366f1; color:#fff; }
.close-line { grid-column:1/-1; display:flex; justify-content:flex-end; }
.auto-sev { font-size:.6rem; opacity:.8; }
.override-note { color:#dc2626; margin-left:.25rem; }
.override-note-2 { margin:.3rem 0 0; font-size:.55rem; opacity:.75; }
[data-theme="dark"] .override-note-2 { opacity:.85; }
.derived-match { margin:.3rem 0 0; font-size:.55rem; opacity:.6; }
/* Template selector styles */
.template-field { position:relative; }
.template-input-row { display:flex; gap:.5rem; align-items:stretch; }
.template-input-row input { flex:1; }
.clear-btn { background:#f87171; color:#fff; }
[data-theme="dark"] .clear-btn { background:#dc2626; }
.template-dropdown { position:absolute; top:100%; left:0; right:0; margin-top:.35rem; background:var(--color-card,#fff); border:1px solid var(--color-border,#d1d5db); border-radius:10px; max-height:340px; overflow:auto; z-index:80; display:flex; flex-direction:column; gap:.25rem; padding:.45rem .55rem; box-shadow:0 8px 24px -6px rgba(0,0,0,0.25); }
[data-theme="dark"] .template-dropdown { background:#1f2735; border-color:#334155; }
.template-item { padding:.45rem .5rem .55rem; border:1px solid transparent; border-radius:8px; cursor:pointer; display:flex; flex-direction:column; gap:.3rem; background:var(--color-input,#f8fafc); }
.template-item:hover { background:#eef2f7; }
[data-active="true"].template-item { outline:2px solid #6366f1; background:#eef2ff; }
[data-theme="dark"] .template-item { background:#273142; }
[data-theme="dark"] .template-item:hover { background:#334155; }
[data-theme="dark"] [data-active="true"].template-item { background:#374151; outline:2px solid #6366f1; }
.ti-top { display:flex; align-items:center; justify-content:space-between; gap:.5rem; }
.ti-title { font-size:.65rem; font-weight:600; }
.ti-risk { font-size:.55rem; opacity:.75; letter-spacing:.05em; }
.ti-meta { display:flex; gap:.4rem; flex-wrap:wrap; }
.ti-sev { font-size:.5rem; font-weight:700; letter-spacing:.05em; padding:.2rem .4rem; border-radius:5px; background:#e2e8f0; }
.ti-sev.critical { background:#dc2626; color:#fff; }
.ti-sev.high { background:#f97316; color:#fff; }
.ti-sev.medium { background:#fbbf24; }
.ti-sev.low { background:#22c55e; color:#fff; }
.ti-cvss { font-size:.5rem; padding:.2rem .35rem; background:#6366f1; color:#fff; border-radius:4px; letter-spacing:.05em; }
.ti-tag { font-size:.5rem; padding:.2rem .35rem; background:#475569; color:#fff; border-radius:4px; }
.ti-desc { margin:0; font-size:.55rem; line-height:1.25; opacity:.75; }
.template-loading, .template-empty { padding:.6rem .5rem; font-size:.55rem; opacity:.8; }
.applied-note { font-size:.55rem; margin-top:.25rem; opacity:.75; }
.provenance-badge .prov-pill { background:#6366f1; color:#fff; display:inline-block; padding:.4rem .65rem; border-radius:999px; font-size:.55rem; letter-spacing:.05em; }
[data-theme="dark"] .provenance-badge .prov-pill { background:#4f46e5; }
</style>
