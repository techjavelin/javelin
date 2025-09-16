<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Schema } from '../../amplify/data/resource'
import { useEngagements } from '@/composables/useEngagements'
import { useAuthorization } from '@/composables/useAuthorization'
import { useToasts } from '@/composables/useToasts'

interface Props {
  engagement: Schema['Engagement']['type'] | null
  modelValue: boolean
}
const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue','saved'])

const { updateMeta, updateState } = useEngagements()
const { has } = useAuthorization()
const { add: addToast } = useToasts()

const form = ref({
  title: '',
  code: '',
  phase: 'PLANNING',
  status: 'ACTIVE',
  startDate: '',
  endDate: '',
  actualStart: '',
  actualEnd: '',
  contacts: ''
})

const locked = computed(() => !!props.engagement?.actualStart)
const canManage = computed(() => props.engagement && has('ENG.MANAGE',{ engagementId: props.engagement.id }))

watch(() => props.engagement, (e) => {
  if (!e) return
  form.value = {
    title: e.title || '',
    code: e.code || '',
    phase: e.phase || 'PLANNING',
    status: e.status || 'ACTIVE',
    startDate: e.startDate || '',
    endDate: e.endDate || '',
    actualStart: e.actualStart || '',
    actualEnd: e.actualEnd || '',
  contacts: (Array.isArray(e.contacts) ? e.contacts : []).join('\n')
  }
},{ immediate: true })

const busy = ref(false)

async function save() {
  if (!props.engagement) return
  if (!canManage.value) { addToast({ title:'Forbidden', message:'Missing ENG.MANAGE', type:'error' }); return }
  busy.value = true
  try {
    const metaPatch: any = {
      title: form.value.title.trim() || undefined,
      code: form.value.code.trim() || undefined,
      startDate: form.value.startDate || undefined,
      endDate: form.value.endDate || undefined,
      actualStart: form.value.actualStart || undefined,
      actualEnd: form.value.actualEnd || undefined,
      contacts: form.value.contacts ? form.value.contacts.split(/\n+/).map(s=>s.trim()).filter(Boolean) : undefined,
    }
    const statePatch: any = {
      phase: form.value.phase,
      status: form.value.status
    }
    const updatedMeta = await updateMeta(props.engagement.id, metaPatch)
    const updatedState = await updateState(props.engagement.id, statePatch)
    const merged = { ...props.engagement, ...updatedMeta, ...updatedState }
    addToast({ title:'Saved', message:'Engagement updated', type:'success' })
    emit('saved', merged)
    emit('update:modelValue', false)
  } catch (e:any) {
    addToast({ title:'Error', message: e.message || 'Failed to update engagement', type:'error' })
  } finally { busy.value = false }
}

function close() { emit('update:modelValue', false) }
</script>

<template>
  <div v-if="modelValue && engagement" class="modal-overlay">
    <div class="modal">
      <header class="modal-header">
        <h2 class="title">Edit Engagement</h2>
        <button class="icon-btn" @click="close">✕</button>
      </header>
      <div class="modal-body">
        <div v-if="!canManage" class="forbidden">You lack ENG.MANAGE capability.</div>
        <div class="form-grid" v-else>
          <label class="field span-2">
            <span>Title</span>
            <input v-model="form.title" placeholder="Title" />
          </label>
          <label class="field">
            <span>Code</span>
            <input v-model="form.code" placeholder="Code" />
          </label>
          <label class="field">
            <span>Phase</span>
            <select v-model="form.phase">
              <option value="PLANNING">PLANNING</option>
              <option value="EXECUTION">EXECUTION</option>
              <option value="REPORTING">REPORTING</option>
              <option value="COMPLETE">COMPLETE</option>
            </select>
          </label>
          <label class="field">
            <span>Status</span>
            <select v-model="form.status">
              <option value="ACTIVE">ACTIVE</option>
              <option value="ON_HOLD">ON_HOLD</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </label>
          <label class="field">
            <span>Planned Start</span>
            <input type="date" v-model="form.startDate" />
          </label>
            <label class="field">
              <span>Planned End</span>
              <input type="date" v-model="form.endDate" />
            </label>
          <label class="field">
            <span>Actual Start</span>
            <input type="date" v-model="form.actualStart" />
          </label>
          <label class="field">
            <span>Actual End</span>
            <input type="date" v-model="form.actualEnd" />
          </label>
          <label class="field span-2">
            <span>Contacts (one per line)</span>
            <textarea v-model="form.contacts" rows="3" />
          </label>
        </div>
      </div>
      <footer class="modal-footer">
        <div class="left-info">
          <span class="lock-msg" v-if="locked">Org/App linkage locked after actual start.</span>
        </div>
        <div class="actions">
          <button class="btn" @click="close" :disabled="busy">Cancel</button>
          <button class="btn primary" @click="save" :disabled="busy || !canManage">Save</button>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:flex-start; justify-content:center; padding:4rem 1rem 2rem; overflow:auto; z-index:210; }
.modal { background:var(--color-card,#fff); color:var(--color-text,#111); border-radius:14px; width:clamp(320px,860px,95%); display:flex; flex-direction:column; max-height:100%; }
[data-theme="dark"] .modal { background:#1f2735; color:#e2e8f0; }
.modal-header { display:flex; align-items:center; justify-content:space-between; padding:1rem 1.1rem; border-bottom:1px solid var(--color-border,#e5e7eb); }
.modal-header .title { font-size:1rem; margin:0; letter-spacing:.5px; }
.modal-body { padding:1rem 1.1rem 1.25rem; overflow-y:auto; }
.modal-footer { padding:.9rem 1.1rem; border-top:1px solid var(--color-border,#e5e7eb); display:flex; gap:1rem; align-items:center; justify-content:space-between; }
.form-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:.85rem 1rem; }
.field { display:flex; flex-direction:column; gap:.35rem; font-size:.7rem; }
.field > span { font-weight:600; letter-spacing:.05em; font-size:.65rem; text-transform:uppercase; opacity:.8; }
input, select, textarea { background:var(--color-input,#f8fafc); border:1px solid var(--color-border,#d1d5db); border-radius:8px; padding:.5rem .6rem; font-size:.72rem; font-family:inherit; }
[data-theme="dark"] input,[data-theme="dark"] select,[data-theme="dark"] textarea { background:#273142; border-color:#334155; color:#e2e8f0; }
.btn { background:#e2e8f0; border:none; padding:.55rem 1rem; border-radius:8px; font-size:.7rem; font-weight:600; cursor:pointer; letter-spacing:.03em; }
.btn.primary { background:#3b82f6; color:#fff; }
.btn:disabled { opacity:.6; cursor:not-allowed; }
.icon-btn { background:transparent; border:none; cursor:pointer; font-size:1rem; line-height:1; opacity:.7; }
.icon-btn:hover { opacity:1; }
.lock-msg { font-size:.6rem; opacity:.7; }
.forbidden { background:#fee2e2; color:#991b1b; padding:.65rem .75rem; border-radius:8px; font-size:.65rem; margin-bottom:.75rem; }
[data-theme="dark"] .forbidden { background:#7f1d1d; color:#fff; }
</style>
