<template>
  <PageWrapper>
    <div class="preferences-container">
      <header class="page-header">
        <div class="page-headings">
          <h1>Preferences</h1>
          <p>Customize your experience and manage privacy & data settings.</p>
        </div>
      </header>
  <div class="preferences-grid animate-grid">
        <!-- Appearance Card -->
  <Card variant="info" class="pref-card" data-anim-index="0">
          <template #default>
            <div class="card-section">
              <div class="card-header-row">
                <h2 class="section-title">Appearance</h2>
                <span class="section-sub">Interface theme & display</span>
              </div>
              <div class="theme-options modern">
                <button @click="setTheme('light')" :class="['theme-choice', { active: currentTheme==='light' }]">
                  <span class="preview light"/><span class="label">Light</span>
                </button>
                <button @click="setTheme('dark')" :class="['theme-choice', { active: currentTheme==='dark' }]">
                  <span class="preview dark"/><span class="label">Dark</span>
                </button>
                <button @click="setTheme('auto')" :class="['theme-choice', { active: currentTheme==='auto' }]">
                  <span class="preview auto"/><span class="label">Auto</span>
                </button>
              </div>
              <p class="help-text">Auto matches your system preference and updates in real-time. See <router-link to="/cookies-policy">Cookie Policy</router-link> for storage details.</p>
            </div>
          </template>
        </Card>
        <!-- Privacy & Cookies Card -->
  <Card variant="info" class="pref-card" data-anim-index="1">
          <template #default>
            <div class="card-section">
              <div class="card-header-row">
                <h2 class="section-title">Privacy & Cookies</h2>
                <span class="section-sub">Consent & personalization</span>
              </div>
              <div class="consent-status">
                <div class="status-row" v-for="row in consentRows" :key="row.key">
                  <span class="k">{{ row.label }}</span>
                  <span class="v" :class="row.class">{{ row.value }}</span>
                </div>
              </div>
              <p class="help-text">Review data handling in our <router-link to="/gdpr-notice">GDPR Notice</router-link>.</p>
              <div class="actions-row">
                <button class="btn ghost" @click="reopenBanner">Reopen Banner</button>
                <button class="btn warn" @click="resetPersonalization">Reset Personalization</button>
              </div>
            </div>
          </template>
        </Card>
        <!-- Data & Export Card -->
        <Card variant="info" class="pref-card" data-anim-index="2">
          <template #default>
            <div class="card-section">
              <div class="card-header-row">
                <h2 class="section-title">Data & Export</h2>
                <span class="section-sub">Portability & control</span>
              </div>
              <p class="help-text">Download a portable JSON snapshot of key client-side preferences & consent. This does not include server-side records (contact support for full export).</p>
              <div class="data-actions">
                <button class="btn ghost" @click="exportData">Download JSON</button>
                <button class="btn ghost" @click="copyData">Copy JSON</button>
                <button class="btn warn" @click="triggerDeletion">Request Deletion</button>
              </div>
              <p v-if="exportStatus" class="export-status" :class="exportStatus.type">{{ exportStatus.message }}</p>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </PageWrapper>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import Card from '@/components/Card.vue'
// Functional storage keys central list
const FUNCTIONAL_KEYS = ['user-theme','cp.recents.v1','cp.hideUnauthorized.v1','adminSidebarCollapsed','appSidebarCollapsed','sigintSidebarCollapsed']
const currentTheme = ref('light')
const cookieConsent = ref({ essential: true, analytics: false, marketing: false, functional: false })

const setTheme = (theme) => {
  currentTheme.value = theme
  const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  persistTheme(theme)
}

function persistTheme(theme){
  try {
    const consentRaw = localStorage.getItem('cookie-consent')
    if(consentRaw){
      const parsed = JSON.parse(consentRaw)
      if(parsed.functional){
        localStorage.setItem('user-theme', theme)
        return
      }
    }
    // Functional not allowed; keep transient session fallback
    sessionStorage.setItem('pending-theme', theme)
  } catch {/* ignore */}
}

function reopenBanner(){
  window.dispatchEvent(new Event('show-cookie-banner'))
}

function resetPersonalization(){
  // Remove functional keys
  FUNCTIONAL_KEYS.forEach(k => localStorage.removeItem(k))
  // Update consent record: turn off functional only (preserve analytics/marketing decisions)
  try {
    const raw = localStorage.getItem('cookie-consent')
    if(raw){
      const parsed = JSON.parse(raw)
      parsed.functional = false
      parsed.timestamp = new Date().toISOString()
      localStorage.setItem('cookie-consent', JSON.stringify(parsed))
      cookieConsent.value.functional = false
    }
  } catch {/* ignore */}
  // Signal to application
  window.dispatchEvent(new CustomEvent('personalization-reset'))
}

