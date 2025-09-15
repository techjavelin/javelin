<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthorization } from '@/composables/useAuthorization'
import { useEngagementParticipants } from '@/composables/useEngagementParticipants'
import CapGate from '@/components/CapGate.vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'

interface EngagementMinimal { id: string; title?: string | null }
const route = useRoute()
const engagementId = ref<string>('')
const engagement = ref<EngagementMinimal | null>(null)
const activeTab = ref<'overview'|'findings'|'artifacts'|'participants'>('overview')
const loading = ref(false)
const error = ref<string | null>(null)
const { primeContext, has } = useAuthorization()
const { participants, list: listParticipants, assign, remove, loading: participantsLoading } = useEngagementParticipants()
const newParticipant = ref({ userId: '', role: 'ENG_PENTESTER', applicationId: '' })
const assigning = ref(false)

async function onAssign() {
  if (!engagement.value || !newParticipant.value.userId) return
  assigning.value = true
  try {
    // For now use placeholder applicationId until UI adds selection; required by model.
    const applicationId = newParticipant.value.applicationId || 'app-placeholder'
    await assign({ engagementId: engagement.value.id, organizationId: (engagement.value as any).organizationId || 'org-unknown', userId: newParticipant.value.userId, role: newParticipant.value.role as any, applicationId })
    newParticipant.value.userId = ''
  } finally { assigning.value = false }
}

async function load() {
  if (!engagementId.value) return
  loading.value = true
  error.value = null
  try {
    await primeContext({ engagementId: engagementId.value })
    engagement.value = { id: engagementId.value, title: 'Engagement ' + engagementId.value }
    await listParticipants(engagementId.value)
  } catch (e: any) {
    error.value = e.message || 'Failed loading engagement'
  } finally { loading.value = false }
}

onMounted(() => { engagementId.value = route.params.id as string; load() })
watch(() => route.params.id, (id) => { if (id) { engagementId.value = id as string; load() } })

function tabClass(t: string) { return ['tab', activeTab.value === t ? 'active' : ''].join(' ') }
</script>

<template>
  <DashboardLayout>
    <template #header>
      <h1 class="dashboard-title">Engagement Detail</h1>
    </template>
    <div class="engagement-detail">
    <div v-if="loading" class="state">Loading…</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <div v-else-if="!engagement" class="state empty">Engagement not found.</div>
    <div v-else>
      <header class="header">
        <div>
          <h1>{{ engagement.title || engagement.id }}</h1>
          <p class="sub">ID: {{ engagement.id }}</p>
        </div>
        <div class="actions">
          <CapGate capability="ENG.MANAGE" :ctx="{ engagementId: engagement.id }">
            <button type="button">Edit</button>
          </CapGate>
        </div>
      </header>
      <nav class="tabs">
        <button :class="tabClass('overview')" @click="activeTab='overview'">Overview</button>
        <button :class="tabClass('findings')" @click="activeTab='findings'">Findings</button>
        <button :class="tabClass('artifacts')" @click="activeTab='artifacts'">Artifacts</button>
        <button :class="tabClass('participants')" @click="activeTab='participants'">Participants</button>
      </nav>
      <section class="tab-body" v-if="activeTab==='overview'">
        <h2>Overview</h2>
        <p class="placeholder">Overview content placeholder (summary, scope, constraints...).</p>
      </section>
      <section class="tab-body" v-else-if="activeTab==='findings'">
        <h2>Findings</h2>
        <p class="placeholder">Findings list placeholder – will integrate findings table.</p>
        <CapGate capability="ENG.UPDATE_FINDING" :ctx="{ engagementId: engagement.id }">
          <button type="button">New Finding</button>
        </CapGate>
      </section>
      <section class="tab-body" v-else-if="activeTab==='artifacts'">
        <h2>Artifacts</h2>
        <p class="placeholder">Artifacts table placeholder.</p>
      </section>
      <section class="tab-body" v-else-if="activeTab==='participants'">
        <h2>Participants</h2>
  <div v-if="participantsLoading" class="placeholder">Loading participants…</div>
  <table v-else-if="participants.length" class="part-table">
          <thead>
            <tr><th>User</th><th>Role</th><th></th></tr>
          </thead>
            <tbody>
              <tr v-for="p in participants" :key="p.userId">
                <td>{{ p.userId }}</td>
                <td>{{ p.role }}</td>
                <td class="actions-cell">
                  <CapGate capability="ENG.MANAGE" :ctx="{ engagementId: engagement.id }">
                    <button class="mini danger" @click="remove(p.userId, engagement.id)">Remove</button>
                  </CapGate>
                </td>
              </tr>
            </tbody>
  </table>
  <p v-else class="placeholder empty">No participants assigned.</p>
        <CapGate capability="ENG.MANAGE" :ctx="{ engagementId: engagement.id }">
          <form class="assign-form" @submit.prevent="onAssign">
            <div class="row">
              <input v-model="newParticipant.userId" placeholder="User ID" required />
              <select v-model="newParticipant.role">
                <option value="OWNER">OWNER</option>
                <option value="LEAD">LEAD</option>
                <option value="TESTER">TESTER</option>
                <option value="VIEWER">VIEWER</option>
              </select>
              <button type="submit" :disabled="assigning">{{ assigning ? 'Assigning…' : 'Assign' }}</button>
            </div>
          </form>
        </CapGate>
      </section>
    </div>
  </div>
  </DashboardLayout>
</template>

<style scoped>
.header { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; margin-bottom:1rem; }
.header h1 { margin:0; font-size:1.4rem; }
.sub { margin:0.25rem 0 0; font-size:0.75rem; opacity:0.7; }
.actions button { background:#3b82f6; color:#fff; border:none; padding:0.45rem 0.8rem; border-radius:4px; cursor:pointer; }
.tabs { display:flex; gap:0.25rem; margin-bottom:0.75rem; }
.tab { background:#f3f4f6; border:none; padding:0.45rem 0.9rem; border-radius:4px; cursor:pointer; font-size:0.85rem; }
.tab.active { background:#3b82f6; color:#fff; }
.tab-body { background:#fff; border:1px solid #e5e7eb; border-radius:6px; padding:1rem; }
.placeholder { opacity:0.7; font-size:0.85rem; }
.state { padding:1rem; }
.state.error { color:#b91c1c; }
.state.empty { color:#555; }
</style>
