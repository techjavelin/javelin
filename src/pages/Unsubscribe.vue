<template>
  <div class="unsubscribe-page">
    <h1>Unsubscribe</h1>
    <form v-if="mode==='request'" @submit.prevent="submitRequest">
      <label>Email
        <input v-model="email" type="email" required />
      </label>
      <button :disabled="submitting">{{ submitting ? 'Sending...' : 'Send Unsubscribe Link' }}</button>
    </form>
    <div v-else>
      <p>Processing unsubscribe...</p>
    </div>
    <p v-if="message" class="message">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useNewsletterPublic } from '../composables/blog/useNewsletterPublic'

const route = useRoute()
const { requestUnsubscribe, finalizeUnsubscribe, submitting, lastError, lastMessage } = useNewsletterPublic()
const email = ref('')
const mode = ref<'request' | 'finalize'>('request')
const error = lastError
const message = lastMessage

onMounted(async () => {
  const token = route.query.token as string | undefined
  if (token) {
    mode.value = 'finalize'
    await finalizeUnsubscribe(token)
  }
})

async function submitRequest() {
  await requestUnsubscribe(email.value)
}
</script>
<style scoped>
.unsubscribe-page { max-width:480px; margin:3rem auto; padding:2rem; background:#0f172a; border-radius:12px; }
label { display:flex; flex-direction:column; gap:.35rem; margin-bottom:1rem; font-size:.8rem; text-transform:uppercase; letter-spacing:.05em; color:#94a3b8; }
input { padding:.65rem .75rem; border-radius:8px; border:1px solid #334155; background:#1e293b; color:#e2e8f0; }
button { background:#2563eb; color:#fff; border:none; padding:.65rem 1.25rem; border-radius:8px; cursor:pointer; }
button:disabled { opacity:.6; }
.message { margin-top:1rem; color:#10b981; }
.error { margin-top:1rem; color:#f87171; }
</style>
