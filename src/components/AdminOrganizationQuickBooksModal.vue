<template>
  <div v-if="open" class="qb-modal-backdrop" @keydown.esc="close">
    <div class="qb-modal" role="dialog" aria-modal="true">
      <header class="qb-head">
        <h3>Associate QuickBooks Client</h3>
        <button class="close" @click="close">×</button>
      </header>
      <section class="qb-body">
        <div class="info-box" v-if="org">
          <p class="org-name">Organization: <strong>{{ org.name }}</strong></p>
          <p v-if="org.quickbooksClientId" class="linked">Currently Linked: <strong>{{ org.quickbooksClientName || org.quickbooksClientId }}</strong></p>
        </div>
        <div class="field">
          <label>Search QuickBooks Clients</label>
          <input v-model="query" @input="onQuery" :placeholder="`Try: ${org?.name || 'Acme Corp'}`" />
        </div>
        <div class="results" v-if="query">
          <div v-if="loading" class="loading">Searching…</div>
          <div v-else-if="error" class="error">{{ error }}</div>
          <ul v-else class="result-list">
            <li v-for="c in results" :key="c.id" :class="{ selected: selectedId===c.id }" @click="select(c)">
              <div class="line">
                <span class="r-name">{{ c.name }}</span>
                <span class="r-email" v-if="c.email">{{ c.email }}</span>
              </div>
              <div class="sub" v-if="c.companyName && c.companyName !== c.name">{{ c.companyName }}</div>
            </li>
            <li v-if="!results.length" class="empty">No matches.</li>
          </ul>
        </div>
        <div class="actions">
          <button class="secondary" @click="close">Cancel</button>
          <button class="primary" :disabled="!selectedId || saving" @click="save">{{ saving ? 'Saving…' : 'Save Association' }}</button>
        </div>
      </section>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Schema } from '../../amplify/data/resource'
import { useQuickBooksClients } from '@/composables/useQuickBooksClients'
import { useOrganizations } from '@/composables/useOrganizations'

interface Props { open:boolean; org: Schema['Organization']['type'] | null }
const props = defineProps<Props>()
const emit = defineEmits(['close','updated'])

const { results, search, loading, error } = useQuickBooksClients()
const { updateOrganization } = useOrganizations()

const query = ref('')
const selectedId = ref<string | null>(null)
const selectedName = ref<string | null>(null)
const saving = ref(false)

watch(() => props.open, (o) => { if (o) init() })

function init(){
  query.value = props.org?.name || ''
  selectedId.value = props.org?.quickbooksClientId || null
  selectedName.value = props.org?.quickbooksClientName || null
  if(query.value) search(query.value)
}

let debounce: any = null
function onQuery(){
  clearTimeout(debounce)
  const q = query.value
  debounce = setTimeout(()=>{ if(q.trim()) search(q.trim()) }, 350)
}

function select(c: any){ selectedId.value = c.id; selectedName.value = c.name }

async function save(){
  if (!props.org || !selectedId.value) return
  saving.value = true
  try {
    await updateOrganization(props.org.id, { quickbooksClientId: selectedId.value, quickbooksClientName: selectedName.value || undefined })
    emit('updated')
    close()
  } finally { saving.value=false }
}

function close(){ emit('close') }

</script>
<style scoped>
.qb-modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.55); display:flex; align-items:center; justify-content:center; padding:1rem; z-index:1100; }
.qb-modal { width:560px; max-width:100%; background:#0f172a; border:1px solid #243049; border-radius:12px; display:flex; flex-direction:column; }
.qb-head { display:flex; align-items:center; justify-content:space-between; padding:.9rem 1rem .65rem; border-bottom:1px solid #243049; }
.qb-head h3 { margin:0; font-size:.85rem; letter-spacing:.06em; }
.close { background:transparent; border:none; color:#94a3b8; font-size:1rem; cursor:pointer; }
.qb-body { padding:1rem 1rem 1.1rem; display:flex; flex-direction:column; gap:.9rem; }
.field label { font-size:.55rem; letter-spacing:.06em; opacity:.75; display:block; margin:0 0 .35rem; }
input { background:#1e293b; border:1px solid #334155; color:#fff; padding:.55rem .65rem; font-size:.65rem; border-radius:6px; width:100%; font-family:inherit; }
.loading { font-size:.6rem; opacity:.7; }
.error { font-size:.6rem; color:#f87171; }
.result-list { list-style:none; margin:0; padding:0; max-height:260px; overflow:auto; display:flex; flex-direction:column; gap:4px; }
.result-list li { background:#162132; border:1px solid #1e2c42; padding:.55rem .65rem; border-radius:6px; cursor:pointer; display:flex; flex-direction:column; gap:2px; }
.result-list li:hover { background:#1e2c42; }
.result-list li.selected { outline:2px solid #2563eb; background:#1e3a5f; }
.r-name { font-size:.65rem; font-weight:600; letter-spacing:.04em; }
.r-email { font-size:.55rem; opacity:.7; margin-left:.4rem; }
.line { display:flex; align-items:center; gap:.25rem; }
.sub { font-size:.5rem; opacity:.6; }
.empty { font-size:.6rem; opacity:.6; padding:.5rem .25rem; }
.actions { display:flex; justify-content:flex-end; gap:.6rem; margin-top:.25rem; }
button.primary { background:#2563eb; color:#fff; border:none; padding:.55rem 1rem; font-size:.6rem; border-radius:6px; cursor:pointer; }
button.primary:disabled { opacity:.5; cursor:not-allowed; }
button.secondary { background:#334155; color:#fff; border:none; padding:.55rem .9rem; font-size:.6rem; border-radius:6px; cursor:pointer; }
.info-box { background:#162132; border:1px solid #243049; padding:.6rem .75rem; border-radius:8px; font-size:.55rem; display:flex; flex-direction:column; gap:.3rem; }
.org-name { margin:0; }
.linked { margin:0; color:#93c5fd; }
</style>
