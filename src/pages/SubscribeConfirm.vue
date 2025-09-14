<template>
  <div class="confirm-page">
    <h1>Confirm Subscription</h1>
    <div v-if="!done">
      <p>Confirming your subscription...</p>
    </div>
    <p v-if="message" class="message">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useNewsletterPublic } from '../composables/blog/useNewsletterPublic'

const route = useRoute()
const token = ref<string | null>(null)
const { confirm, submitting, lastError, lastMessage } = useNewsletterPublic()
const error = lastError
const message = lastMessage
const done = ref(false)

onMounted(async () => {
  token.value = route.query.token as string || null
  if (!token.value) { done.value = true; return }
  await confirm(token.value)
  done.value = true
})
</script>
<style scoped>
.confirm-page { max-width:480px; margin:3rem auto; padding:2rem; background:#0f172a; border-radius:12px; }
.message { margin-top:1rem; color:#10b981; }
.error { margin-top:1rem; color:#f87171; }
</style>
