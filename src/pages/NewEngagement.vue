<template>
  <DashboardLayout>
    <h1 class="dashboard-title page-heading">New Engagement</h1>
    <section class="new-engagement-section">
      <form class="engagement-form" @submit.prevent="submit">
        <div class="form-row">
          <label>Code</label>
          <input v-model="form.code" required placeholder="ENG-2025-01" />
        </div>
        <div class="form-row">
          <label>Title</label>
            <input v-model="form.title" required placeholder="Q1 Web App Pentest" />
        </div>
        <div class="form-row">
          <label>Organization</label>
          <div class="combo" :class="{ disabled: orgReadOnly }">
            <input
              v-model="orgSearch"
              :readonly="orgReadOnly"
              :placeholder="orgPlaceholder"
              @input="filterOrganizations"
              @focus="showOrgList = true"
              @blur="() => hideListDelayed('org')"
            />
            <ul v-if="showOrgList" class="combo-list">
              <li v-for="o in filteredOrganizations" :key="o.id" @mousedown.prevent="selectOrganization(o)" :class="{ active: o.id === form.organizationId }">
                {{ o.name || o.id }}
              </li>
              <li v-if="!filteredOrganizations.length" class="empty">No matches</li>
            </ul>
          </div>
          <p v-if="orgError" class="hint error">{{ orgError }}</p>
        </div>
        <div class="form-row">
          <label>Applications</label>
          <div class="combo multi" :class="{ disabled: !form.organizationId }">
            <input
              v-model="appSearch"
              :readonly="appReadOnly || !form.organizationId"
              :placeholder="appPlaceholder"
              @input="filterApplications"
              @focus="showAppList = true"
              @blur="() => hideListDelayed('app')"
            />
            <ul v-if="showAppList" class="combo-list">
              <li v-for="a in filteredApplications" :key="a.id" @mousedown.prevent="toggleApplication(a)" :class="{ active: selectedApplications.includes(a.id) }">
                <span>{{ a.name || a.id }}</span>
                <span class="badge" v-if="selectedApplications.includes(a.id)">✓</span>
              </li>
              <li v-if="!filteredApplications.length" class="empty">No matches</li>
            </ul>
            <div class="chips" v-if="selectedApplications.length">
              <span class="chip" v-for="id in selectedApplications" :key="id">
                {{ appName(id) }}
                <button type="button" class="chip-remove" @click="removeApplication(id)" title="Deselect application">×</button>
              </span>
            </div>
          </div>
          <p v-if="appError" class="hint error">{{ appError }}</p>
        </div>
        <div class="form-row inline">
          <div>
            <label>Phase</label>
            <select v-model="form.phase">
              <option v-for="p in phases" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
          <div>
            <label>Status</label>
            <select v-model="form.status">
              <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
        </div>
        <div class="actions">
          <router-link to="/pentester/engagements" class="btn btn-light">Cancel</router-link>
          <button type="submit" class="btn" :disabled="submitting">{{ submitting ? 'Creating...' : 'Create Engagement' }}</button>
        </div>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </section>
  </DashboardLayout>
</template>
<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { useEngagements } from '../composables/useEngagements'
import { useApplications } from '../composables/useApplications'
import { useEngagementApplications } from '../composables/useEngagementApplications'
import { useOrganizations } from '../composables/useOrganizations'
import { useRouter } from 'vue-router'

const router = useRouter()
const { create } = useEngagements()
const { attach } = useEngagementApplications()
const { applications, list: listApplications } = useApplications()
const { organizations, fetchOrganizations } = useOrganizations()

const phases = ['PLANNING','IN_PROGRESS','REPORTING','COMPLETE']
const statuses = ['ACTIVE','ON_HOLD','CLOSED']

const form = ref({
  code: '',
  title: '',
  organizationId: '',
  phase: 'PLANNING',
  status: 'ACTIVE'
})
const selectedApplications = ref<string[]>([])

// Org live search state
const orgSearch = ref('')
const orgError = ref('')
const showOrgList = ref(false)
const filteredOrganizations = ref<any[]>([])
const orgReadOnly = ref(false)

// Application live search state
const appSearch = ref('')
const appError = ref('')
const showAppList = ref(false)
const filteredApplications = ref<any[]>([])
const appReadOnly = ref(false)

let hideTimer: any = null
function hideListDelayed(kind: 'org'|'app') {
  hideTimer && clearTimeout(hideTimer)
  hideTimer = setTimeout(()=> {
    if (kind === 'org') showOrgList.value = false
    else showAppList.value = false
  }, 150)
}

function normalize(str: string){ return (str||'').toLowerCase().trim() }

function filterOrganizations(){
  const q = normalize(orgSearch.value)
  const list = organizations.value || []
  filteredOrganizations.value = q ? list.filter(o => normalize(o.name||o.id).includes(q)) : list
}

function filterApplications(){
  const q = normalize(appSearch.value)
  const list = (applications.value || []).filter(a => !form.value.organizationId || a.organizationId === form.value.organizationId)
  filteredApplications.value = q ? list.filter(a => normalize(a.name||a.id).includes(q)) : list
}

function selectOrganization(o: any){
  form.value.organizationId = o.id
  orgSearch.value = o.name || o.id
  showOrgList.value = false
  // Reset application selections on org change
  selectedApplications.value = []
  // Refresh applications filtered
  filterApplications()
  evaluateAppAutoSelect()
}

