<template>
  <PageWrapper title="SigInt Overview">
    <section class="sigint-hero">
      <div class="hero-copy">
        <h1 class="hero-title">Signals Intelligence <span class="accent">(SigInt)</span></h1>
        <p class="hero-tagline">Real-time monitoring, enrichment, and threat detection to illuminate emerging risks before they impact operations.</p>
        <div class="hero-actions">
          <button class="cta" @click="launch">Launch Module</button>
          <button class="cta ghost" @click="learnDocs">Documentation</button>
        </div>
      </div>
      <div class="hero-art">
        <div class="pulse-circle" />
        <div class="radar" />
      </div>
    </section>

    <section class="feature-grid">
      <div class="feature" v-for="f in features" :key="f.title">
        <h3>{{ f.title }}</h3>
        <p>{{ f.desc }}</p>
      </div>
    </section>

    <section class="roadmap">
      <h2>Upcoming Enhancements</h2>
      <ul>
        <li v-for="r in roadmap" :key="r">{{ r }}</li>
      </ul>
    </section>
  </PageWrapper>
</template>
<script setup lang="ts">
import PageWrapper from '@/components/PageWrapper.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

function launch() { router.push('/sigint') }
function learnDocs() { window.open('https://docs.pulse.techjavelin.com/sigint','_blank') }

interface Feature { title:string; desc:string }
const features: Feature[] = [
  { title:'Live Signal Stream', desc:'Continuous ingestion pipeline surfaces relevant security signals and telemetry.' },
  { title:'Threat Enrichment', desc:'Automatic correlation with threat intel sources to raise actionable context.' },
  { title:'Custom Watchlists', desc:'Define assets, actors, or patterns and receive prioritized alerts.' },
  { title:'Adaptive Scoring', desc:'Risk scoring model factors velocity, severity, and asset criticality.' },
  { title:'Collaboration Hooks', desc:'Integrations for ticketing & chat to accelerate triage loops.' },
  { title:'Compliance Mode', desc:'Audit-friendly retention and export controls for regulated environments.' }
]

const roadmap = [
  'Multi-tenant anomaly baselining',
  'Advanced actor clustering via ML',
  'SOAR playbook connectors',
  'Predictive escalation scoring'
]
</script>
<style scoped>
.sigint-hero { display:flex; gap:3rem; padding:2.75rem 2rem 2.25rem; border:1px solid #243048; border-radius:30px; background:radial-gradient(circle at 30% 35%,#1d2839 0%,#101722 70%,#0b1017 100%); position:relative; overflow:hidden; }
.sigint-hero:before { content:""; position:absolute; inset:0; background:linear-gradient(135deg,rgba(56,189,248,0.15),rgba(14,165,233,0.05),rgba(15,23,42,0)); pointer-events:none; }
.hero-copy { flex:1; display:flex; flex-direction:column; justify-content:center; z-index:2; }
.hero-title { font-size:2.4rem; font-weight:800; margin:0 0 1rem; line-height:1.1; background:linear-gradient(90deg,#e2f3ff,#bae6fd); -webkit-background-clip:text; background-clip:text; color:transparent; }
.accent { background:linear-gradient(90deg,#38bdf8,#0ea5e9,#0369a1); -webkit-background-clip:text; background-clip:text; color:transparent; }
.hero-tagline { margin:0 0 1.4rem; font-size:1.05rem; line-height:1.5; color:#c2d5e4; max-width:660px; }
.hero-actions { display:flex; gap:1rem; }
.cta { background:#0284c7; color:#fff; border:none; border-radius:12px; padding:.85rem 1.4rem; font-size:.9rem; font-weight:600; cursor:pointer; letter-spacing:.03em; box-shadow:0 4px 14px -4px rgba(56,189,248,0.45); transition:background .18s, transform .18s; }
.cta:hover { background:#0369a1; }
.cta.ghost { background:#1e293b; color:#cfe9fa; box-shadow:none; }
.cta.ghost:hover { background:#2a3a4f; }
.hero-art { position:relative; width:320px; display:flex; align-items:center; justify-content:center; }
.pulse-circle { width:230px; height:230px; border-radius:50%; background:radial-gradient(circle,#0ea5e9,#1e3a8a 70%); filter:blur(12px); opacity:.55; animation:pulse 7s ease-in-out infinite; }
.radar { position:absolute; width:170px; height:170px; border:2px solid rgba(191,219,254,0.35); border-radius:50%; animation:spin 14s linear infinite; box-shadow:0 0 0 1px rgba(191,219,254,0.08); }
.feature-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(230px,1fr)); gap:1.4rem; margin:3rem 0 2.5rem; }
.feature { background:#181e2a; border:1px solid #243048; border-radius:16px; padding:1.2rem 1.1rem 1.05rem; position:relative; overflow:hidden; }
.feature h3 { margin:0 0 .5rem; font-size:.95rem; letter-spacing:.04em; font-weight:600; color:#e2e8f0; }
.feature p { margin:0; font-size:.78rem; line-height:1.4; color:#b9c7d8; }
.roadmap { margin-bottom:3rem; }
.roadmap h2 { margin:0 0 .9rem; font-size:1.15rem; font-weight:600; letter-spacing:.5px; color:#e2e8f0; }
.roadmap ul { margin:0; padding-left:1.1rem; display:grid; gap:.35rem; font-size:.8rem; color:#b8c9d8; }
@keyframes pulse { 0%,100% { transform:scale(1); opacity:.55;} 50% { transform:scale(1.15); opacity:.35;} }
@keyframes spin { 0% { transform:rotate(0deg);} 100% { transform:rotate(360deg);} }
@media (max-width:1100px){ .sigint-hero { flex-direction:column; padding:2.25rem 1.6rem 2rem; } .hero-art { width:100%; order:-1; } .hero-title { font-size:2.05rem; } }
@media (max-width:700px){ .hero-title { font-size:1.85rem; } .hero-tagline { font-size:.95rem; } }
</style>
