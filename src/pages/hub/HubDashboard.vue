<template>
  <DashboardLayout hideSidebarPadding>
    <template #sidebar>
      <HubSidebar />
    </template>
    <div class="hub-page">
      <h1 class="page-title">Pulse Hub Dashboard</h1>
      <div class="metrics-grid">
        <div class="metric-card" v-for="m in metrics" :key="m.key">
          <p class="label">{{ m.label }}</p>
          <h2 class="value">{{ m.value }}</h2>
          <p class="sub" v-if="m.sub">{{ m.sub }}</p>
        </div>
      </div>
      <div class="panels">
        <section class="panel">
          <h3>Recent Engagements</h3>
          <ul class="simple-list">
            <li v-for="e in recentEngagements" :key="e.id">{{ e.name }} <span class="code">{{ e.code }}</span></li>
          </ul>
        </section>
        <section class="panel">
          <h3>Latest Findings</h3>
          <ul class="simple-list">
            <li v-for="f in latestFindings" :key="f.id">[{{ f.severity }}] {{ f.title }}</li>
          </ul>
        </section>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import HubSidebar from '@/components/hub/HubSidebar.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { ref } from 'vue'

// Temporary stub data – to be replaced with composables
interface HubMetric { key:string; label:string; value:number; sub?:string }
const metrics = ref<HubMetric[]>([
  { key: 'eng_total', label: 'Active Engagements', value: 0, sub: 'All phases' },
  { key: 'find_open', label: 'Open Findings', value: 0 },
  { key: 'sev_high', label: 'High Severity', value: 0 },
  { key: 'artifacts', label: 'Documents', value: 0 }
])
const recentEngagements = ref([] as any[])
const latestFindings = ref([] as any[])
</script>

<style scoped>
.hub-page { padding:1.1rem 1.25rem 1.4rem; display:flex; flex-direction:column; gap:1.1rem; min-height:0; flex:1 1 auto; }
.page-title { font-size:1rem; margin:0 0 .5rem; letter-spacing:.5px; }
.metrics-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:.85rem; }
.metric-card { background:var(--color-card,#1e293b); border:1px solid rgba(255,255,255,0.05); padding:.8rem .9rem; border-radius:12px; display:flex; flex-direction:column; gap:.35rem; }
.metric-card .label { margin:0; font-size:.55rem; opacity:.65; letter-spacing:.08em; text-transform:uppercase; }
.metric-card .value { margin:0; font-size:1.1rem; font-weight:600; }
.metric-card .sub { margin:0; font-size:.55rem; opacity:.6; }
.panels { display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:1rem; }
.panel { background:var(--color-card,#1e293b); border:1px solid rgba(255,255,255,0.05); padding:1rem 1.1rem; border-radius:12px; display:flex; flex-direction:column; gap:.6rem; }
.panel h3 { margin:0; font-size:.75rem; letter-spacing:.08em; text-transform:uppercase; opacity:.8; }
.simple-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:.4rem; font-size:.7rem; }
.code { opacity:.6; font-size:.6rem; margin-left:.25rem; }
</style>
