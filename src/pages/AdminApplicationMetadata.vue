<template>
  <DashboardLayout>
    <h1 class="dashboard-title">Application Metadata</h1>
    <div class="meta-grid">
      <section>
        <header class="section-header">
          <h2>Application Types</h2>
          <button class="btn small" @click="openTypeModal()">New Type</button>
        </header>
        <div v-if="typeLoading" class="loading">Loading...</div>
        <template v-else>
        <table v-if="applicationTypes.length" class="meta-table">
          <thead>
            <tr><th>Key</th><th>Label</th><th>Active</th><th>Rank</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="t in sortedApplicationTypes" :key="t.id">
              <td>{{ t.key }}</td>
              <td>{{ t.label }}</td>
              <td>{{ t.active ? 'Yes':'No' }}</td>
              <td>{{ t.rank ?? '-' }}</td>
              <td>
                <button class="btn tiny" @click="editType(t)">Edit</button>
                <button class="btn tiny danger" @click="confirmDeleteType(t)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="empty">No application types defined.</p>
        </template>
      </section>

      <section>
        <header class="section-header">
          <h2>User Types</h2>
          <button class="btn small" @click="openUserTypeModal()">New User Type</button>
        </header>
        <div v-if="userTypeLoading" class="loading">Loading...</div>
        <template v-else>
        <table v-if="userTypes.length" class="meta-table">
          <thead>
            <tr><th>Key</th><th>Label</th><th>Active</th><th>Rank</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="u in sortedUserTypes" :key="u.id">
              <td>{{ u.key }}</td>
              <td>{{ u.label }}</td>
              <td>{{ u.active ? 'Yes':'No' }}</td>
              <td>{{ u.rank ?? '-' }}</td>
              <td>
                <button class="btn tiny" @click="editUserType(u)">Edit</button>
                <button class="btn tiny danger" @click="confirmDeleteUserType(u)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="empty">No user types defined.</p>
        </template>
      </section>
    </div>

    <!-- Application Type Modal -->
    <div v-if="showTypeModal" class="modal-backdrop">
      <div class="modal">
        <h3>{{ editingType ? 'Edit Application Type' : 'New Application Type' }}</h3>
        <form @submit.prevent="saveType">
          <label>Key<input v-model="typeForm.key" :disabled="!!editingType" required /></label>
          <label>Label<input v-model="typeForm.label" required /></label>
          <label>Description<textarea v-model="typeForm.description" rows="2" /></label>
          <label>Rank<input type="number" v-model.number="typeForm.rank" min="0" /></label>
          <label class="chk"><input type="checkbox" v-model="typeForm.active" /> Active</label>
          <div class="modal-actions">
            <button type="button" class="btn" @click="closeTypeModal">Cancel</button>
            <button type="submit" class="btn primary" :disabled="savingType">{{ savingType ? 'Saving...' : 'Save' }}</button>
          </div>
          <div class="error" v-if="typeError">{{ typeError }}</div>
        </form>
      </div>
    </div>

    <!-- User Type Modal -->
    <div v-if="showUserTypeModal" class="modal-backdrop">
      <div class="modal">
        <h3>{{ editingUserType ? 'Edit User Type' : 'New User Type' }}</h3>
        <form @submit.prevent="saveUserType">
          <label>Key<input v-model="userTypeForm.key" :disabled="!!editingUserType" required /></label>
          <label>Label<input v-model="userTypeForm.label" required /></label>
          <label>Description<textarea v-model="userTypeForm.description" rows="2" /></label>
          <label>Rank<input type="number" v-model.number="userTypeForm.rank" min="0" /></label>
          <label class="chk"><input type="checkbox" v-model="userTypeForm.active" /> Active</label>
          <div class="modal-actions">
            <button type="button" class="btn" @click="closeUserTypeModal">Cancel</button>
            <button type="submit" class="btn primary" :disabled="savingUserType">{{ savingUserType ? 'Saving...' : 'Save' }}</button>
          </div>
          <div class="error" v-if="userTypeError">{{ userTypeError }}</div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation reuses a simple confirm -->
    <div v-if="deleteConfirm" class="modal-backdrop">
      <div class="modal">
        <h3>Confirm Delete</h3>
        <p>Delete <strong>{{ deleteConfirm.label }}</strong>? This cannot be undone.</p>
        <div class="modal-actions">
          <button class="btn" @click="deleteConfirm = null">Cancel</button>
          <button class="btn danger" @click="performDelete" :disabled="deleting">{{ deleting ? 'Deleting...' : 'Delete' }}</button>
        </div>
        <div class="error" v-if="deleteError">{{ deleteError }}</div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { useApplicationTypes } from '../composables/useApplicationTypes'
import { useUserTypes } from '../composables/useUserTypes'
import { useToasts } from '../composables/useToasts'

const { types: applicationTypes, list: listApplicationTypes, create: createAppType, update: updateAppType, remove: removeAppType, loading: typeLoading, error: typeError } = useApplicationTypes()
const { types: userTypes, list: listUserTypes, create: createUserType, update: updateUserType, remove: removeUserType, loading: userTypeLoading, error: userTypeError } = useUserTypes()
const { add: addToast } = useToasts()

const showTypeModal = ref(false)
const showUserTypeModal = ref(false)
const editingType = ref<any>(null)
const editingUserType = ref<any>(null)
const savingType = ref(false)
const savingUserType = ref(false)
const deleteConfirm = ref<any>(null)
const deleting = ref(false)
const deleteError = ref('')

