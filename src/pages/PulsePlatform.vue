
<template>
  <PageWrapper title="Pulse Platform Home">
    <h1>Welcome to Pulse Platform</h1>
    <div class="card-grid">
      <div class="module-card">
        <h2>SigInt</h2>
        <p>
          Signals Intelligence (SigInt) provides advanced monitoring, threat detection, and intelligence gathering capabilities for your organization. Use SigInt to stay ahead of emerging threats and gain actionable insights.
        </p>
        <template v-if="isAdminUser">
          <button class="cta-btn" @click="onSigIntLaunch">Launch</button>
          <button class="cta-btn secondary" @click="onSigIntLearnMore">Learn More</button>
        </template>
        <template v-else>
          <button class="cta-btn" @click="isSigIntUser ? onSigIntLaunch() : onSigIntLearnMore()">
            {{ isSigIntUser ? 'Launch' : 'Learn More' }}
          </button>
        </template>
      </div>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">

import { onMounted, computed } from 'vue'
import PageWrapper from '@/components/PageWrapper.vue'
import { useAuth } from '@/composables/useAuth'

const { userGroups, loadCurrentUser } = useAuth()
const isSigIntUser = computed(() => userGroups.value.includes('pulse-sigint'))
const isAdminUser = computed(() => userGroups.value.includes('admin'))

onMounted(() => {
  loadCurrentUser()
})

function onSigIntLaunch() {
  window.location.href = '/sigint'
}

function onSigIntLearnMore() {
  window.open('https://docs.pulse.techjavelin.com/sigint', '_blank')
}
</script>

<style scoped>
.card-grid {
  display: flex;
  gap: 2rem;
  margin-top: 2rem;
}
.module-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  padding: 2rem;
  max-width: 400px;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.module-card h2 {
  margin-bottom: 0.5rem;
}
.module-card p {
  margin-bottom: 1.5rem;
}
.cta-btn {
  background: #1a73e8;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
.cta-btn:hover {
  background: #155ab6;
}
.cta-btn.secondary {
  background: #e0e0e0;
  color: #222;
  margin-left: 1rem;
}
.cta-btn.secondary:hover {
  background: #cccccc;
}
</style>
