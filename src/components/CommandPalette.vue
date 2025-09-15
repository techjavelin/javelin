<template>
  <transition name="cp-fade">
  <div v-if="isOpen" class="cp-overlay" role="dialog" aria-modal="true" aria-label="Command Palette">
      <div class="cp-panel">
        <input
          ref="inputEl"
          v-model="queryProxy"
          class="cp-input"
          type="text"
          placeholder="Type a command or search..."
          @keydown.down.prevent="focusNext"
          @keydown.up.prevent="focusPrev"
          @keydown.enter.prevent="activateFocused"
          @keydown.esc.prevent="palette.closePalette()"
        />
        <div class="cp-meta-row">
          <span class="hint">Press Esc to close • {{ results.length }} result{{ results.length===1?'':'s' }}</span>
          <span v-if="runningCommandId" class="running">Running…</span>
        </div>
        <div v-if="!currentQuery && recents.length" class="cp-recents">
          <div class="recents-label">Recent</div>
          <ul class="recents-list">
            <li v-for="r in recents" :key="r.id" class="recent-item" @click="run(r)">{{ r.title }}</li>
          </ul>
        </div>
        <ul class="cp-results" role="listbox">
          <li v-for="(cmd,i) in results" :key="cmd.id" :class="['cp-item', { focused: i===focused }]" role="option" @mouseenter="focused=i" @click="run(cmd)">
            <span class="cp-title">{{ cmd.title }}</span>
            <span class="cp-group" v-if="cmd.group">{{ cmd.group }}</span>
          </li>
          <li v-if="results.length===0" class="cp-empty">No matches</li>
        </ul>
      </div>
    </div>
  </transition>
</template>
<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { useGlobalCommandPalette } from '../composables/useCommandPalette'
const palette = useGlobalCommandPalette()
const focused = ref(0)
const inputEl = ref<HTMLInputElement | null>(null)
const isOpen = computed(()=> palette.open.value)
const results = computed(()=>palette.results.value)
const recents = computed(()=>palette.recents.value)
const currentQuery = computed(()=> palette.query.value)
const runningCommandId = computed(()=> palette.runningCommandId.value)
// v-model cannot safely bind directly to a Ref stored on an object (would overwrite the Ref);
// provide a proxy computed to get/set the inner value.
const queryProxy = computed({
  get: ()=> palette.query.value,
  set: (v: string)=> { palette.query.value = v }
})

// Watch the *values* of the refs
watch(isOpen, (v)=>{ if(v) nextTick(()=>{ focused.value=0; inputEl.value?.focus() }) })
watch(currentQuery, ()=>{ focused.value=0 })

function focusNext(){ if(results.value.length) focused.value = (focused.value+1) % results.value.length }
function focusPrev(){ if(results.value.length) focused.value = (focused.value-1+results.value.length) % results.value.length }
function activateFocused(){ const cmd = results.value[focused.value]; if(cmd) run(cmd) }
function run(cmd:any){ palette.run(cmd) }
</script>
<style scoped>
.cp-overlay { position:fixed; inset:0; background:rgba(15,23,42,0.55); backdrop-filter: blur(6px); z-index:2500; display:flex; align-items:flex-start; justify-content:center; padding:6vh 1rem 2rem; }
.cp-panel { width:100%; max-width:640px; background:var(--color-bg-light,#1e293b); border:1px solid rgba(255,255,255,0.12); border-radius:var(--radius-lg,12px); box-shadow:var(--shadow-popover,0 6px 22px -4px rgba(0,0,0,0.45)); padding:1rem 1rem .75rem; display:flex; flex-direction:column; }
.cp-input { width:100%; padding:.75rem .9rem; border:1px solid rgba(255,255,255,0.18); background:rgba(255,255,255,0.05); color:#e2e8f0; border-radius:var(--radius-md,8px); font-size:.9rem; outline:none; }
.cp-input:focus { border-color:#60a5fa; }
.cp-meta-row { display:flex; justify-content:space-between; align-items:center; font-size:.6rem; margin-top:.4rem; padding:0 .2rem; color:#64748b; text-transform:uppercase; letter-spacing:.08em; }
.cp-meta-row .running { color:#60a5fa; animation:pulse 1s ease-in-out infinite; }
@keyframes pulse { 0%,100%{ opacity:1 } 50%{ opacity:.3 } }
.cp-recents { margin-top:.65rem; }
.recents-label { font-size:.6rem; font-weight:600; opacity:.65; letter-spacing:.08em; margin:0 0 .25rem .2rem; text-transform:uppercase; }
.recents-list { list-style:none; margin:0 0 .25rem; padding:0; display:flex; flex-wrap:wrap; gap:.4rem; }
.recent-item { background:rgba(255,255,255,0.07); padding:.35rem .55rem; border-radius:6px; font-size:.65rem; cursor:pointer; color:#cbd5e1; transition:background .18s; }
.recent-item:hover { background:rgba(255,255,255,0.15); color:#fff; }
.cp-results { list-style:none; margin:.5rem 0 0; padding:0; max-height:50vh; overflow-y:auto; }
.cp-item { display:flex; align-items:center; justify-content:space-between; padding:.55rem .65rem; border-radius:6px; font-size:.8rem; cursor:pointer; color:#cbd5e1; }
.cp-item:hover, .cp-item.focused { background:rgba(255,255,255,0.12); color:#fff; }
.cp-title { flex:1; }
.cp-group { font-size:.65rem; text-transform:uppercase; letter-spacing:.05em; opacity:.7; margin-left:.75rem; }
.cp-empty { padding:.65rem; text-align:center; font-size:.75rem; opacity:.7; }
.cp-fade-enter-active, .cp-fade-leave-active { transition: opacity var(--transition-medium,180ms) var(--easing-standard,cubic-bezier(.4,0,.2,1)); }
.cp-fade-enter-from, .cp-fade-leave-to { opacity:0; }
</style>