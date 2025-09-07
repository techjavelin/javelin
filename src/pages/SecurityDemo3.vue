<template>
  <div class="security-demo-bg">
  <SecurityDemoNav />
    <main class="security-demo-main">
      <h1 class="security-demo-title">Threat Intelligence for All</h1>
      <div class="security-hero">
        <svg width="220" height="60"><polyline points="0,40 20,20 40,30 60,10 80,40 100,20 120,50 140,30 160,40 180,20 200,40 220,30" fill="none" stroke="#ff61a6" stroke-width="4"><animate attributeName="points" values="0,40 20,20 40,30 60,10 80,40 100,20 120,50 140,30 160,40 180,20 200,40 220,30;0,30 20,40 40,20 60,30 80,10 100,40 120,20 140,50 160,30 180,40 200,20 220,40" dur="2s" repeatCount="indefinite"/></polyline></svg>
        <div class="security-eye">
          <svg width="40" height="40" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="10" ry="6" fill="#ff61a6" opacity="0.15"/><ellipse cx="12" cy="12" rx="8" ry="4.5" fill="#fff" stroke="#ff61a6" stroke-width="2"/><circle cx="12" cy="12" r="2" fill="#ff61a6"/></svg>
        </div>
      </div>
      <div class="security-demo-card">
        <h2>Real-Time Threat Feeds</h2>
        <p>Get actionable threat intelligence and alerts, tailored for startups and growing teams.</p>
      </div>
      <button class="security-demo-btn">Explore Threats</button>
    </main>
  </div>
</template>

<style scoped>
</style>
<script setup>
import SecurityDemoNav from '@/components/SecurityDemoNav.vue'
</script>


