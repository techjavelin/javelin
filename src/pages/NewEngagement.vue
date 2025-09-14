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
          <label>Organization ID</label>
          <input v-model="form.organizationId" required placeholder="org-..." />
        </div>
        <div class="form-row">
          <label>Applications</label>
          <div class="multi-box">
            <div v-for="a in applications" :key="a.id" class="multi-item">
              <label class="chk">
                <input type="checkbox" :value="a.id" v-model="selectedApplications" />
                <span>{{ a.name || a.id }}</span>
              </label>
            </div>
            <p v-if="applications.length===0" class="hint">No applications available.</p>
          </div>
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
import { ref, onMounted } from 'vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { useEngagements } from '../composables/useEngagements'
import { useApplications } from '../composables/useApplications'
import { useEngagementApplications } from '../composables/useEngagementApplications'
import { useRouter } from 'vue-router'

const router = useRouter()
const { create } = useEngagements()
const { attach } = useEngagementApplications()
const { applications, list: listApplications } = useApplications()

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

const submitting = ref(false)
const error = ref('')

onMounted(async () => {
  await listApplications()
})

async function submit() {
  submitting.value = true
  error.value = ''
  const res = await create({ ...form.value, phase: form.value.phase as any, status: form.value.status as any })
  submitting.value = false
  if (res) {
    if (selectedApplications.value.length) {
      await attach(res.id, selectedApplications.value, form.value.organizationId)
    }
    router.push({ name: 'pentester-engagement-detail', params: { id: res.id } })
  } else {
    error.value = 'Failed to create engagement'
  }
}
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
.multi-box { display:flex; flex-direction:column; gap:.4rem; background:#0f1623; padding:.6rem .7rem; border:1px solid #243044; border-radius:6px; max-height:220px; overflow:auto; }
.multi-item { font-size:.75rem; }
.chk { display:flex; align-items:center; gap:.5rem; cursor:pointer; }
.chk input { accent-color:#2563eb; }
.hint { font-size:.65rem; color:#64748b; margin:0; }
.actions { margin-top:1rem; display:flex; justify-content:flex-end; gap:.75rem; }
.btn { background:#2563eb; color:#fff; border:none; padding:.7rem 1.1rem; border-radius:8px; cursor:pointer; font-size:.8rem; font-weight:600; }
.btn:disabled { opacity:.5; cursor:default; }
.btn-light { background:#334155; color:#e2e8f0; text-decoration:none; padding:.7rem 1rem; border-radius:8px; font-size:.8rem; }
.btn-light:hover { background:#475569; }
.error { color:#f87171; font-size:.75rem; }
</style>
