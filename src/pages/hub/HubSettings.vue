<template>
  <DashboardLayout hideSidebarPadding>
    <template #sidebar><HubSidebar /></template>
    <div class="hub-page">
      <div class="head-row">
        <h1 class="page-title">Settings</h1>
        <div class="org-select" v-if="organizations.length || orgsLoading">
          <select v-model="selectedOrgId" :disabled="orgsLoading">
            <option v-if="orgsLoading" value="">Loading…</option>
            <option v-for="o in organizations" :key="o.id" :value="o.id">{{ o.name }}</option>
          </select>
        </div>
      </div>
      <div v-if="!currentOrg" class="empty">Select an organization to view settings.</div>
      <div v-else class="grid">
        <section class="panel">
          <h3>Organization Info</h3>
          <p><strong>Name:</strong> {{ currentOrg.name }}</p>
          <p><strong>ID:</strong> <code>{{ currentOrg.id }}</code></p>
        </section>
        <section class="panel">
          <h3>Capabilities</h3>
          <ul class="caps">
            <li v-for="c in capabilities" :key="c">{{ c }}</li>
          </ul>
        </section>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import HubSidebar from '@/components/hub/HubSidebar.vue'
import { ref, watch } from 'vue'
import { useCurrentOrg } from '@/composables/useCurrentOrg'
import { useHubAuth } from '@/composables/useHubAuth'

const { currentOrgId, organizations, currentOrg, orgsLoading, setCurrentOrg } = useCurrentOrg()
const { capabilities } = useHubAuth()
const selectedOrgId = ref<string | null>(currentOrgId.value)
watch(selectedOrgId, id=> setCurrentOrg(id))
watch(currentOrgId, id=>{ if (id && id!==selectedOrgId.value) selectedOrgId.value=id })
</script>

<style scoped>
.hub-page { padding:1.25rem 1.4rem 2rem; display:flex; flex-direction:column; gap:1.2rem; }
.head-row { display:flex; justify-content:space-between; align-items:center; gap:1rem; flex-wrap:wrap; }
select { background:#1e293b; border:1px solid rgba(255,255,255,0.12); color:#fff; font-size:.6rem; padding:.4rem .55rem; border-radius:6px; }
.grid { display:grid; gap:1rem; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); }
.panel { background:var(--color-card,#1e293b); border:1px solid rgba(255,255,255,0.08); padding:.9rem 1rem; border-radius:12px; font-size:.65rem; }
.panel h3 { margin:0 0 .5rem; font-size:.7rem; text-transform:uppercase; letter-spacing:.08em; opacity:.75; }
.caps { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:.25rem; font-size:.55rem; }
.empty { font-size:.65rem; opacity:.6; }
</style>
