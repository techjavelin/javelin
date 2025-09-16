<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useEngagementParticipants } from '@/composables/useEngagementParticipants'
import { useAuthorization } from '@/composables/useAuthorization'
import { useToasts } from '@/composables/useToasts'

interface Props { engagementId: string; organizationId?: string; applicationId?: string }
const props = defineProps<Props>()

const { participants, list, assign, remove, updateRole, loading, error } = useEngagementParticipants()
const { has } = useAuthorization()
const { add: addToast } = useToasts()

const newUserId = ref('')
const newRole = ref('ENG_COLLABORATOR')

async function load(){ if(props.engagementId) await list(props.engagementId) }

onMounted(load)
watch(()=>props.engagementId, id=>{ if(id) load() })

async function addParticipant(){
  if(!props.engagementId || !newUserId.value) return
  try {
    await assign({ engagementId: props.engagementId, userId: newUserId.value, role: newRole.value as any, organizationId: props.organizationId || '', applicationId: props.applicationId || '' })
    addToast({ title:'Participant Added', message: newUserId.value, type:'success' })
    newUserId.value = ''
  } catch(e:any){ addToast({ title:'Error', message: e.message || 'Failed', type:'error' }) }
}

async function removeParticipant(userId: string){
  try { await remove(userId, props.engagementId); addToast({ title:'Removed', message:userId, type:'success' }) } catch(e:any){ addToast({ title:'Error', message:e.message||'Failed', type:'error'}) }
}

const editing = ref<string | null>(null)
const roleDraft = ref<string>('')
function beginEdit(p: any){ editing.value = p.userId; roleDraft.value = p.role }
function cancelEdit(){ editing.value = null }
async function saveRole(p: any){
  try {
    await updateRole(p.engagementId, p.userId, roleDraft.value as any)
    addToast({ title:'Role Updated', message: p.userId, type:'success' })
    editing.value = null
  } catch(e:any){ addToast({ title:'Error', message:e.message||'Failed', type:'error'}) }
}
</script>

<template>
  <div class="participants-tab">
    <div v-if="loading" class="state">Loading participants…</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <div class="actions" v-if="has('ENG.MANAGE',{ engagementId: props.engagementId })">
      <input v-model="newUserId" placeholder="User ID/email" class="input small" />
      <select v-model="newRole" class="input small">
        <option value="ENG_PENTESTER">Pentester</option>
        <option value="ENG_CLIENT_ADMIN">Client Admin</option>
        <option value="ENG_COLLABORATOR">Collaborator</option>
        <option value="ENG_READ_ONLY">Read Only</option>
      </select>
      <button class="btn primary" @click="addParticipant" :disabled="!newUserId || loading">Add</button>
    </div>
    <table class="participants-table" v-if="participants.length">
      <thead>
        <tr><th>User</th><th>Role</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="p in participants" :key="p.userId">
          <td>{{ p.userId }}</td>
          <td>
            <div v-if="editing===p.userId" class="inline-edit">
              <select v-model="roleDraft" class="input small">
                <option value="ENG_PENTESTER">Pentester</option>
                <option value="ENG_CLIENT_ADMIN">Client Admin</option>
                <option value="ENG_COLLABORATOR">Collaborator</option>
                <option value="ENG_READ_ONLY">Read Only</option>
              </select>
              <button class="btn tiny" @click="saveRole(p)">Save</button>
              <button class="btn tiny" @click="cancelEdit">Cancel</button>
            </div>
            <div v-else class="role-display">
              {{ p.role }}
              <button v-if="has('ENG.MANAGE',{ engagementId: props.engagementId })" class="link-btn" @click="beginEdit(p)">Edit</button>
            </div>
          </td>
          <td>
            <button v-if="has('ENG.MANAGE',{ engagementId: props.engagementId })" class="btn tiny danger" @click="removeParticipant(p.userId)">Remove</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else class="empty">No participants yet.</p>
  </div>
</template>

<style scoped>
.participants-tab { display:flex; flex-direction:column; gap:.75rem; }
.actions { display:flex; gap:.5rem; flex-wrap:wrap; align-items:center; }
.input.small { padding:.35rem .55rem; font-size:.7rem; border:1px solid var(--color-border,#d1d5db); border-radius:4px; }
.participants-table { width:100%; border-collapse:collapse; font-size:.7rem; }
.participants-table th, .participants-table td { text-align:left; padding:.4rem .5rem; border-bottom:1px solid var(--color-border,#e5e7eb); }
.btn { background:#e2e8f0; border:none; padding:.4rem .7rem; border-radius:5px; font-size:.65rem; cursor:pointer; }
.btn.primary { background:#3b82f6; color:#fff; }
.btn.tiny { padding:.25rem .5rem; font-size:.6rem; }
.btn.danger { background:#dc2626; color:#fff; }
.inline-edit { display:flex; gap:.35rem; align-items:center; flex-wrap:wrap; }
.role-display { display:flex; gap:.4rem; align-items:center; }
.link-btn { background:transparent; border:none; color:#2563eb; font-size:.55rem; cursor:pointer; padding:0; }
.link-btn:hover { text-decoration:underline; }
.state { font-size:.75rem; }
.empty { opacity:.6; font-size:.65rem; }
</style>
