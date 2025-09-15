<template>
  <DashboardLayout>
    <template #header>
      <h1 class="dashboard-title">New Vulnerability Finding</h1>
    </template>
    <section class="new-finding-section">
      <form @submit.prevent="onSubmit" class="finding-form">
        <div class="field-group two-col">
          <div>
            <label>Engagement<span class="req">*</span></label>
            <select v-model="form.engagementId" required>
              <option value="" disabled>Select engagement</option>
              <option v-for="e in engagements" :key="e.id" :value="e.id">{{ e.code }} - {{ e.title }}</option>
            </select>
          </div>
          <div>
            <label>Application<span class="req">*</span></label>
            <select v-model="form.applicationId" required>
              <option value="" disabled>Select application</option>
              <option v-for="a in applications" :key="a.id" :value="a.id">{{ a.name }}</option>
            </select>
          </div>
        </div>
        <div class="field-group two-col">
          <div>
            <label>Template</label>
            <select v-model="form.templateId">
              <option value="">(none)</option>
              <option v-for="t in templates" :key="t.id" :value="t.id">{{ t.title }}</option>
            </select>
          </div>
          <div>
            <label>Severity<span class="req">*</span></label>
            <select v-model="form.severity" required>
              <option v-for="s in severities" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
        </div>
        <div class="field-group two-col">
          <div>
            <label>Status<span class="req">*</span></label>
            <select v-model="form.status" required>
              <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div>
            <label>Title<span class="req">*</span></label>
            <input v-model="form.title" placeholder="Finding title" required />
          </div>
        </div>
        <div class="field-group">
          <label>Description</label>
          <textarea v-model="form.description" rows="4" />
        </div>
        <div class="field-group two-col">
          <div>
            <label>Impact</label>
            <textarea v-model="form.impact" rows="3" />
          </div>
          <div>
            <label>Reproduction</label>
            <textarea v-model="form.reproduction" rows="3" />
          </div>
        </div>
        <div class="field-group">
          <label>Remediation</label>
          <textarea v-model="form.remediation" rows="3" />
        </div>
        <div class="field-group">
          <label>References (comma or newline)</label>
          <textarea v-model="referencesInput" rows="2" placeholder="https://cve.mitre.org/..." />
        </div>
        <div class="field-group">
          <label>Affected Assets (comma or newline)</label>
          <textarea v-model="assetsInput" rows="2" placeholder="api.example.com, mobile app" />
        </div>
        <div class="button-row">
          <button type="submit" :disabled="submitting">Create Finding</button>
          <span v-if="error" class="error">{{ error }}</span>
          <span v-if="success" class="success">Created!</span>
        </div>
      </form>
    </section>
  </DashboardLayout>
</template>
<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { useEngagements } from '../composables/useEngagements'
import { useApplications } from '../composables/useApplications'
import { useVulnerabilityTemplates } from '../composables/useVulnerabilityTemplates'
import { useVulnerabilityFindings } from '../composables/useVulnerabilityFindings'
import { useRouter } from 'vue-router'

const router = useRouter()
const { engagements, list: listEngagements } = useEngagements()
const { applications, list: listApplications } = useApplications()
const { templates, list: listTemplates } = useVulnerabilityTemplates()
const { create, loading, error } = useVulnerabilityFindings()

const severities = ['CRITICAL','HIGH','MEDIUM','LOW','INFO']
const statuses = ['OPEN','IN_PROGRESS','REMEDIATED','ACCEPTED_RISK','FALSE_POSITIVE','DUPLICATE']

const form = reactive({
  engagementId: '',
  applicationId: '',
  templateId: '',
  title: '',
  severity: 'MEDIUM',
  status: 'OPEN',
  description: '',
  impact: '',
  reproduction: '',
  remediation: '',
})
const referencesInput = ref('')
const assetsInput = ref('')
const submitting = computed(() => loading.value)
const success = ref(false)

function splitLines(val: string) { return val.split(/[,\n]/).map(v => v.trim()).filter(Boolean) }

async function onSubmit() {
  success.value = false
  const res = await create({
    engagementId: form.engagementId,
    applicationId: form.applicationId,
    templateId: form.templateId || undefined,
    title: form.title,
    severity: form.severity as any,
    status: form.status as any,
    description: form.description,
    impact: form.impact,
    reproduction: form.reproduction,
    remediation: form.remediation,
    references: splitLines(referencesInput.value),
    affectedAssets: splitLines(assetsInput.value),
  })
  if (res) {
    success.value = true
    setTimeout(() => router.push({ name: 'EngagementDetail', params: { id: form.engagementId } }), 800)
  }
}

onMounted(async () => {
  await Promise.all([
    listEngagements({}),
    listApplications({}),
    listTemplates(),
  ])
})
</script>
<style scoped>
.new-finding-section { padding:2rem; background:#181e2a; border-radius:12px; }
.dashboard-title { font-size:2rem; font-weight:700; color:#fff; margin:0 0 1rem; }
.finding-form { display:flex; flex-direction:column; gap:1.25rem; }
.field-group { display:flex; flex-direction:column; gap:.5rem; }
.field-group.two-col { flex-direction:row; gap:1.5rem; }
.field-group.two-col > div { flex:1; display:flex; flex-direction:column; gap:.5rem; }
label { font-weight:600; font-size:.85rem; text-transform:uppercase; letter-spacing:.05em; color:#9da9c5; }
input, select, textarea { background:#1f2735; border:1px solid #2b3647; color:#e6ebf5; padding:.6rem .75rem; border-radius:6px; font:inherit; }
input:focus, select:focus, textarea:focus { outline:2px solid #3b82f6; }
textarea { resize:vertical; }
.req { color:#f87171; margin-left:.25rem; }
.button-row { display:flex; align-items:center; gap:1rem; }
button { background:#2563eb; color:#fff; border:none; padding:.7rem 1.2rem; border-radius:6px; cursor:pointer; font-weight:600; }
button:disabled { opacity:.6; cursor:default; }
.error { color:#f87171; font-size:.8rem; }
.success { color:#34d399; font-size:.8rem; }
@media (max-width: 900px) { .field-group.two-col { flex-direction:column; } }
</style>
