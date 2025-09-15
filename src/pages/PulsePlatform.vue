
<template>
  <PageWrapper title="Pulse Platform Launchpad">
  <section class="launchpad-hero">
    <div class="hero-left">
      <h1 class="lp-title">Pulse Platform <span class="gradient-text">Launchpad</span></h1>
      <p class="lp-tagline">Unified entry point for intelligence, offensive security, and operational tooling. Choose a module to launch.</p>
      <div class="hero-badges">
        <span class="badge">Modular</span>
        <span class="badge">Secure</span>
        <span class="badge">Extensible</span>
      </div>
    </div>
    <div class="hero-art">
      <img src="@/assets/launchpad-rocket.svg" alt="Launchpad Rocket" class="rocket-art" />
      <div class="orb orb-a" />
      <div class="orb orb-b" />
    </div>
  </section>
    <div class="card-grid">
      <LaunchpadTile
        v-for="m in modules"
        :key="m.key"
        :title="m.title"
        :description="m.description"
  :canLaunch="m.canLaunch()"
        :icon="m.icon"
        :status="m.status"
        :status-variant="m.statusVariant"
        @launch="() => handleLaunch(m)"
        @learn="() => handleLearn(m)"
      />
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">

import { onMounted } from 'vue'
import PageWrapper from '@/components/PageWrapper.vue'
import { useAuth } from '@/composables/useAuth'
import LaunchpadTile from '@/components/LaunchpadTile.vue'
import { useLaunchpadModules } from '@/composables/useLaunchpadModules'

const { loadCurrentUser } = useAuth()
const { modules } = useLaunchpadModules()

onMounted(async () => {
  // Ensure user groups are loaded early; modules computed reacts afterwards
  try { await loadCurrentUser() } catch (e) { /* ignore */ }
})

function onSigIntLaunch() {
  window.location.href = '/sigint'
}

function onSigIntLearnMore() { window.location.href = '/pulse/sigint' }

function onPentesterLaunch() {
  window.location.href = '/pentester'
}

function onPentesterLearnMore() {
  window.open('https://docs.pulse.techjavelin.com/pentester', '_blank')
}

function handleLaunch(m: any) { m.launch() }
function handleLearn(m: any) { m.learn?.() }
</script>

<style scoped>
.card-grid {
  display: flex;
  gap: 2rem;
  margin-top: 2rem;
}
/* LaunchpadTile styles are self-contained; legacy module styles removed */
@media (max-width:900px){ .card-grid { flex-direction:column; } .module-card { max-width:100%; } }
/* Launchpad Branding */
.launchpad-hero { display:flex; flex-direction:row; align-items:stretch; gap:3rem; padding:2.25rem 2rem 1.75rem; position:relative; border:1px solid #243048; border-radius:26px; background:radial-gradient(circle at 20% 25%, #1d2a3d 0%, #111926 65%, #0d141e 100%); overflow:hidden; }
.launchpad-hero:before { content:""; position:absolute; inset:0; background:linear-gradient(135deg, rgba(59,130,246,0.18), rgba(99,102,241,0.05) 40%, rgba(17,24,39,0)); pointer-events:none; }
.hero-left { flex:1; display:flex; flex-direction:column; justify-content:center; z-index:2; }
.lp-title { font-size:2.75rem; font-weight:800; margin:0 0 .9rem; letter-spacing:.5px; line-height:1.1; background:linear-gradient(90deg,#f1f5f9,#cbd5e1); -webkit-background-clip:text; background-clip:text; color:transparent; }
.gradient-text { background:linear-gradient(90deg,#60a5fa,#3b82f6,#6366f1); -webkit-background-clip:text; background-clip:text; color:transparent; }
.lp-tagline { margin:0 0 1.2rem; font-size:1.05rem; line-height:1.5; color:#c3d0e3; max-width:680px; }
.hero-badges { display:flex; flex-wrap:wrap; gap:.6rem; }
.badge { background:#1e293b; color:#93c5fd; font-size:.65rem; letter-spacing:.08em; padding:.45rem .7rem .4rem; border:1px solid #334155; border-radius:30px; font-weight:600; text-transform:uppercase; }
.hero-art { position:relative; width:300px; display:flex; align-items:center; justify-content:center; }
.rocket-art { width:100%; max-width:240px; filter:drop-shadow(0 12px 22px rgba(59,130,246,0.35)); animation:float 6s ease-in-out infinite; }
.orb { position:absolute; border-radius:50%; filter:blur(28px); opacity:.55; }
.orb-a { width:180px; height:180px; background:radial-gradient(circle,#1d4ed8,#1e3a8a 70%); top:10%; left:10%; animation:pulse 8s linear infinite; }
.orb-b { width:140px; height:140px; background:radial-gradient(circle,#6366f1,#312e81 70%); bottom:8%; right:5%; animation:pulse 10s linear infinite reverse; }
@keyframes float { 0%,100% { transform:translateY(-6px); } 50% { transform:translateY(6px); } }
@keyframes pulse { 0%,100% { transform:scale(1); opacity:.55;} 50% { transform:scale(1.15); opacity:.35;} }
@media (max-width:1100px){ .launchpad-hero { flex-direction:column; padding:2rem 1.5rem 1.75rem; } .hero-art { width:100%; order:-1; } .lp-title { font-size:2.25rem; } }
@media (max-width:700px){ .lp-title { font-size:2rem; } .lp-tagline { font-size:.95rem; } }
</style>
