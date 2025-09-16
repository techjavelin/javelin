<template>
  <div v-if="open" class="modal-backdrop" @keydown.esc="close">
    <div class="modal" role="dialog" aria-modal="true">
      <header class="head">
        <h3>Link Artifact</h3>
        <button class="close" @click="close">×</button>
      </header>
      <section class="body">
        <div class="field">
          <label>Provider</label>
          <select v-model="provider">
            <option v-for="p in providers" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>
        <div class="field">
          <label>Document Type</label>
          <select v-model="documentType">
            <option value="">(optional)</option>
            <option v-for="d in docTypes" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>
        <div class="field">
          <label>Name</label>
          <input v-model="name" />
        </div>
        <div class="field">
          <label>External ID</label>
          <input v-model="externalId" />
        </div>
        <div class="field">
          <label>Description</label>
          <textarea v-model="description" rows="3" />
        </div>
        <div class="actions">
          <button @click="submit" :disabled="submitting || !name || !externalId">Create</button>
        </div>
        <p v-if="error" class="error">{{ error }}</p>
      </section>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useHubArtifacts } from '@/composables/useHubArtifacts'

interface Props { open: boolean; organizationId: string; engagementId?: string }
const props = defineProps<Props>()
const emit = defineEmits(['close','created'])

const { create, loading, error } = useHubArtifacts()
const providers = ['PANDADOC','QUICKBOOKS','OTHER']
const docTypes = ['NDA','SOW','RULES_OF_ENGAGEMENT','ESTIMATE','OTHER']
const provider = ref(providers[0])
const documentType = ref('')
const name = ref('')
const externalId = ref('')
const description = ref('')
const submitting = ref(false)

watch(() => props.open, (o) => { if (o) reset() })

function reset(){ provider.value=providers[0]; documentType.value=''; name.value=''; externalId.value=''; description.value='' }

async function submit(){
  submitting.value=true
  try {
    await create({ provider: provider.value as any, name: name.value, externalId: externalId.value, description: description.value||undefined, organizationId: props.organizationId, engagementId: props.engagementId, documentType: documentType.value || undefined } as any)
    emit('created')
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