const consentRows = computed(()=>[
  { key:'essential', label:'Essential', value:'Always Enabled', class:'badge essential' },
  { key:'analytics', label:'Analytics', value: cookieConsent.value.analytics ? 'Enabled':'Disabled', class: 'badge ' + (cookieConsent.value.analytics?'on':'off') },
  { key:'marketing', label:'Marketing', value: cookieConsent.value.marketing ? 'Enabled':'Disabled', class: 'badge ' + (cookieConsent.value.marketing?'on':'off') },
  { key:'functional', label:'Functional', value: cookieConsent.value.functional ? 'Enabled':'Disabled', class: 'badge ' + (cookieConsent.value.functional?'on':'off') }
])

onMounted(() => {
  try {
    // Unified key is 'cookie-consent'; maintain backward compat for legacy 'cookieConsent'
    const primary = localStorage.getItem('cookie-consent')
    const legacy = !primary ? localStorage.getItem('cookieConsent') : null
    const payload = primary || legacy
    if (payload) {
      cookieConsent.value = { ...cookieConsent.value, ...JSON.parse(payload) }
    }
    // Load persisted theme preference if available
    const storedTheme = localStorage.getItem('user-theme') || sessionStorage.getItem('pending-theme')
    if(storedTheme){ setTheme(storedTheme) }
  } catch (e) {
    console.warn('Unable to load settings:', e)
  }
})

// Data export state & helpers
const exportStatus = ref(null)

function collectExport(){
  const consent = localStorage.getItem('cookie-consent')
  const theme = localStorage.getItem('user-theme')
  const recents = localStorage.getItem('cp.recents.v1')
  const pins = localStorage.getItem('cp.pins.v1')
  const hide = localStorage.getItem('cp.hideUnauthorized.v1')
  return {
    generatedAt: new Date().toISOString(),
    consent: consent ? JSON.parse(consent) : null,
    theme: theme || null,
    commandPalette: {
      recents: recents ? JSON.parse(recents) : null,
      pins: pins ? JSON.parse(pins) : null,
      hideUnauthorized: hide === 'true'
    }
  }
}

