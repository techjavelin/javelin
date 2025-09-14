<template>
  <div class="subscribe-page">
    <h1>Subscribe to our Newsletter</h1>
    <form @submit.prevent="submit">
      <label>Email
        <input v-model="email" type="email" required />
      </label>
      <label>Name
        <input v-model="name" type="text" />
      </label>
      <button :disabled="submitting">{{ submitting ? 'Submitting...' : 'Subscribe' }}</button>
    </form>
    <p v-if="message" class="message">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useNewsletterPublic } from '../composables/blog/useNewsletterPublic'

const { startSubscription, submitting, lastError, lastMessage } = useNewsletterPublic()
const email = ref('')
const name = ref('')

const error = lastError
const message = lastMessage

async function submit() {
  await startSubscription(email.value, name.value)
}
</script>
<style scoped>
.subscribe-page { max-width:480px; margin:3rem auto; padding:2rem; background:#0f172a; border-radius:12px; }
label { display:flex; flex-direction:column; gap:.35rem; margin-bottom:1rem; font-size:.8rem; text-transform:uppercase; letter-spacing:.05em; color:#94a3b8; }
input { padding:.65rem .75rem; border-radius:8px; border:1px solid #334155; background:#1e293b; color:#e2e8f0; }
button { background:#2563eb; color:#fff; border:none; padding:.65rem 1.25rem; border-radius:8px; cursor:pointer; }
button:disabled { opacity:.6; }
.message { margin-top:1rem; color:#10b981; }
.error { margin-top:1rem; color:#f87171; }
</style>
