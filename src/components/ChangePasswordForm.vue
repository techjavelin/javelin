<template>
  <form class="change-password-form" @submit.prevent="submit" v-if="visible">
    <h3>Change Password</h3>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="success" class="success">{{ success }}</div>
    <label class="field">
      <span>Current Password</span>
      <input type="password" v-model="oldPass" required :disabled="loading" autocomplete="current-password" />
    </label>
    <label class="field">
      <span>New Password</span>
      <input type="password" v-model="newPass" required minlength="8" :disabled="loading" autocomplete="new-password" />
    </label>
    <label class="field">
      <span>Confirm New Password</span>
      <input type="password" v-model="confirmPass" required minlength="8" :disabled="loading" autocomplete="new-password" />
    </label>
    <div class="actions">
      <button type="submit" :disabled="loading || !canSubmit">{{ loading ? 'Updating...' : 'Update Password' }}</button>
      <button type="button" @click="$emit('close')" :disabled="loading">Cancel</button>
    </div>
  </form>
</template>
<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import { useAuth } from '@/composables/useAuth'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'success'): void; (e: 'close'): void }>()
const auth = useAuth()

const oldPass = ref('')
const newPass = ref('')
const confirmPass = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)

const canSubmit = computed(()=> !!oldPass.value && newPass.value.length>=8 && newPass.value===confirmPass.value)

watchEffect(()=>{
  if(!props.visible){
    oldPass.value = ''
    newPass.value = ''
    confirmPass.value = ''
    error.value = ''
    success.value = ''
  }
})

async function submit(){
  if(!canSubmit.value) return
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    await auth.changePassword(oldPass.value, newPass.value)
    success.value = 'Password updated successfully.'
    emit('success')
    setTimeout(()=>emit('close'), 1200)
  } catch(e:any){
    error.value = e?.message || 'Failed to update password'
  } finally {
    loading.value = false
  }
}
</script>
<style scoped>
.change-password-form { padding:1rem; border:1px solid #eee; border-radius:8px; max-width:400px; display:flex; flex-direction:column; gap:0.75rem; }
.field { display:flex; flex-direction:column; gap:0.25rem; font-size:0.9rem; }
.field input { padding:0.5rem 0.6rem; border:1px solid #ccc; border-radius:6px; }
.actions { display:flex; gap:0.5rem; }
.actions button { flex:1; padding:0.6rem 0.8rem; cursor:pointer; border-radius:6px; border:1px solid #2566af; background:#2566af; color:#fff; font-weight:500; }
.actions button[type=button] { background:#f5f5f5; color:#333; border-color:#ccc; }
.error { background:#fef2f2; color:#b91c1c; padding:0.5rem; border:1px solid #fecaca; border-radius:6px; font-size:0.8rem; }
.success { background:#ecfdf5; color:#047857; padding:0.5rem; border:1px solid #a7f3d0; border-radius:6px; font-size:0.8rem; }
</style>
