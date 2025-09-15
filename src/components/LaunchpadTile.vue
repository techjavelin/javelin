<template>
  <div class="launch-tile" :class="{ 'no-access': !canLaunch }">
    <div class="lt-header">
      <div class="lt-head-left">
        <slot name="icon">
          <div v-if="icon" class="lt-icon" aria-hidden="true">{{ icon }}</div>
        </slot>
        <h2 class="lt-title">{{ title }}</h2>
      </div>
      <slot name="badge">
        <span v-if="status" class="lt-badge" :data-variant="statusVariant">{{ status }}</span>
      </slot>
    </div>
    <p class="lt-desc"><slot>{{ description }}</slot></p>
    <div class="lt-actions" role="group" :aria-label="title + ' actions'">
      <template v-if="canLaunch">
        <button class="lt-btn primary" @click="emit('launch')">Launch</button>
        <button class="lt-btn secondary" @click="emit('learn')">Learn More</button>
      </template>
      <template v-else>
        <button class="lt-btn secondary" @click="emit('learn')">Learn More</button>
      </template>
    </div>
    <slot name="footer" />
  </div>
</template>
<script setup lang="ts">
interface Props {
  title: string
  description?: string
  canLaunch: boolean
  icon?: string
  status?: string
  statusVariant?: 'default' | 'beta' | 'new' | 'soon'
}
const props = defineProps<Props>()
const emit = defineEmits<{ (e:'launch'):void; (e:'learn'):void }>()
</script>
<style scoped>
.launch-tile { background:#181e2a; border:1px solid #243048; border-radius:18px; padding:2rem 1.75rem 1.75rem; display:flex; flex-direction:column; position:relative; overflow:hidden; backdrop-filter:blur(6px); min-width:260px; }
.launch-tile:before { content:""; position:absolute; inset:0; background:linear-gradient(125deg,rgba(96,165,250,0.08),rgba(99,102,241,0.04),rgba(15,23,42,0)); pointer-events:none; }
.lt-header { display:flex; align-items:flex-start; justify-content:space-between; gap:.75rem; margin-bottom:.35rem; }
.lt-head-left { display:flex; align-items:center; gap:.75rem; }
.lt-icon { width:42px; height:42px; border-radius:14px; background:linear-gradient(145deg,#1e3a8a,#1e40af); display:flex; align-items:center; justify-content:center; font-size:1.2rem; font-weight:600; color:#93c5fd; box-shadow:0 4px 12px -4px rgba(30,64,175,.5); }
.lt-title { font-size:1.35rem; font-weight:600; margin:0 0 .65rem; letter-spacing:.5px; color:#e2e8f0; }
.lt-desc { margin:0 0 1.4rem; line-height:1.5; font-size:.92rem; color:#c8d2e3; }
.lt-actions { display:flex; flex-direction:row; gap:1rem; }
.lt-btn { background:#334155; color:#e2e8f0; border:none; border-radius:10px; padding:.75rem 1.25rem; font-size:.8rem; font-weight:600; cursor:pointer; letter-spacing:.04em; transition:background .18s, transform .18s; }
.lt-btn.primary { background:#2563eb; color:#fff; box-shadow:0 4px 14px -4px rgba(37,99,235,0.45); }
.lt-btn.primary:hover { background:#1d4ed8; }
.lt-btn.secondary:hover { background:#475569; }
.lt-btn:active { transform:translateY(1px); }
.no-access { opacity:.95; }
.lt-badge { font-size:.55rem; text-transform:uppercase; letter-spacing:.08em; font-weight:600; padding:.35rem .55rem .3rem; border-radius:6px; background:#1e293b; color:#93c5fd; border:1px solid #334155; align-self:flex-start; }
.lt-badge[data-variant="beta"] { background:#3730a3; border-color:#4f46e5; color:#c7d2fe; }
.lt-badge[data-variant="new"] { background:#065f46; border-color:#059669; color:#d1fae5; }
.lt-badge[data-variant="soon"] { background:#433155; border-color:#6d28d9; color:#e9d5ff; }
@media (max-width:700px){ .launch-tile { padding:1.6rem 1.25rem 1.4rem; } .lt-title { font-size:1.25rem; } }
</style>