function toggleApplication(a: any){
  if (appReadOnly.value) return
  const idx = selectedApplications.value.indexOf(a.id)
  if (idx >= 0) selectedApplications.value.splice(idx,1)
  else selectedApplications.value.push(a.id)
}
function removeApplication(id: string){
  // Allow removal even if appReadOnly (user should be able to deselect auto-selected single app)
  const idx = selectedApplications.value.indexOf(id)
  if (idx>=0) selectedApplications.value.splice(idx,1)
  // Once user manually deselects, release readOnly state
  if (appReadOnly.value) appReadOnly.value = false
}
function appName(id: string){
  return (applications.value.find(a=>a.id===id)?.name) || id
}

const orgPlaceholder = computed(()=> orgReadOnly.value ? 'Organization selected' : 'Search organization...')
const appPlaceholder = computed(()=> {
  if (!form.value.organizationId) return 'Select organization first'
  return appReadOnly.value ? 'Application selected' : 'Search applications...'
})

function evaluateOrgAutoSelect(){
  if (organizations.value && organizations.value.length === 1) {
    const only = organizations.value[0]
    form.value.organizationId = only.id
    orgSearch.value = only.name || only.id
    orgReadOnly.value = true
    filterOrganizations()
  } else {
    orgReadOnly.value = false
  }
}

function evaluateAppAutoSelect(){
  const scoped = (applications.value || []).filter(a => a.organizationId === form.value.organizationId)
  if (form.value.organizationId && scoped.length === 1) {
    selectedApplications.value = [scoped[0].id]
    appSearch.value = scoped[0].name || scoped[0].id
    appReadOnly.value = true
  } else {
    appReadOnly.value = false
  }
}

watch(() => organizations.value, () => {
  filterOrganizations(); evaluateOrgAutoSelect()
}, { immediate: true })
watch(() => applications.value, () => {
  filterApplications(); evaluateAppAutoSelect()
})
watch(() => form.value.organizationId, () => {
  filterApplications(); evaluateAppAutoSelect()
})

onMounted(async () => {
  await fetchOrganizations({ force: true })
  await listApplications()
  filterOrganizations(); filterApplications();
  evaluateOrgAutoSelect(); evaluateAppAutoSelect()
})

async function submit() {
  if (!form.value.organizationId) {
    orgError.value = 'Organization is required'
    return
  }
  orgError.value = ''
  appError.value = ''
  const res = await create({ ...form.value, phase: form.value.phase as any, status: form.value.status as any })
  if (res) {
    if (selectedApplications.value.length) {
      await attach(res.id, selectedApplications.value, form.value.organizationId)
    }
    router.push({ name: 'pentester-engagement-detail', params: { id: res.id } })
  } else {
    appError.value = 'Failed to create engagement'
  }
}

const submitting = ref(false)
const error = ref('')
</script>
<style scoped>
.new-engagement-section { padding:2rem; background:#181e2a; border-radius:12px; max-width:640px; }
.dashboard-title { font-size:2rem; font-weight:700; color:#fff; }
.engagement-form { display:flex; flex-direction:column; gap:1rem; }
.form-row { display:flex; flex-direction:column; gap:.35rem; }
.form-row.inline { flex-direction:row; gap:1rem; }
.form-row.inline > div { flex:1; display:flex; flex-direction:column; }
label { font-size:.65rem; text-transform:uppercase; letter-spacing:.5px; color:#94a3b8; }
input, select { background:#0f1623; color:#fff; border:1px solid #243044; padding:.6rem .7rem; border-radius:6px; font-size:.85rem; }
.hint { font-size:.65rem; color:#64748b; margin:0; }
.actions { margin-top:1rem; display:flex; justify-content:flex-end; gap:.75rem; }
.btn { background:#2563eb; color:#fff; border:none; padding:.7rem 1.1rem; border-radius:8px; cursor:pointer; font-size:.8rem; font-weight:600; }
.btn:disabled { opacity:.5; cursor:default; }
.btn-light { background:#334155; color:#e2e8f0; text-decoration:none; padding:.7rem 1rem; border-radius:8px; font-size:.8rem; }
.btn-light:hover { background:#475569; }
.error { color:#f87171; font-size:.75rem; }
/* Combobox styles */
.combo { position:relative; }
.combo.disabled input { opacity:.6; cursor:not-allowed; }
.combo-list { position:absolute; top:100%; left:0; right:0; background:#0f1623; border:1px solid #243044; border-radius:6px; max-height:210px; overflow:auto; margin:.25rem 0 0; list-style:none; padding:.35rem 0; z-index:20; }
.combo-list li { padding:.4rem .65rem; font-size:.75rem; cursor:pointer; display:flex; justify-content:space-between; align-items:center; }
.combo-list li:hover, .combo-list li.active { background:#1e293b; }
.combo-list li.empty { opacity:.6; cursor:default; }
.chips { display:flex; flex-wrap:wrap; gap:.4rem; margin-top:.4rem; }
.chip { background:#1e293b; padding:.25rem .5rem; border-radius:999px; font-size:.65rem; display:flex; align-items:center; gap:.35rem; }
.chip button { background:transparent; color:#94a3b8; border:none; cursor:pointer; font-size:.7rem; line-height:1; }
.chip button:hover { color:#f1f5f9; }
.badge { background:#2563eb; color:#fff; font-size:.55rem; padding:0 .4rem; border-radius:4px; }
input[readonly] { background:#0f1623; }
</style>
