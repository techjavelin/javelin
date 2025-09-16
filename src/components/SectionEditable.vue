<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { marked } from 'marked'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import CapGate from '@/components/CapGate.vue'

interface Props {
  engagement: any
  field: string
  label: string
  state: { editing: boolean; draft: string }
  saving?: boolean
}
const props = defineProps<Props>()
// Accept generic string for field to remain flexible when parent uses a string union
const emit = defineEmits<{ (e:'edit', field:string):void; (e:'cancel', field:string):void; (e:'save', field:string):void }>()

const value = computed(()=> props.engagement?.[props.field] || '')
function edit(){ emit('edit', props.field) }
function cancel(){ emit('cancel', props.field) }
function save(){ emit('save', props.field) }

// Debounce auto-save (optimistic) after 1.2s idle while editing, only if draft changed and length > 0
const lastEmitted = ref('')
let timer: any = null
watch(() => props.state.draft, (val) => {
  if (!props.state.editing) return
  if (val === lastEmitted.value) return
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    if (val && val !== lastEmitted.value) {
      lastEmitted.value = val
      emit('save', props.field)
    }
  }, 1200)
})
</script>

<template>
  <div class="section-editable">
    <div class="section-head">
      <h3 class="section-label">{{ props.label }}</h3>
      <CapGate capability="ENG.MANAGE" :ctx="{ engagementId: props.engagement.id }">
        <div class="actions" v-if="!props.state.editing">
          <button type="button" class="btn subtle" @click="edit">Edit</button>
        </div>
      </CapGate>
    </div>
    <div v-if="props.state.editing" class="editor-wrap">
      <MarkdownEditor v-model="props.state.draft" :autosave-key="props.engagement.id + ':' + props.field" :show-stats="true" />
      <div class="edit-actions">
        <button class="btn primary" :disabled="props.saving" @click="save">{{ props.saving ? 'Saving…' : 'Save' }}</button>
        <button class="btn" @click="cancel" :disabled="props.saving">Cancel</button>
      </div>
    </div>
    <div v-else class="markdown-body" v-html="marked.parse(value || '*No content*')"></div>
  </div>
</template>

<style scoped>
.section-editable { display:flex; flex-direction:column; gap:.65rem; }
.section-head { display:flex; align-items:center; justify-content:space-between; gap:.5rem; }
.section-label { font-size:.85rem; margin:0; font-weight:600; letter-spacing:.04em; text-transform:uppercase; opacity:.85; }
.markdown-body { font-size:.78rem; line-height:1.45; white-space:pre-wrap; word-wrap:break-word; }
.markdown-body :deep(code) { background:rgba(0,0,0,.05); padding:2px 4px; border-radius:4px; font-size:.65rem; }
[data-theme="dark"] .markdown-body :deep(code) { background:#273142; }
.editor-wrap { display:flex; flex-direction:column; gap:.5rem; }
.edit-actions { display:flex; gap:.5rem; }
.btn { background:#e2e8f0; border:none; padding:.45rem .9rem; border-radius:6px; font-size:.7rem; cursor:pointer; font-weight:500; }
.btn.primary { background:#3b82f6; color:#fff; }
.btn.subtle { background:transparent; color:var(--color-text,#334155); }
[data-theme="dark"] .btn { background:#273142; color:#cbd5e1; }
[data-theme="dark"] .btn.primary { background:#3b82f6; }
.btn:disabled { opacity:.6; cursor:not-allowed; }
</style>