function exportData(){
  try {
    const blob = new Blob([JSON.stringify(collectExport(), null, 2)], { type:'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'javelin-preferences-export.json'
    a.click()
    URL.revokeObjectURL(url)
    exportStatus.value = { type:'success', message:'Download started.' }
  } catch(e){
    exportStatus.value = { type:'error', message:'Export failed.' }
  } finally { setTimeout(()=> exportStatus.value=null, 4000) }
}

async function copyData(){
  try {
    await navigator.clipboard.writeText(JSON.stringify(collectExport(), null, 2))
    exportStatus.value = { type:'success', message:'Copied to clipboard.' }
  } catch(e){
    exportStatus.value = { type:'error', message:'Copy failed.' }
  } finally { setTimeout(()=> exportStatus.value=null, 3500) }
}

function triggerDeletion(){
  // Placeholder: in production this might open a modal or route to a DSAR form.
  window.dispatchEvent(new CustomEvent('dsar-deletion-requested'))
  exportStatus.value = { type:'success', message:'Deletion request event dispatched.' }
  setTimeout(()=> exportStatus.value=null, 4500)
}
 </script>

<style scoped>
.preferences-container { max-width: 1100px; margin: 0 auto; padding: 1.5rem 1.25rem 3rem; }
.page-header { margin-bottom: 1.75rem; background:transparent; box-shadow:none; padding:.25rem .25rem 0; }
.page-header::before { content:''; display:none; }
.page-headings h1 { font-size: 2.1rem; font-weight: 600; margin:0 0 .4rem; letter-spacing:-0.5px; }
.page-headings p { font-size: .95rem; opacity:.75; margin:0; }

.preferences-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:1.25rem; align-items:start; }
.pref-card { --card-pad:1.4rem; }
.data-actions { display:flex; flex-wrap:wrap; gap:.55rem; margin-top:.25rem; }
.export-status { font-size:.65rem; margin-top:.5rem; font-weight:600; letter-spacing:.05em; }
.export-status.success { color:#059669; }
.export-status.error { color:#dc2626; }

/* Inline docs links */
.help-text a { color:#2566af; text-decoration:underline; }
[data-theme='dark'] .help-text a { color:#64b5f6; }

/* Card entrance animation */
.animate-grid { --stagger:110ms; }
.animate-grid .pref-card { opacity:0; transform:translateY(12px); animation:cardIn .6s cubic-bezier(.4,0,.2,1) forwards; }
.animate-grid .pref-card[data-anim-index="0"] { animation-delay:calc(var(--stagger)*0); }
.animate-grid .pref-card[data-anim-index="1"] { animation-delay:calc(var(--stagger)*1); }
.animate-grid .pref-card[data-anim-index="2"] { animation-delay:calc(var(--stagger)*2); }
@keyframes cardIn { to { opacity:1; transform:translateY(0) } }

.card-section { display:flex; flex-direction:column; gap:1rem; }
.card-header-row { display:flex; flex-direction:column; gap:.2rem; }
.section-title { font-size:1.15rem; margin:0; font-weight:600; }
.section-sub { font-size:.7rem; text-transform:uppercase; letter-spacing:.08em; opacity:.6; }

/* Theme choices */
.theme-options.modern { display:flex; gap:.75rem; flex-wrap:wrap; }
.theme-choice { position:relative; display:flex; flex-direction:column; align-items:center; gap:.45rem; padding:.9rem .85rem; min-width:84px; border:1px solid var(--border-color,rgba(0,0,0,0.15)); background:var(--card-bg,#fff); border-radius:10px; cursor:pointer; font-size:.7rem; letter-spacing:.03em; font-weight:500; transition:.25s border-color,.25s background,.25s transform; }
.theme-choice .preview { width:28px; height:28px; border-radius:50%; border:1px solid rgba(0,0,0,0.15); box-shadow:0 1px 2px rgba(0,0,0,0.08); }
.theme-choice .preview.light { background:#fff; }
.theme-choice .preview.dark { background:#111827; }
.theme-choice .preview.auto { background:linear-gradient(45deg,#fff 50%,#111827 50%); }
.theme-choice.active { border-color:#2566af; box-shadow:0 0 0 2px rgba(37,102,175,0.25); }
.theme-choice:hover { transform:translateY(-2px); }
.help-text { font-size:.7rem; opacity:.55; margin:0; }

/* Consent status */
.consent-status { display:flex; flex-direction:column; gap:.4rem; margin-top:.25rem; }
.status-row { display:flex; justify-content:space-between; align-items:center; padding:.55rem .75rem; background:var(--status-bg,rgba(0,0,0,0.035)); border:1px solid var(--status-border,rgba(0,0,0,0.06)); border-radius:8px; font-size:.75rem; }
.status-row .k { font-weight:600; letter-spacing:.03em; }
.badge { padding:.25rem .6rem; border-radius:20px; font-size:.65rem; font-weight:600; letter-spacing:.05em; }
.badge.essential { background:linear-gradient(90deg,#4ade80,#16a34a); color:#0b3016; }
.badge.on { background:linear-gradient(90deg,#2566af,#4a8bc2); color:#fff; }
.badge.off { background:linear-gradient(90deg,#f87171,#dc2626); color:#fff; }

.actions-row { display:flex; gap:.6rem; margin-top:.4rem; flex-wrap:wrap; }
.btn { font-family:inherit; font-size:.72rem; padding:.6rem .95rem; border-radius:8px; border:1px solid rgba(0,0,0,0.12); background:#ffffff; cursor:pointer; font-weight:600; letter-spacing:.03em; line-height:1; display:inline-flex; align-items:center; gap:.4rem; transition:.25s background,.25s color,.25s border-color,.25s box-shadow,.25s transform; color:#0f172a; }
.btn.ghost { background:linear-gradient(180deg,#f9fafb,#f1f5f9); border-color:rgba(0,0,0,0.08); }
.btn.ghost:hover { background:linear-gradient(180deg,#ffffff,#f1f5f9); box-shadow:0 2px 4px rgba(0,0,0,0.08); }
.btn:focus-visible { outline:2px solid #2566af; outline-offset:2px; }
.btn:active { transform:translateY(0); box-shadow:0 1px 2px rgba(0,0,0,0.2) inset; }
.btn.warn { background:linear-gradient(90deg,#dc2626,#b91c1c); color:#fff; border:none; }
.btn:hover { transform:translateY(-2px); }
.btn.warn:hover { filter:brightness(1.05); }

/* Dark mode adjustments */
[data-theme='dark'] .preferences-container { --card-bg:#1f2937; --border-color:rgba(255,255,255,0.14); --status-bg:rgba(255,255,255,0.06); --status-border:rgba(255,255,255,0.12); }
[data-theme='dark'] .page-headings h1 { color:#64b5f6; }
[data-theme='dark'] .page-headings p { opacity:.6; }
[data-theme='dark'] .theme-choice { border-color:rgba(255,255,255,0.18); background:#1f2937; }
[data-theme='dark'] .theme-choice .preview.light { background:#f1f5f9; }
[data-theme='dark'] .theme-choice .preview.dark { background:#0f172a; }
[data-theme='dark'] .theme-choice.active { box-shadow:0 0 0 2px rgba(100,181,246,0.35); }
[data-theme='dark'] .btn { background:#1e293b; border-color:rgba(255,255,255,0.18); color:#e2e8f0; }
[data-theme='dark'] .btn.ghost { background:linear-gradient(180deg,#243049,#1e293b); }
[data-theme='dark'] .btn.ghost:hover { background:linear-gradient(180deg,#2f3d54,#243049); }
[data-theme='dark'] .btn:hover { background:#32415b; }
[data-theme='dark'] .status-row { background:rgba(255,255,255,0.05); border-color:rgba(255,255,255,0.12); }
[data-theme='dark'] .badge.essential { color:#042d16; }
</style>