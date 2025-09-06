
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
import { ref, onMounted } from 'vue'
import PageWrapper from '@/components/PageWrapper.vue'
import { getCurrentUser } from 'aws-amplify/auth'

const isSigIntUser = ref(false)
const isAdminUser = ref(false)

async function checkSigIntGroup() {
  try {
    const user = await getCurrentUser()
    const payload = (user as any)?.signInDetails?.tokenPayload || {}
    let groups = payload['cognito:groups'] || payload['groups'] || []
    if (typeof groups === 'string') groups = [groups]
    console.log('User groups:', groups)
    isSigIntUser.value = Array.isArray(groups) && groups.includes('pulse-sigint')
    isAdminUser.value = Array.isArray(groups) && groups.includes('admin')
  } catch (e) {
    isSigIntUser.value = false
    isAdminUser.value = false
  }
}

onMounted(() => {
  checkSigIntGroup()
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