const typeForm = reactive({ key: '', label: '', description: '', rank: 0, active: true })
const userTypeForm = reactive({ key: '', label: '', description: '', rank: 0, active: true })

const sortedApplicationTypes = computed(()=> [...applicationTypes.value].sort((a,b)=> (a?.rank||0)-(b?.rank||0)))
const sortedUserTypes = computed(()=> [...userTypes.value].sort((a,b)=> (a?.rank||0)-(b?.rank||0)))

function openTypeModal(){ editingType.value = null; Object.assign(typeForm,{ key:'',label:'',description:'',rank:0,active:true }); showTypeModal.value = true }
function openUserTypeModal(){ editingUserType.value = null; Object.assign(userTypeForm,{ key:'',label:'',description:'',rank:0,active:true }); showUserTypeModal.value = true }
function editType(t:any){ editingType.value = t; Object.assign(typeForm,{ key:t.key,label:t.label,description:t.description||'',rank:t.rank||0,active: t.active!==false }); showTypeModal.value = true }
function editUserType(u:any){ editingUserType.value = u; Object.assign(userTypeForm,{ key:u.key,label:u.label,description:u.description||'',rank:u.rank||0,active: u.active!==false }); showUserTypeModal.value = true }
function closeTypeModal(){ showTypeModal.value = false }
function closeUserTypeModal(){ showUserTypeModal.value = false }

async function saveType(){
  savingType.value = true
  try {
    if(editingType.value){
      await updateAppType(editingType.value.id,{ label: typeForm.label, description: typeForm.description||undefined, rank: typeForm.rank, active: typeForm.active })
      addToast({ title: 'Updated', message: 'Application type updated', type: 'success' })
    } else {
      await createAppType({ key: typeForm.key, label: typeForm.label, description: typeForm.description||undefined, rank: typeForm.rank, active: typeForm.active })
      addToast({ title: 'Created', message: 'Application type created', type: 'success' })
    }
    showTypeModal.value = false
  } catch (e:any){
    addToast({ title: 'Save Failed', message: e.message||'Failed to save application type', type: 'error', duration: 6000 })
  } finally { savingType.value = false }
}

async function saveUserType(){
  savingUserType.value = true
  try {
    if(editingUserType.value){
      await updateUserType(editingUserType.value.id,{ label: userTypeForm.label, description: userTypeForm.description||undefined, rank: userTypeForm.rank, active: userTypeForm.active })
      addToast({ title: 'Updated', message: 'User type updated', type: 'success' })
    } else {
      await createUserType({ key: userTypeForm.key, label: userTypeForm.label, description: userTypeForm.description||undefined, rank: userTypeForm.rank, active: userTypeForm.active })
      addToast({ title: 'Created', message: 'User type created', type: 'success' })
    }
    showUserTypeModal.value = false
  } catch (e:any){
    addToast({ title: 'Save Failed', message: e.message||'Failed to save user type', type: 'error', duration: 6000 })
  } finally { savingUserType.value = false }
}

function confirmDeleteType(t:any){ deleteConfirm.value = { kind:'appType', id:t.id, label: t.label } }
function confirmDeleteUserType(u:any){ deleteConfirm.value = { kind:'userType', id:u.id, label: u.label } }

async function performDelete(){
  if(!deleteConfirm.value) return
  deleting.value = true; deleteError.value=''
  try {
    if(deleteConfirm.value.kind==='appType') await removeAppType(deleteConfirm.value.id)
    else await removeUserType(deleteConfirm.value.id)
    addToast({ title: 'Deleted', message: `${deleteConfirm.value.label} removed`, type: 'success' })
    deleteConfirm.value = null
  } catch(e:any){
    deleteError.value = e.message || 'Failed to delete'
  } finally { deleting.value = false }
}

onMounted(async ()=> {
  await Promise.all([listApplicationTypes(), listUserTypes()])
})
</script>

<style scoped>
.meta-grid { display:grid; gap:1.5rem; grid-template-columns:repeat(auto-fit,minmax(360px,1fr)); }
.section-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:.75rem; }
.meta-table { width:100%; border-collapse:collapse; font-size:.75rem; }
.meta-table th, .meta-table td { border:1px solid var(--modal-border-color); padding:.4rem .5rem; }
.meta-table th { background: var(--modal-field-bg); text-transform:uppercase; font-size:.6rem; letter-spacing:.05em; color: var(--modal-muted-color); }
.empty { font-size:.75rem; color: var(--modal-muted-color); }
.btn.small { font-size:.65rem; padding:.35rem .6rem; }
.btn.tiny { font-size:.6rem; padding:.25rem .45rem; }
.modal textarea, .modal input { width:100%; }
.chk { display:flex; align-items:center; gap:.5rem; font-size:.7rem; margin-top:.25rem; }
.loading { font-size:.7rem; color: var(--modal-muted-color); }
.pill { display:inline-block; padding:.25rem .5rem; background: var(--modal-field-bg); border:1px solid var(--modal-border-color); border-radius:14px; font-size:.6rem; margin:.2rem .3rem .2rem 0; cursor:pointer; }
.pill.selected { background: var(--modal-accent-bg); color:#fff; border-color: var(--modal-accent-bg); }
</style>
