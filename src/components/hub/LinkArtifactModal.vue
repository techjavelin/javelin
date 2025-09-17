<template>
  <div v-if="open" class="modal-backdrop" @keydown.esc="close">
    <div class="modal" role="dialog" aria-modal="true">
      <header class="head">
        <h3>Upload Artifact</h3>
        <button class="close" @click="close">×</button>
      </header>
      <section class="body">
        <div class="field">
          <label>File</label>
          <input type="file" @change="onFile" />
          <p v-if="fileName" class="file-meta">{{ fileName }}</p>
        </div>
        <div class="field">
          <label>Name (optional override)</label>
          <input v-model="name" :placeholder="fileName || 'File name'" />
        </div>
        <div class="field">
          <label>Description</label>
          <textarea v-model="description" rows="3" />
        </div>
        <div class="actions">
          <button @click="submit" :disabled="submitting || !file">{{ submitting ? 'Uploading…' : 'Upload' }}</button>
        </div>
        <p v-if="error" class="error">{{ error }}</p>
      </section>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useArtifacts } from '@/composables/useArtifacts'

interface Props { open: boolean; organizationId: string; engagementId?: string; applicationId?: string }
const props = defineProps<Props>()
const emit = defineEmits(['close','uploaded'])

const { upload, error } = useArtifacts()
const file = ref<File | null>(null)
const fileName = ref('')
const name = ref('')
const description = ref('')
const submitting = ref(false)

watch(()=>props.open, (o)=> { if (o) reset() })

function reset(){ file.value=null; fileName.value=''; name.value=''; description.value='' }
function onFile(e: Event){
  const input = e.target as HTMLInputElement
  if (input.files && input.files.length){
    file.value = input.files[0]
    fileName.value = input.files[0].name
  }
}

async function submit(){
  if (!file.value) return
  submitting.value=true
  try {
    await upload({ file: file.value, organizationId: props.organizationId, engagementId: props.engagementId, applicationId: props.applicationId, name: name.value || undefined, description: description.value || undefined })
    emit('uploaded')
    close()
  } finally { submitting.value=false }
}

function close(){ emit('close') }
</script>
<style scoped>
.modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.55); display:flex; align-items:center; justify-content:center; padding:1rem; z-index:1000; }
.modal { width:500px; max-width:100%; background:#0f172a; border:1px solid #243049; border-radius:10px; padding:0 0 1rem; display:flex; flex-direction:column; gap:.75rem; }
.head { display:flex; align-items:center; justify-content:space-between; padding:.9rem 1rem .6rem; border-bottom:1px solid #243049; }
.head h3 { margin:0; font-size:.8rem; letter-spacing:.06em; }
.close { background:transparent; border:none; color:#94a3b8; font-size:1rem; cursor:pointer; }
.body { padding:.75rem 1rem 0; display:flex; flex-direction:column; gap:.75rem; }
.field { display:flex; flex-direction:column; gap:.35rem; }
.field label { font-size:.55rem; letter-spacing:.06em; opacity:.75; }
input, select, textarea { background:#1e293b; border:1px solid #334155; color:#fff; padding:.45rem .55rem; font-size:.6rem; border-radius:6px; font-family:inherit; }
textarea { resize:vertical; }
.actions { display:flex; justify-content:flex-end; }
.actions button { background:#2563eb; border:none; padding:.5rem 1rem; font-size:.6rem; border-radius:6px; color:#fff; cursor:pointer; }
.error { font-size:.55rem; color:#f87171; margin:0; }
</style>
