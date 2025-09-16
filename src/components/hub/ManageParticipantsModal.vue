<template>
  <div v-if="open" class="modal-backdrop" @keydown.esc="close">
    <div class="modal" role="dialog" aria-modal="true">
      <header class="head">
        <h3>Manage Participants</h3>
        <button class="close" @click="close">×</button>
      </header>
      <section class="body" v-if="!loading">
        <div class="add-row">
          <input v-model="userId" placeholder="User ID" />
          <select v-model="role">
            <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
          </select>
          <button @click="add" :disabled="!userId || adding">Add</button>
        </div>
        <ul class="plist">
          <li v-for="p in participants" :key="p.userId">
            <span class="uid">{{ p.userId }}</span>
            <select v-model="editRoles[p.userId]" @change="update(p)">
              <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
            </select>
            <button class="danger" @click="remove(p)">Remove</button>
          </li>
        </ul>
        <p v-if="!participants.length" class="placeholder">No participants yet.</p>
      </section>
      <div v-else class="loading">Loading…</div>
      <footer class="foot">
        <button @click="close">Close</button>
      </footer>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useEngagementParticipants } from '@/composables/useEngagementParticipants'

interface Props { open: boolean; engagementId: string; applicationId: string; organizationId: string }
const props = defineProps<Props>()
const emit = defineEmits(['close','changed'])

const { participants, list, assign, remove: removeAssign, updateRole, loading, error } = useEngagementParticipants()

const roles = ['ENG_PENTESTER','ENG_CLIENT_ADMIN','ENG_COLLABORATOR','ENG_READ_ONLY']
const userId = ref('')
const role = ref(roles[0])
const adding = ref(false)
const editRoles = ref<Record<string,string>>({})

watch(() => props.open, (o) => { if (o) refresh() })

async function refresh(){
  if (!props.engagementId) return
  await list(props.engagementId)
  editRoles.value = Object.fromEntries(participants.value.map(p => [p.userId, p.role]))
}

async function add(){
  if (!userId.value) return
  adding.value = true
  try {
    await assign({ engagementId: props.engagementId, applicationId: props.applicationId, organizationId: props.organizationId, userId: userId.value, role: role.value as any })
    userId.value=''
    emit('changed')
  } finally { adding.value=false }
}

async function update(p:any){
  const newRole = editRoles.value[p.userId]
  if (newRole && newRole !== p.role){
    await updateRole(props.engagementId, p.userId, newRole as any)
    emit('changed')
  }
}

async function remove(p:any){
  if (!confirm('Remove participant?')) return
  await removeAssign(p.userId, props.engagementId)
  emit('changed')
}

function close(){ emit('close') }
</script>
<style scoped>
.modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.55); display:flex; align-items:center; justify-content:center; padding:1rem; z-index:1000; }
.modal { width:600px; max-width:100%; background:#0f172a; border:1px solid #243049; border-radius:10px; padding:0; display:flex; flex-direction:column; gap:.75rem; max-height:80vh; overflow:auto; }
.head { display:flex; align-items:center; justify-content:space-between; padding:.9rem 1rem .6rem; border-bottom:1px solid #243049; }
.head h3 { margin:0; font-size:.8rem; letter-spacing:.06em; }
.close { background:transparent; border:none; color:#94a3b8; font-size:1rem; cursor:pointer; }
.body { padding:.75rem 1rem 1rem; display:flex; flex-direction:column; gap:.75rem; }
.add-row { display:flex; gap:.5rem; }
.add-row input, .add-row select { flex:1; background:#1e293b; border:1px solid #334155; color:#fff; padding:.4rem .5rem; font-size:.6rem; border-radius:6px; }
.add-row button { background:#2563eb; border:none; padding:.45rem .9rem; font-size:.6rem; border-radius:6px; color:#fff; cursor:pointer; }
.plist { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:.5rem; }
.plist li { display:flex; gap:.5rem; align-items:center; background:#1e293b; border:1px solid #334155; padding:.5rem .6rem; border-radius:6px; font-size:.6rem; }
.uid { flex:1; font-weight:600; }
.plist select { background:#0f1d33; border:1px solid #334155; color:#fff; padding:.25rem .4rem; border-radius:5px; font-size:.55rem; }
.danger { background:#7f1d1d; border:none; padding:.3rem .6rem; font-size:.55rem; color:#fff; border-radius:6px; cursor:pointer; }
.placeholder { font-size:.6rem; opacity:.7; margin:0; }
.loading { padding:2rem; text-align:center; }
.foot { padding:0 1rem 1rem; display:flex; justify-content:flex-end; }
.foot button { background:#334155; border:1px solid #475569; color:#fff; font-size:.6rem; padding:.45rem .9rem; border-radius:6px; cursor:pointer; }
.error { margin:0 1rem 1rem; font-size:.55rem; color:#f87171; }
</style>
